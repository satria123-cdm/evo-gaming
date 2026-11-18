import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhookPayload(rawBody: string): string {
  const secret =
    process.env.MOCK_GATEWAY_SECRET ?? "dev-mock-gateway-secret-change-me";
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = signWebhookPayload(rawBody);
  const expectedBytes = Buffer.from(expected, "utf8");
  const givenBytes = Buffer.from(signature, "utf8");
  if (expectedBytes.length !== givenBytes.length) return false;
  return timingSafeEqual(expectedBytes, givenBytes);
}

/**
 * `PAYMENT_MODE=mock` turns the QRIS flow into a local simulation: the
 * booking page renders a dummy QR and exposes the "Simulasi Bayar Berhasil"
 * button. Any other value (or unset) keeps the simulation endpoints closed,
 * which is the safe default until a real gateway is integrated.
 */
export function getPaymentMode(): "mock" | "gateway" {
  return process.env.PAYMENT_MODE === "mock" ? "mock" : "gateway";
}

export function isMockPaymentEnabled(): boolean {
  return getPaymentMode() === "mock";
}
