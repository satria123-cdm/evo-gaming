import { ApiError, jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { deleteProduct, updateProduct } from "@/lib/orders";
import { productPatchSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ApiError(400, "ID produk tidak valid.", "invalid_id");
    }

    const body = await readJson(request);
    const parsed = productPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Data produk tidak valid.",
        "validation_error",
      );
    }
    if (Object.keys(parsed.data).length === 0) {
      throw new ApiError(400, "Tidak ada perubahan yang dikirim.", "no_changes");
    }

    const product = await updateProduct(
      productId,
      {
        ...parsed.data,
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description || null }
          : {}),
        ...(parsed.data.imageUrl !== undefined
          ? { imageUrl: parsed.data.imageUrl || null }
          : {}),
      },
      String(session.adminId),
    );

    return Response.json({ ok: true, product });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ApiError(400, "ID produk tidak valid.", "invalid_id");
    }

    await deleteProduct(productId, String(session.adminId));
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
