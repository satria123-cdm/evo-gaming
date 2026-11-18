import { ApiError, jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { getPackages, savePackages } from "@/lib/packages";
import { packagePricesSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ packages: await getPackages() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJson(request);
    const parsed = packagePricesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Harga paket tidak valid.",
        "validation_error",
      );
    }

    const packages = await savePackages(
      parsed.data.packages,
      String(session.adminId),
    );

    return Response.json({ ok: true, packages });
  } catch (error) {
    return jsonError(error);
  }
}
