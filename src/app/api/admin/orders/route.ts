import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const scope = url.searchParams.get("status") ?? "active";
    const orders = await listOrders({
      activeOnly: scope !== "all",
      limit: scope === "all" ? 100 : 60,
    });
    return Response.json({ orders });
  } catch (error) {
    return jsonError(error);
  }
}
