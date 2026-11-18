import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  bookings,
  foodOrderItems,
  foodOrders,
  payments,
  products,
  psTables,
  psUnits,
} from "@/db/schema";
import { ApiError, paymentReference, randomCode } from "@/lib/api";
import {
  ACTIVE_ORDER_STATUSES,
  isActiveOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";

const MAX_TOTAL_QUANTITY = 30;

/**
 * F&B orders settle online with QRIS, mirroring the booking flow. Stock is
 * reserved when the order is created, so an unpaid order is cancelled (and the
 * stock restored) once this window lapses.
 */
export const FOOD_PAYMENT_HOLD_MINUTES = 15;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Product = typeof products.$inferSelect;

export type OrderItemView = {
  id: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderPaymentView = {
  reference: string;
  method: string;
  amount: number;
  status: string;
  paidAt: Date | null;
};

export type OrderView = {
  id: number;
  code: string;
  customerName: string;
  customerWhatsapp: string;
  status: OrderStatus;
  subtotal: number;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
  tableNumber: string | null;
  bookingCode: string | null;
  items: OrderItemView[];
  payment: OrderPaymentView | null;
  /** When an unpaid QRIS order stops holding stock, null once settled. */
  paymentExpiresAt: Date | null;
};

export type TableOption = { id: number; tableNumber: string };

export async function listTables(): Promise<TableOption[]> {
  return db
    .select({ id: psTables.id, tableNumber: psTables.tableNumber })
    .from(psTables)
    .where(eq(psTables.isActive, true))
    .orderBy(asc(psTables.tableNumber));
}

export async function listProducts() {
  return db
    .select()
    .from(products)
    .orderBy(asc(products.category), asc(products.name));
}

function assertQuantity(total: number) {
  if (total > MAX_TOTAL_QUANTITY) {
    throw new ApiError(
      400,
      `Maksimal ${MAX_TOTAL_QUANTITY} item per pesanan.`,
      "quantity_too_large",
    );
  }
}

export type CreateOrderInput = {
  customerName: string;
  whatsapp: string;
  tableId?: number;
  bookingCode?: string;
  items: { productId: number; quantity: number }[];
};

async function uniqueOrderCode(tx: Tx): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = `ORD-${randomCode(6)}`;
    const existing = await tx
      .select({ id: foodOrders.id })
      .from(foodOrders)
      .where(eq(foodOrders.orderCode, code))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new ApiError(500, "Gagal membuat kode pesanan.", "code_generation_failed");
}

/**
 * Stock is reserved (decremented) when the order is created, inside a
 * transaction with row locks. That is the only way to reliably prevent
 * overselling under concurrent orders; cancelling the order restores it.
 */
export async function createOrder(input: CreateOrderInput) {
  const merged = new Map<number, number>();
  for (const item of input.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  const ids = [...merged.keys()].sort((a, b) => a - b);
  if (ids.length === 0) {
    throw new ApiError(400, "Pesanan tidak memiliki item.", "empty_order");
  }
  assertQuantity([...merged.values()].reduce((sum, qty) => sum + qty, 0));

  return db.transaction(async (tx) => {
    let tableId = input.tableId ?? null;
    let bookingId: number | null = null;
    let bookingCode: string | null = null;

    if (input.bookingCode) {
      const [row] = await tx
        .select({
          id: bookings.id,
          code: bookings.bookingCode,
          status: bookings.bookingStatus,
        })
        .from(bookings)
        .where(eq(bookings.bookingCode, input.bookingCode.toUpperCase()))
        .limit(1);

      if (!row) {
        throw new ApiError(404, "Kode booking tidak ditemukan.", "booking_not_found");
      }
      if (row.status !== "confirmed" && row.status !== "in_use") {
        throw new ApiError(
          409,
          "Booking belum aktif. Selesaikan pembayaran terlebih dahulu.",
          "booking_not_active",
        );
      }

      const [unit] = await tx
        .select({ tableId: psUnits.tableId })
        .from(bookings)
        .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
        .where(eq(bookings.id, row.id))
        .limit(1);

      if (!unit?.tableId) {
        throw new ApiError(409, "Booking belum memiliki meja.", "table_missing");
      }
      if (tableId && tableId !== unit.tableId) {
        throw new ApiError(
          400,
          "Nomor meja tidak cocok dengan kode booking.",
          "table_mismatch",
        );
      }
      tableId = unit.tableId;
      bookingId = row.id;
      bookingCode = row.code;
    }

    if (!tableId) {
      throw new ApiError(
        400,
        "Pilih nomor meja atau masukkan kode booking.",
        "table_required",
      );
    }

    const [table] = await tx
      .select({ id: psTables.id, tableNumber: psTables.tableNumber })
      .from(psTables)
      .where(and(eq(psTables.id, tableId), eq(psTables.isActive, true)))
      .limit(1);

    if (!table) {
      throw new ApiError(404, "Meja tidak ditemukan.", "table_not_found");
    }

    // Lock product rows in a stable order to avoid deadlocks between
    // concurrent orders that contain the same products in different order.
    const productRows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, ids))
      .orderBy(asc(products.id))
      .for("update");

    if (productRows.length !== ids.length) {
      throw new ApiError(404, "Ada produk yang tidak ditemukan.", "product_not_found");
    }

    const byId = new Map(productRows.map((product) => [product.id, product]));
    const lines: { product: Product; quantity: number; lineTotal: number }[] = [];

    for (const id of ids) {
      const product = byId.get(id);
      const quantity = merged.get(id) ?? 0;
      if (!product) {
        throw new ApiError(404, "Ada produk yang tidak ditemukan.", "product_not_found");
      }
      if (!product.isAvailable) {
        throw new ApiError(
          409,
          `${product.name} sedang tidak tersedia.`,
          "product_unavailable",
        );
      }
      if (product.stockQuantity < quantity) {
        throw new ApiError(
          409,
          `Stok ${product.name} tidak cukup (tersisa ${product.stockQuantity}).`,
          "insufficient_stock",
        );
      }
      lines.push({ product, quantity, lineTotal: product.price * quantity });
    }

    for (const line of lines) {
      await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} - ${line.quantity}`,
        })
        .where(eq(products.id, line.product.id));
    }

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const code = await uniqueOrderCode(tx);

    const [order] = await tx
      .insert(foodOrders)
      .values({
        orderCode: code,
        bookingId,
        tableId,
        customerName: input.customerName,
        customerWhatsapp: input.whatsapp,
        status: "new",
        subtotal,
        paymentStatus: "pending",
      })
      .returning();

    const itemRows = await tx
      .insert(foodOrderItems)
      .values(
        lines.map((line) => ({
          foodOrderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          unitPrice: line.product.price,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
      )
      .returning();

    const [payment] = await tx
      .insert(payments)
      .values({
        foodOrderId: order.id,
        paymentReference: paymentReference(),
        method: "qris",
        amount: subtotal,
        status: "pending",
      })
      .returning();

    await tx.insert(auditLogs).values({
      actorType: "customer",
      actorId: null,
      action: "order.created",
      entity: "food_order",
      entityId: String(order.id),
      meta: {
        orderCode: order.orderCode,
        tableNumber: table.tableNumber,
        bookingCode,
        subtotal,
        paymentReference: payment.paymentReference,
        items: lines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      },
    });

    return {
      order,
      items: itemRows,
      tableNumber: table.tableNumber,
      payment,
    };
  });
}

async function itemsForOrders(orderIds: number[]): Promise<Map<number, OrderItemView[]>> {
  if (orderIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: foodOrderItems.foodOrderId,
      itemId: foodOrderItems.id,
      productId: foodOrderItems.productId,
      productName: foodOrderItems.productName,
      unitPrice: foodOrderItems.unitPrice,
      quantity: foodOrderItems.quantity,
      lineTotal: foodOrderItems.lineTotal,
    })
    .from(foodOrderItems)
    .where(inArray(foodOrderItems.foodOrderId, orderIds))
    .orderBy(asc(foodOrderItems.id));

  const grouped = new Map<number, OrderItemView[]>();
  for (const row of rows) {
    const list = grouped.get(row.id) ?? [];
    list.push({
      id: row.itemId,
      productId: row.productId,
      productName: row.productName,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      lineTotal: row.lineTotal,
    });
    grouped.set(row.id, list);
  }
  return grouped;
}

export async function restoreOrderStock(tx: Tx, orderId: number) {
  const items = await tx
    .select({
      productId: foodOrderItems.productId,
      quantity: foodOrderItems.quantity,
    })
    .from(foodOrderItems)
    .where(eq(foodOrderItems.foodOrderId, orderId));

  for (const item of items) {
    if (item.productId === null) continue;
    await tx
      .update(products)
      .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
}

/**
 * Lazy expiry, called before order reads. Unpaid QRIS orders hold stock, so
 * they are cancelled once the payment window lapses. Payment rows are locked
 * first (same order as the webhook path) to avoid deadlocks.
 */
export async function expireStaleOrderPayments(): Promise<number> {
  const cutoff = new Date(Date.now() - FOOD_PAYMENT_HOLD_MINUTES * 60_000);

  return db.transaction(async (tx) => {
    const stale = await tx
      .select({ id: foodOrders.id })
      .from(foodOrders)
      .where(
        and(
          eq(foodOrders.paymentStatus, "pending"),
          lt(foodOrders.createdAt, cutoff),
          sql`${foodOrders.status} <> 'cancelled'`,
        ),
      );

    let expired = 0;
    for (const row of stale) {
      const [payment] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(eq(payments.foodOrderId, row.id), eq(payments.status, "pending")),
        )
        .for("update")
        .limit(1);
      if (!payment) continue;

      const [updated] = await tx
        .update(foodOrders)
        .set({
          status: "cancelled",
          paymentStatus: "expired",
          updatedAt: new Date(),
        })
        .where(
          and(eq(foodOrders.id, row.id), eq(foodOrders.paymentStatus, "pending")),
        )
        .returning({ id: foodOrders.id });
      if (!updated) continue;

      await restoreOrderStock(tx, row.id);
      await tx
        .update(payments)
        .set({ status: "expired" })
        .where(eq(payments.id, payment.id));

      await tx.insert(auditLogs).values({
        actorType: "system",
        actorId: null,
        action: "order.expired",
        entity: "food_order",
        entityId: String(row.id),
        meta: { reason: "payment_timeout", minutes: FOOD_PAYMENT_HOLD_MINUTES },
      });
      expired += 1;
    }

    return expired;
  });
}

async function loadOrderPayment(orderId: number): Promise<OrderPaymentView | null> {
  const [payment] = await db
    .select({
      reference: payments.paymentReference,
      method: payments.method,
      amount: payments.amount,
      status: payments.status,
      paidAt: payments.paidAt,
    })
    .from(payments)
    .where(eq(payments.foodOrderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return payment ?? null;
}

function toOrderView(
  row: {
    id: number;
    orderCode: string;
    customerName: string;
    customerWhatsapp: string;
    status: string;
    subtotal: number;
    paymentStatus: string;
    createdAt: Date;
    updatedAt: Date;
    tableNumber: string | null;
    bookingCode: string | null;
  },
  items: OrderItemView[],
  payment: OrderPaymentView | null = null,
): OrderView {
  return {
    id: row.id,
    code: row.orderCode,
    customerName: row.customerName,
    customerWhatsapp: row.customerWhatsapp,
    status: row.status as OrderStatus,
    subtotal: row.subtotal,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tableNumber: row.tableNumber,
    bookingCode: row.bookingCode,
    items,
    payment,
    paymentExpiresAt:
      payment?.status === "pending"
        ? new Date(row.createdAt.getTime() + FOOD_PAYMENT_HOLD_MINUTES * 60_000)
        : null,
  };
}

export async function getOrderByCode(code: string): Promise<OrderView | null> {
  await expireStaleOrderPayments();

  const [row] = await db
    .select({
      id: foodOrders.id,
      orderCode: foodOrders.orderCode,
      customerName: foodOrders.customerName,
      customerWhatsapp: foodOrders.customerWhatsapp,
      status: foodOrders.status,
      subtotal: foodOrders.subtotal,
      paymentStatus: foodOrders.paymentStatus,
      createdAt: foodOrders.createdAt,
      updatedAt: foodOrders.updatedAt,
      tableNumber: psTables.tableNumber,
      bookingCode: bookings.bookingCode,
    })
    .from(foodOrders)
    .leftJoin(psTables, eq(foodOrders.tableId, psTables.id))
    .leftJoin(bookings, eq(foodOrders.bookingId, bookings.id))
    .where(eq(foodOrders.orderCode, code.toUpperCase()))
    .limit(1);

  if (!row) return null;
  const [items, payment] = await Promise.all([
    itemsForOrders([row.id]),
    loadOrderPayment(row.id),
  ]);
  return toOrderView(row, items.get(row.id) ?? [], payment);
}

export async function listOrders({
  activeOnly = false,
  limit = 60,
}: { activeOnly?: boolean; limit?: number } = {}): Promise<OrderView[]> {
  await expireStaleOrderPayments();

  const rows = await db
    .select({
      id: foodOrders.id,
      orderCode: foodOrders.orderCode,
      customerName: foodOrders.customerName,
      customerWhatsapp: foodOrders.customerWhatsapp,
      status: foodOrders.status,
      subtotal: foodOrders.subtotal,
      paymentStatus: foodOrders.paymentStatus,
      createdAt: foodOrders.createdAt,
      updatedAt: foodOrders.updatedAt,
      tableNumber: psTables.tableNumber,
      bookingCode: bookings.bookingCode,
    })
    .from(foodOrders)
    .leftJoin(psTables, eq(foodOrders.tableId, psTables.id))
    .leftJoin(bookings, eq(foodOrders.bookingId, bookings.id))
    .where(activeOnly ? inArray(foodOrders.status, ACTIVE_ORDER_STATUSES) : undefined)
    .orderBy(desc(foodOrders.createdAt))
    .limit(limit);

  const items = await itemsForOrders(rows.map((row) => row.id));
  return rows.map((row) => toOrderView(row, items.get(row.id) ?? []));
}

/** Orders placed with one WhatsApp number, newest first (public tracking). */
export async function listOrdersByWhatsapp(
  whatsapp: string,
  limit = 20,
): Promise<OrderView[]> {
  await expireStaleOrderPayments();

  const rows = await db
    .select({
      id: foodOrders.id,
      orderCode: foodOrders.orderCode,
      customerName: foodOrders.customerName,
      customerWhatsapp: foodOrders.customerWhatsapp,
      status: foodOrders.status,
      subtotal: foodOrders.subtotal,
      paymentStatus: foodOrders.paymentStatus,
      createdAt: foodOrders.createdAt,
      updatedAt: foodOrders.updatedAt,
      tableNumber: psTables.tableNumber,
      bookingCode: bookings.bookingCode,
    })
    .from(foodOrders)
    .leftJoin(psTables, eq(foodOrders.tableId, psTables.id))
    .leftJoin(bookings, eq(foodOrders.bookingId, bookings.id))
    .where(eq(foodOrders.customerWhatsapp, whatsapp))
    .orderBy(desc(foodOrders.createdAt))
    .limit(limit);

  const items = await itemsForOrders(rows.map((row) => row.id));
  return rows.map((row) => toOrderView(row, items.get(row.id) ?? []));
}

export type UpdateOrderInput = {
  status?: OrderStatus;
  paymentStatus?: "unpaid" | "paid";
};

export async function updateOrder(
  id: number,
  input: UpdateOrderInput,
  actorId: string,
) {
  if (!input.status && !input.paymentStatus) {
    throw new ApiError(400, "Tidak ada perubahan yang dikirim.", "no_changes");
  }

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(foodOrders)
      .where(eq(foodOrders.id, id))
      .for("update")
      .limit(1);

    if (!existing) {
      throw new ApiError(404, "Pesanan tidak ditemukan.", "order_not_found");
    }
    if (!isActiveOrderStatus(existing.status) && input.status && input.status !== existing.status) {
      throw new ApiError(
        409,
        "Pesanan yang sudah selesai/dibatalkan tidak bisa diubah statusnya.",
        "order_final",
      );
    }

    const nextStatus = (input.status ?? existing.status) as OrderStatus;
    const canceling = nextStatus === "cancelled" && existing.status !== "cancelled";

    if (canceling) {
      await restoreOrderStock(tx, id);
    }

    const [updated] = await tx
      .update(foodOrders)
      .set({
        status: nextStatus,
        paymentStatus: input.paymentStatus ?? existing.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(foodOrders.id, id))
      .returning();

    // Keep the linked QRIS payment in sync when the cashier settles by cash
    // or cancels an order that was still waiting for payment.
    if (updated.paymentStatus === "paid") {
      await tx
        .update(payments)
        .set({ status: "paid", paidAt: new Date() })
        .where(and(eq(payments.foodOrderId, id), eq(payments.status, "pending")));
    } else if (canceling) {
      await tx
        .update(payments)
        .set({ status: "expired" })
        .where(and(eq(payments.foodOrderId, id), eq(payments.status, "pending")));
    }

    await tx.insert(auditLogs).values({
      actorType: "admin",
      actorId,
      action: canceling ? "order.cancelled" : "order.updated",
      entity: "food_order",
      entityId: String(id),
      meta: {
        fromStatus: existing.status,
        toStatus: nextStatus,
        paymentStatus: updated.paymentStatus,
        stockRestored: canceling,
      },
    });

    return updated;
  });
}

export type ProductInput = {
  name: string;
  category: "food" | "drink";
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
};

export async function createProduct(input: ProductInput, actorId: string) {
  return db.transaction(async (tx) => {
    const [product] = await tx.insert(products).values(input).returning();
    await tx.insert(auditLogs).values({
      actorType: "admin",
      actorId,
      action: "product.created",
      entity: "product",
      entityId: String(product.id),
      meta: { name: product.name, price: product.price, stock: product.stockQuantity },
    });
    return product;
  });
}

export type ProductPatch = Partial<ProductInput>;

export async function updateProduct(
  id: number,
  patch: ProductPatch,
  actorId: string,
) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(products)
      .where(eq(products.id, id))
      .for("update")
      .limit(1);

    if (!existing) {
      throw new ApiError(404, "Produk tidak ditemukan.", "product_not_found");
    }

    const [updated] = await tx
      .update(products)
      .set(patch)
      .where(eq(products.id, id))
      .returning();

    const stockChanged =
      patch.stockQuantity !== undefined &&
      patch.stockQuantity !== existing.stockQuantity;

    await tx.insert(auditLogs).values({
      actorType: "admin",
      actorId,
      action: stockChanged ? "product.stock" : "product.updated",
      entity: "product",
      entityId: String(id),
      meta: stockChanged
        ? { before: existing.stockQuantity, after: patch.stockQuantity }
        : { fields: Object.keys(patch) },
    });

    return updated;
  });
}

/**
 * Removes a menu item. Past order lines keep their own snapshot of name and
 * price, so we only clear the foreign key to satisfy the reference.
 */
export async function deleteProduct(id: number, actorId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(products)
      .where(eq(products.id, id))
      .for("update")
      .limit(1);

    if (!existing) {
      throw new ApiError(404, "Produk tidak ditemukan.", "product_not_found");
    }

    await tx
      .update(foodOrderItems)
      .set({ productId: null })
      .where(eq(foodOrderItems.productId, id));

    await tx.delete(products).where(eq(products.id, id));

    await tx.insert(auditLogs).values({
      actorType: "admin",
      actorId,
      action: "product.deleted",
      entity: "product",
      entityId: String(id),
      meta: { name: existing.name, price: existing.price },
    });

    return { id };
  });
}

/** Number of orders still in the kitchen/delivery queue. */
export async function countActiveOrders(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(foodOrders)
    .where(inArray(foodOrders.status, ACTIVE_ORDER_STATUSES));
  return row?.count ?? 0;
}
