import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  bookings,
  foodOrders,
  paymentEvents,
  payments,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import { restoreOrderStock } from "@/lib/orders";

export type PaymentEventInput = {
  eventId: string;
  paymentReference: string;
  status: "paid" | "failed" | "expired";
  amount: number;
  gatewayTransactionId?: string;
};

export type PaymentEventResult = {
  ok: true;
  duplicate: boolean;
  paymentStatus: string;
};

/**
 * Single code path for QRIS notification handling.
 * The unique `event_id` insert is the idempotency guard: replaying the same
 * notification is a no-op, and re-paying an already-paid payment is ignored.
 */
export async function handlePaymentEvent(
  input: PaymentEventInput,
): Promise<PaymentEventResult> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(paymentEvents)
      .values({
        eventId: input.eventId,
        paymentReference: input.paymentReference,
        payload: input,
      })
      .onConflictDoNothing({ target: paymentEvents.eventId })
      .returning({ id: paymentEvents.id });

    if (inserted.length === 0) {
      return { ok: true, duplicate: true, paymentStatus: "unchanged" };
    }

    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.paymentReference, input.paymentReference))
      .for("update")
      .limit(1);

    if (!payment) {
      throw new ApiError(404, "Referensi pembayaran tidak ditemukan.", "payment_not_found");
    }

    if (input.status === "paid") {
      if (payment.amount !== input.amount) {
        throw new ApiError(400, "Nominal pembayaran tidak cocok.", "amount_mismatch");
      }
      if (payment.status === "paid") {
        return { ok: true, duplicate: false, paymentStatus: "paid" };
      }

      await tx
        .update(payments)
        .set({
          status: "paid",
          paidAt: new Date(),
          gatewayTransactionId:
            input.gatewayTransactionId ?? `MOCK-${payment.paymentReference}`,
        })
        .where(eq(payments.id, payment.id));

      if (payment.bookingId) {
        await tx
          .update(bookings)
          .set({
            bookingStatus: "confirmed",
            paymentStatus: "paid",
            holdExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, payment.bookingId));
      }

      // F&B: a paid QRIS settles the order; the kitchen queue keeps running.
      if (payment.foodOrderId) {
        await tx
          .update(foodOrders)
          .set({ paymentStatus: "paid", updatedAt: new Date() })
          .where(eq(foodOrders.id, payment.foodOrderId));
      }

      await tx.insert(auditLogs).values({
        actorType: "system",
        actorId: null,
        action: "payment.paid",
        entity: "payment",
        entityId: String(payment.id),
        meta: {
          reference: payment.paymentReference,
          amount: input.amount,
          bookingId: payment.bookingId,
          foodOrderId: payment.foodOrderId,
        },
      });

      return { ok: true, duplicate: false, paymentStatus: "paid" };
    }

    // failed / expired: release the hold and mark the booking unusable.
    const finalStatus = input.status === "failed" ? "failed" : "expired";
    await tx
      .update(payments)
      .set({ status: finalStatus })
      .where(eq(payments.id, payment.id));

    if (payment.bookingId) {
      await tx
        .update(bookings)
        .set({
          bookingStatus: "expired",
          paymentStatus: finalStatus,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, payment.bookingId));
    }

    // F&B: an unpaid/expired QRIS releases the reserved stock.
    if (payment.foodOrderId) {
      const [order] = await tx
        .select({ id: foodOrders.id, status: foodOrders.status })
        .from(foodOrders)
        .where(eq(foodOrders.id, payment.foodOrderId))
        .for("update")
        .limit(1);

      if (order && order.status !== "cancelled" && order.status !== "completed") {
        await restoreOrderStock(tx, order.id);
        await tx
          .update(foodOrders)
          .set({
            status: "cancelled",
            paymentStatus: finalStatus,
            updatedAt: new Date(),
          })
          .where(eq(foodOrders.id, order.id));
      }
    }

    return { ok: true, duplicate: false, paymentStatus: finalStatus };
  });
}

/**
 * Dummy but structurally valid-looking QRIS payload used by
 * `PAYMENT_MODE=mock`. Replace with the gateway's `qr_string` once a
 * merchant account exists.
 */
export function buildDummyQrisPayload(reference: string, amount: number): string {
  const merchant = "EVOGAMINGBANJARMASIN".slice(0, 25);
  return [
    "000201",
    "010211",
    `26${String(merchant.length).padStart(2, "0")}${merchant}`,
    `52${"5814"}`,
    "5303360",
    `54${String(String(amount).length).padStart(2, "0")}${amount}`,
    "5802ID",
    `62${String(reference.length + 4).padStart(2, "0")}05${String(reference.length).padStart(2, "0")}${reference}`,
    "6304MOCK",
  ].join("");
}
