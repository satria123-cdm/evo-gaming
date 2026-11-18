import { ApiError, jsonError } from "@/lib/api";
import { isMockPaymentEnabled } from "@/lib/gateway";
import { handlePaymentEvent } from "@/lib/payments";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Simulation endpoint: only available when PAYMENT_MODE=mock.
 * Pretends the gateway sent a successful callback so the booking can be
 * confirmed without a real merchant account.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    if (!isMockPaymentEnabled()) {
      throw new ApiError(
        404,
        "Mode simulasi pembayaran tidak aktif.",
        "not_found",
      );
    }

    const { reference } = await params;
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentReference, reference))
      .limit(1);

    if (!payment) {
      throw new ApiError(404, "Pembayaran tidak ditemukan.", "payment_not_found");
    }
    if (payment.status === "paid") {
      return Response.json({ ok: true, status: "paid", alreadyPaid: true });
    }

    const result = await handlePaymentEvent({
      eventId: `mock-${reference}-${crypto.randomUUID()}`,
      paymentReference: reference,
      status: "paid",
      amount: payment.amount,
      gatewayTransactionId: `MOCK-${reference}`,
    });

    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
