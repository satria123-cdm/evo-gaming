import { ApiError, jsonError, readJson } from "@/lib/api";
import { createBooking, listBookings } from "@/lib/bookings";
import { requireAdmin } from "@/lib/guard";
import { walkInBookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Admin booking list (used by the smoke test and future admin clients). */
export async function GET() {
  try {
    await requireAdmin();
    const rows = await listBookings(100);
    return Response.json({ bookings: rows });
  } catch (error) {
    return jsonError(error);
  }
}

/** Admin creates a booking for a customer who walked in. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await readJson(request);
    const parsed = walkInBookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Data booking tidak valid.",
        "validation_error",
      );
    }

    const { booking, payment } = await createBooking({
      customerName: parsed.data.customerName,
      whatsapp: parsed.data.whatsapp,
      date: parsed.data.date,
      time: parsed.data.time,
      durationHours: parsed.data.durationHours,
      psUnitId: parsed.data.psUnitId,
      source: "walk_in",
      method: parsed.data.method,
    });

    return Response.json(
      { booking: { code: booking.bookingCode, id: booking.id }, payment: { reference: payment.paymentReference } },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
