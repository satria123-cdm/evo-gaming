import { ApiError, jsonError, readJson } from "@/lib/api";
import { createOrder } from "@/lib/orders";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "create-order"), {
      limit: 10,
      windowMs: 10 * 60_000,
    });
    if (!limit.ok) {
      throw new ApiError(
        429,
        `Terlalu banyak pesanan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        "rate_limited",
      );
    }

    const body = await readJson(request);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Data pesanan tidak valid.",
        "validation_error",
      );
    }
    if (!parsed.data.tableId && !parsed.data.bookingCode) {
      throw new ApiError(
        400,
        "Pilih nomor meja atau masukkan kode booking.",
        "table_required",
      );
    }

    const result = await createOrder({
      customerName: parsed.data.customerName,
      whatsapp: parsed.data.whatsapp,
      tableId: parsed.data.tableId,
      bookingCode: parsed.data.bookingCode,
      items: parsed.data.items,
    });

    return Response.json(
      {
        order: {
          code: result.order.orderCode,
          status: result.order.status,
          subtotal: result.order.subtotal,
          paymentStatus: result.order.paymentStatus,
          tableNumber: result.tableNumber,
          createdAt: result.order.createdAt,
        },
        payment: {
          reference: result.payment.paymentReference,
          method: result.payment.method,
          amount: result.payment.amount,
          status: result.payment.status,
        },
        items: result.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
