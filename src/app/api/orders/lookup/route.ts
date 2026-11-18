import { jsonError } from "@/lib/api";
import { listOrdersByWhatsapp } from "@/lib/orders";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { normalizeWhatsapp } from "@/lib/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Public F&B order lookup by WhatsApp number only (newest 20). */
export async function GET(request: NextRequest) {
  try {
    const limit = rateLimit(clientKey(request, "lookup-orders"), {
      limit: 20,
      windowMs: 5 * 60_000,
    });
    if (!limit.ok) {
      return Response.json(
        {
          error: `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        },
        { status: 429 },
      );
    }

    const whatsapp = normalizeWhatsapp(request.nextUrl.searchParams.get("wa") ?? "");
    if (!whatsapp) {
      return Response.json(
        { error: "Masukkan nomor WhatsApp yang valid." },
        { status: 400 },
      );
    }

    const orders = await listOrdersByWhatsapp(whatsapp);
    return Response.json({
      ok: true,
      whatsapp,
      orders: orders.map((order) => ({
        code: order.code,
        customerName: order.customerName,
        status: order.status,
        subtotal: order.subtotal,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        tableNumber: order.tableNumber,
        bookingCode: order.bookingCode,
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
