import { jsonError } from "@/lib/api";
import { listBookingsByWhatsapp } from "@/lib/bookings";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { normalizeWhatsapp } from "@/lib/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public booking lookup by WhatsApp number only. Everyone who knows a number
 * can see the bookings made with it — a deliberate trade-off so customers do
 * not lose their booking code. Every match is limited to 20 newest rows.
 */
export async function GET(request: NextRequest) {
  try {
    const limit = rateLimit(clientKey(request, "lookup-bookings"), {
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

    const bookings = await listBookingsByWhatsapp(whatsapp);
    return Response.json({
      ok: true,
      whatsapp,
      bookings: bookings.map((row) => ({
        code: row.code,
        customerName: row.customerName,
        unit: row.unitCode,
        tableNumber: row.tableNumber,
        startAt: row.startAt.toISOString(),
        endAt: row.endAt.toISOString(),
        durationHours: row.durationHours,
        packageCode: row.packageCode,
        price: row.rentalPrice,
        status: row.bookingStatus,
        paymentStatus: row.paymentStatus,
        source: row.source,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
