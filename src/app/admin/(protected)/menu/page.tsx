import { AdminProductManager } from "@/components/admin-product-manager";
import { listProducts } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const products = await listProducts();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Menu &amp; Stok</h1>
        <p className="text-sm text-slate-400">
          Kelola produk F&amp;B, harga, stok, dan status ketersediaan.
        </p>
      </header>

      <AdminProductManager initialProducts={products} />
    </div>
  );
}
