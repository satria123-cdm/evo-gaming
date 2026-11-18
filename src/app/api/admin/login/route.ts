import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins, auditLogs } from "@/db/schema";
import { ApiError, jsonError, readJson } from "@/lib/api";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Email dan password wajib diisi.", "validation_error");
    }

    const limit = rateLimit(
      clientKey(request, `admin-login:${parsed.data.email.toLowerCase()}`),
      { limit: 5, windowMs: 15 * 60_000 },
    );
    if (!limit.ok) {
      throw new ApiError(
        429,
        `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        "rate_limited",
      );
    }

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, parsed.data.email.toLowerCase()))
      .limit(1);

    // Same generic message for unknown email and wrong password.
    const invalid = new ApiError(401, "Email atau password salah.", "invalid_credentials");
    if (!admin) throw invalid;

    const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!valid) throw invalid;

    const token = await createSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    await setSessionCookie(token);

    await db.insert(auditLogs).values({
      actorType: "admin",
      actorId: String(admin.id),
      action: "admin.login",
      entity: "admin",
      entityId: String(admin.id),
      meta: { email: admin.email },
    });

    return Response.json({
      ok: true,
      admin: { name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    return jsonError(error);
  }
}
