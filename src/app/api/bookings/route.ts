import { ApiError, jsonError, readJson } from "@/lib/api";
import { createBooking } from "@/lib/bookings";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createBookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "create-booking"), {
      limit: 8,
      windowMs: 10 * 60_000,
    });
    if (!limit.ok) {
      throw new ApiError(
        429,
        `Terlalu banyak percobaan booking. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        "rate_limited",
      );
    }

    const body = await readJson(request);
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Data booking tidak valid.",
        "validation_error",
      );
    }

    if (parsed.data.method === "cash") {
      throw new ApiError(
        400,
        "Pembayaran tunai hanya dapat dibuat melalui admin di lokasi.",
        "cash_online_disabled",
      );
    }

    const { booking, payment, customer } = await createBooking({
      customerName: parsed.data.customerName,
      whatsapp: parsed.data.whatsapp,
      date: parsed.data.date,
      time: parsed.data.time,
      durationHours: parsed.data.durationHours,
      psUnitId: parsed.data.psUnitId,
      source: "online",
      method: "qris",
    });

    return Response.json(
      {
        booking: {
          code: booking.bookingCode,
          status: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          startAt: booking.startAt,
          endAt: booking.endAt,
          price: booking.rentalPrice,
          holdExpiresAt: booking.holdExpiresAt,
        },
        payment: {
          reference: payment.paymentReference,
          amount: payment.amount,
          status: payment.status,
        },
        customer: { name: customer.name },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
