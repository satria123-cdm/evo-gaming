import { ApiError, jsonError } from "@/lib/api";
import { verifyWebhookSignature } from "@/lib/gateway";
import { handlePaymentEvent } from "@/lib/payments";
import { webhookSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Gateway callback endpoint. The signature is checked over the raw body,
 * and `eventId` is the idempotency key (replays return duplicate: true).
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-mock-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      throw new ApiError(401, "Signature webhook tidak valid.", "invalid_signature");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new ApiError(400, "Payload webhook bukan JSON.", "invalid_json");
    }

    const parsed = webhookSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError(400, "Payload webhook tidak valid.", "validation_error");
    }

    const result = await handlePaymentEvent(parsed.data);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
