export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  console.error("[api] unhandled error", error);
  return Response.json(
    { error: "Terjadi kesalahan pada server.", code: "internal_error" },
    { status: 500 },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Body request harus berupa JSON.", "invalid_json");
  }
}

const ASCII_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const byte of bytes) out += ASCII_ALPHABET[byte % ASCII_ALPHABET.length];
  return out;
}

export function bookingCode(): string {
  return `EVO-${randomCode(6)}`;
}

export function paymentReference(): string {
  return `PAY-${randomCode(8)}`;
}
