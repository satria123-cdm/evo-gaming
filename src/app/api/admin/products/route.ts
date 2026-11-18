import { ApiError, jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { createProduct, listProducts } from "@/lib/orders";
import { productSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ products: await listProducts() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJson(request);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Data produk tidak valid.",
        "validation_error",
      );
    }

    const product = await createProduct(
      {
        ...parsed.data,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
      },
      String(session.adminId),
    );

    return Response.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
