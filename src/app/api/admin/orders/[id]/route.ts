import { ApiError, jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { updateOrder } from "@/lib/orders";
import { updateOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new ApiError(400, "ID pesanan tidak valid.", "invalid_id");
    }

    const body = await readJson(request);
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Status pesanan tidak valid.", "validation_error");
    }

    const order = await updateOrder(orderId, parsed.data, String(session.adminId));
    return Response.json({
      ok: true,
      order: {
        id: order.id,
        code: order.orderCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
