import { AdminOrderBoard } from "@/components/admin-order-board";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listOrders({ activeOnly: true });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Pesanan F&amp;B</h1>
        <p className="text-sm text-slate-400">
          Kelola antrean pesanan makanan/minuman: konfirmasi, proses, antar, lalu tandai selesai.
        </p>
      </header>

      <AdminOrderBoard
        initialOrders={orders.map((order) => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
