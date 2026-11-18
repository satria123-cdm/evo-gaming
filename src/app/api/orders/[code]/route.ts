import { ApiError, jsonError } from "@/lib/api";
import { getOrderByCode } from "@/lib/orders";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public order status. The random order code acts as the access token. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const limit = rateLimit(clientKey(request, "order-status"), {
      limit: 180,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      throw new ApiError(429, "Terlalu banyak permintaan.", "rate_limited");
    }

    const { code } = await params;
    const order = await getOrderByCode(code);
    if (!order) {
      throw new ApiError(404, "Pesanan tidak ditemukan.", "order_not_found");
    }

    return Response.json({
      order: {
        code: order.code,
        status: order.status,
        subtotal: order.subtotal,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        paymentExpiresAt: order.paymentExpiresAt,
      },
      payment: order.payment,
      items: order.items.map((item) => ({
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
