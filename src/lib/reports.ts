import { and, asc, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  customers,
  foodOrderItems,
  foodOrders,
  payments,
  products,
  psTables,
  psUnits,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import { APP_ZONE, nowInAppZone } from "@/lib/time";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function defaultReportRange() {
  const today = nowInAppZone();
  return {
    from: today.minus({ days: 6 }).toISODate() ?? "",
    to: today.toISODate() ?? "",
  };
}

/** Resolve a WITA date range into half-open UTC instants [start, end). */
export function resolveRange(fromISO: string, toISO: string) {
  if (!DATE_RE.test(fromISO) || !DATE_RE.test(toISO)) {
    throw new ApiError(400, "Format tanggal laporan tidak valid.", "invalid_range");
  }

  const from = new Date(`${fromISO}T00:00:00+08:00`);
  const to = new Date(`${toISO}T00:00:00+08:00`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    throw new ApiError(400, "Rentang tanggal tidak valid.", "invalid_range");
  }

  const end = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  const days = Math.round((end.getTime() - from.getTime()) / 86_400_000);
  if (days > 366) {
    throw new ApiError(400, "Rentang laporan maksimal 366 hari.", "range_too_long");
  }

  return { from, end, days };
}

const PAID_RENTAL = inArray(bookings.bookingStatus, [
  "confirmed",
  "in_use",
  "completed",
]);

function rentalWindow(from: Date, end: Date) {
  return and(gte(bookings.startAt, from), lt(bookings.startAt, end));
}

function foodWindow(from: Date, end: Date) {
  return and(
    gte(foodOrders.createdAt, from),
    lt(foodOrders.createdAt, end),
    sql`${foodOrders.status} <> 'cancelled'`,
  );
}

async function rentalTotals(from: Date, end: Date) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bookings.rentalPrice}) filter (where ${bookings.paymentStatus} = 'paid'), 0)::int`,
      paidHours: sql<number>`coalesce(sum(${bookings.durationHours}) filter (where ${bookings.paymentStatus} = 'paid'), 0)::int`,
      unpaidCount: sql<number>`count(*) filter (where ${bookings.paymentStatus} in ('unpaid','pending'))::int`,
      unpaidAmount: sql<number>`coalesce(sum(${bookings.rentalPrice}) filter (where ${bookings.paymentStatus} in ('unpaid','pending')), 0)::int`,
    })
    .from(bookings)
    .where(and(rentalWindow(from, end), PAID_RENTAL));

  return (
    row ?? { count: 0, revenue: 0, paidHours: 0, unpaidCount: 0, unpaidAmount: 0 }
  );
}

async function foodTotals(from: Date, end: Date) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${foodOrders.subtotal}) filter (where ${foodOrders.paymentStatus} = 'paid'), 0)::int`,
      unpaidCount: sql<number>`count(*) filter (where ${foodOrders.paymentStatus} in ('unpaid','pending'))::int`,
      unpaidAmount: sql<number>`coalesce(sum(${foodOrders.subtotal}) filter (where ${foodOrders.paymentStatus} in ('unpaid','pending')), 0)::int`,
    })
    .from(foodOrders)
    .where(foodWindow(from, end));

  return row ?? { count: 0, revenue: 0, unpaidCount: 0, unpaidAmount: 0 };
}

export async function salesReport(fromISO: string, toISO: string) {
  const { from, end, days } = resolveRange(fromISO, toISO);
  const [rental, food] = await Promise.all([
    rentalTotals(from, end),
    foodTotals(from, end),
  ]);

  const packages = await db
    .select({
      packageCode: bookings.packageCode,
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bookings.rentalPrice}) filter (where ${bookings.paymentStatus} = 'paid'), 0)::int`,
    })
    .from(bookings)
    .where(and(rentalWindow(from, end), PAID_RENTAL))
    .groupBy(bookings.packageCode)
    .orderBy(asc(bookings.packageCode));

  // Group by snapshotted name only: rows are keyed by name in the report UI,
  // and grouping by category too could return two rows with the same name.
  const topProducts = await db
    .select({
      name: foodOrderItems.productName,
      quantity: sql<number>`coalesce(sum(${foodOrderItems.quantity}), 0)::int`,
      revenue: sql<number>`coalesce(sum(${foodOrderItems.lineTotal}), 0)::int`,
    })
    .from(foodOrderItems)
    .innerJoin(foodOrders, eq(foodOrderItems.foodOrderId, foodOrders.id))
    .where(and(foodWindow(from, end), eq(foodOrders.paymentStatus, "paid")))
    .groupBy(foodOrderItems.productName)
    .orderBy(desc(sql`sum(${foodOrderItems.lineTotal})`))
    .limit(8);

  return {
    range: { from: fromISO, to: toISO, days },
    rental,
    food,
    packages,
    topProducts,
    totalRevenue: rental.revenue + food.revenue,
  };
}

export type SalesReport = Awaited<ReturnType<typeof salesReport>>;

export type RevenueSource = {
  key: "rental_online" | "rental_walkin" | "food";
  label: string;
  count: number;
  revenue: number;
  unpaidCount: number;
  unpaidAmount: number;
};

export type LiveFeedItem = {
  id: string;
  kind: "rental" | "food";
  code: string;
  customer: string;
  detail: string;
  amount: number;
  at: string;
};

export type LiveReport = {
  range: { from: string; to: string; days: number };
  generatedAt: string;
  totalRevenue: number;
  unpaidCount: number;
  unpaidAmount: number;
  rental: {
    count: number;
    revenue: number;
    paidHours: number;
    unpaidCount: number;
    unpaidAmount: number;
  };
  food: {
    count: number;
    revenue: number;
    unpaidCount: number;
    unpaidAmount: number;
  };
  sources: RevenueSource[];
  latest: LiveFeedItem[];
};

const RENTAL_SOURCE_LABELS: Record<string, { key: RevenueSource["key"]; label: string }> = {
  online: { key: "rental_online", label: "Booking PS online (QRIS)" },
  walk_in: { key: "rental_walkin", label: "Booking PS walk-in (kasir)" },
};

/**
 * Everything the admin report needs to refresh itself while money keeps coming
 * in: totals (with the same rules as `salesReport`), a per-source split, and the
 * newest settled payments from both rental and F&B.
 */
export async function liveReport(fromISO: string, toISO: string): Promise<LiveReport> {
  const { from, end, days } = resolveRange(fromISO, toISO);

  const [rental, food, bySource, rentalPaid, foodPaid] = await Promise.all([
    rentalTotals(from, end),
    foodTotals(from, end),
    db
      .select({
        source: bookings.bookingSource,
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${bookings.rentalPrice}) filter (where ${bookings.paymentStatus} = 'paid'), 0)::int`,
        unpaidCount: sql<number>`count(*) filter (where ${bookings.paymentStatus} in ('unpaid','pending'))::int`,
        unpaidAmount: sql<number>`coalesce(sum(${bookings.rentalPrice}) filter (where ${bookings.paymentStatus} in ('unpaid','pending')), 0)::int`,
      })
      .from(bookings)
      .where(and(rentalWindow(from, end), PAID_RENTAL))
      .groupBy(bookings.bookingSource),
    db
      .select({
        paidAt: payments.paidAt,
        code: bookings.bookingCode,
        customer: customers.name,
        unitCode: psUnits.unitCode,
        packageCode: bookings.packageCode,
        amount: payments.amount,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
      .where(
        and(
          eq(payments.status, "paid"),
          isNotNull(payments.bookingId),
          gte(payments.paidAt, from),
          lt(payments.paidAt, end),
        ),
      )
      .orderBy(desc(payments.paidAt))
      .limit(10),
    db
      .select({
        paidAt: payments.paidAt,
        code: foodOrders.orderCode,
        customer: foodOrders.customerName,
        tableNumber: psTables.tableNumber,
        amount: payments.amount,
      })
      .from(payments)
      .innerJoin(foodOrders, eq(payments.foodOrderId, foodOrders.id))
      .leftJoin(psTables, eq(foodOrders.tableId, psTables.id))
      .where(
        and(
          eq(payments.status, "paid"),
          isNotNull(payments.foodOrderId),
          gte(payments.paidAt, from),
          lt(payments.paidAt, end),
        ),
      )
      .orderBy(desc(payments.paidAt))
      .limit(10),
  ]);

  const sources: RevenueSource[] = [];
  for (const row of bySource) {
    const meta = RENTAL_SOURCE_LABELS[row.source] ?? {
      key: "rental_online" as const,
      label: `Booking PS ${row.source}`,
    };
    sources.push({
      key: meta.key,
      label: meta.label,
      count: row.count,
      revenue: row.revenue,
      unpaidCount: row.unpaidCount,
      unpaidAmount: row.unpaidAmount,
    });
  }
  sources.sort((a, b) => a.key.localeCompare(b.key));
  sources.push({
    key: "food",
    label: "Makanan & minuman (QRIS / kasir)",
    count: food.count,
    revenue: food.revenue,
    unpaidCount: food.unpaidCount,
    unpaidAmount: food.unpaidAmount,
  });

  const latest: LiveFeedItem[] = [
    ...rentalPaid.flatMap((row) =>
      row.paidAt
        ? [
            {
              id: `rental-${row.code}`,
              kind: "rental" as const,
              code: row.code,
              customer: row.customer,
              detail: `${row.packageCode} • ${row.unitCode}`,
              amount: row.amount,
              at: row.paidAt.toISOString(),
            },
          ]
        : [],
    ),
    ...foodPaid.flatMap((row) =>
      row.paidAt
        ? [
            {
              id: `food-${row.code}`,
              kind: "food" as const,
              code: row.code,
              customer: row.customer,
              detail: `Meja ${row.tableNumber ?? "-"}`,
              amount: row.amount,
              at: row.paidAt.toISOString(),
            },
          ]
        : [],
    ),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return {
    range: { from: fromISO, to: toISO, days },
    generatedAt: new Date().toISOString(),
    totalRevenue: rental.revenue + food.revenue,
    unpaidCount: rental.unpaidCount + food.unpaidCount,
    unpaidAmount: rental.unpaidAmount + food.unpaidAmount,
    rental,
    food,
    sources,
    latest,
  };
}

/** Every PS booking whose session starts inside the range (any status). */
export async function rentalHistory(fromISO: string, toISO: string, limit = 300) {
  const { from, end } = resolveRange(fromISO, toISO);
  return db
    .select({
      id: bookings.id,
      code: bookings.bookingCode,
      customerName: customers.name,
      whatsapp: customers.whatsapp,
      unitCode: psUnits.unitCode,
      tableNumber: psTables.tableNumber,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      durationHours: bookings.durationHours,
      packageCode: bookings.packageCode,
      rentalPrice: bookings.rentalPrice,
      bookingStatus: bookings.bookingStatus,
      paymentStatus: bookings.paymentStatus,
      source: bookings.bookingSource,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
    .leftJoin(psTables, eq(psUnits.tableId, psTables.id))
    .where(rentalWindow(from, end))
    .orderBy(desc(bookings.startAt))
    .limit(limit);
}

/** Every F&B order created inside the range, newest first. */
export async function foodOrderHistory(fromISO: string, toISO: string, limit = 300) {
  const { from, end } = resolveRange(fromISO, toISO);
  return db
    .select({
      id: foodOrders.id,
      code: foodOrders.orderCode,
      customerName: foodOrders.customerName,
      whatsapp: foodOrders.customerWhatsapp,
      tableNumber: psTables.tableNumber,
      bookingCode: bookings.bookingCode,
      status: foodOrders.status,
      paymentStatus: foodOrders.paymentStatus,
      subtotal: foodOrders.subtotal,
      createdAt: foodOrders.createdAt,
    })
    .from(foodOrders)
    .leftJoin(psTables, eq(foodOrders.tableId, psTables.id))
    .leftJoin(bookings, eq(foodOrders.bookingId, bookings.id))
    .where(and(gte(foodOrders.createdAt, from), lt(foodOrders.createdAt, end)))
    .orderBy(desc(foodOrders.createdAt))
    .limit(limit);
}

export async function lowStockProducts(threshold = 5) {
  return db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      stockQuantity: products.stockQuantity,
      isAvailable: products.isAvailable,
    })
    .from(products)
    .where(and(eq(products.isAvailable, true), sql`${products.stockQuantity} <= ${threshold}`))
    .orderBy(asc(products.stockQuantity), asc(products.name))
    .limit(10);
}

/** Today's F&B figures for the admin dashboard (WITA day). */
export async function foodToday() {
  const now = nowInAppZone();
  const start = new Date(`${now.toISODate()}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const [row] = await db
    .select({
      orders: sql<number>`count(*) filter (where ${foodOrders.status} <> 'cancelled')::int`,
      revenue: sql<number>`coalesce(sum(${foodOrders.subtotal}) filter (where ${foodOrders.paymentStatus} = 'paid' and ${foodOrders.status} <> 'cancelled'), 0)::int`,
      unpaid: sql<number>`count(*) filter (where ${foodOrders.paymentStatus} in ('unpaid','pending') and ${foodOrders.status} <> 'cancelled')::int`,
      active: sql<number>`count(*) filter (where ${foodOrders.status} in ('new','confirmed','processing','ready','delivering'))::int`,
    })
    .from(foodOrders)
    .where(and(gte(foodOrders.createdAt, start), lt(foodOrders.createdAt, end)));

  return row ?? { orders: 0, revenue: 0, unpaid: 0, active: 0 };
}

/** Display label for a range using WITA (exported for pages). */
export function rangeLabel(fromISO: string, toISO: string): string {
  const fmt = new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_ZONE,
    dateStyle: "medium",
  });
  return `${fmt.format(new Date(`${fromISO}T00:00:00+08:00`))} – ${fmt.format(
    new Date(`${toISO}T00:00:00+08:00`),
  )}`;
}
