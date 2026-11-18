import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bookings, payments } from "@/db/schema";
import { ApiError, jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { updateBookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      throw new ApiError(400, "ID booking tidak valid.", "invalid_id");
    }

    const body = await readJson(request);
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Status tidak valid.", "validation_error");
    }
    if (!parsed.data.bookingStatus && !parsed.data.paymentStatus) {
      throw new ApiError(400, "Tidak ada perubahan yang dikirim.", "no_changes");
    }

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new ApiError(404, "Booking tidak ditemukan.", "booking_not_found");
      }

      const nextBookingStatus = parsed.data.bookingStatus ?? existing.bookingStatus;
      const nextPaymentStatus = parsed.data.paymentStatus ?? existing.paymentStatus;

      const [updated] = await tx
        .update(bookings)
        .set({
          bookingStatus: nextBookingStatus,
          paymentStatus: nextPaymentStatus,
          holdExpiresAt:
            nextBookingStatus === "pending" ? existing.holdExpiresAt : null,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (parsed.data.paymentStatus === "paid") {
        await tx
          .update(payments)
          .set({ status: "paid", paidAt: new Date() })
          .where(
            and(
              eq(payments.bookingId, bookingId),
              inArray(payments.status, ["pending", "unpaid"]),
            ),
          );
      }

      await tx.insert(auditLogs).values({
        actorType: "admin",
        actorId: String(session.adminId),
        action: "booking.updated",
        entity: "booking",
        entityId: String(bookingId),
        meta: {
          bookingStatus: nextBookingStatus,
          paymentStatus: nextPaymentStatus,
        },
      });

      return updated;
    });

    return Response.json({ ok: true, booking: result });
  } catch (error) {
    return jsonError(error);
  }
}
