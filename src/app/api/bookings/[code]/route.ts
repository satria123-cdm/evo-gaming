import { jsonError } from "@/lib/api";
import { getBookingByCode } from "@/lib/bookings";
import { normalizeWhatsapp } from "@/lib/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public booking lookup. A booking code alone is not enough — the customer
 * must also supply the WhatsApp number used at booking time. This keeps
 * names/phone numbers from leaking to anyone who guesses a code.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const whatsapp = normalizeWhatsapp(request.nextUrl.searchParams.get("wa") ?? "");
    if (!whatsapp) {
      return Response.json(
        { error: "Nomor WhatsApp wajib diisi untuk melihat booking." },
        { status: 400 },
      );
    }

    const detail = await getBookingByCode(code);
    if (!detail || detail.customer.whatsapp !== whatsapp) {
      return Response.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    return Response.json({
      code: detail.booking.bookingCode,
      status: detail.booking.bookingStatus,
      paymentStatus: detail.booking.paymentStatus,
      startAt: detail.booking.startAt,
      endAt: detail.booking.endAt,
      durationHours: detail.booking.durationHours,
      price: detail.booking.rentalPrice,
      unit: detail.unit.unitCode,
      tableNumber: detail.tableNumber,
      customerName: detail.customer.name,
    });
  } catch (error) {
    return jsonError(error);
  }
}
