import { AdminPackageForm } from "@/components/admin-package-form";
import { getPackages } from "@/lib/packages";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const packages = await getPackages();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="display-title text-2xl">Harga Booking</h1>
        <p className="text-sm text-slate-400">
          Tambah atau hapus paket durasi dan atur harganya. Perubahan langsung
          dipakai halaman booking dan booking langsung (walk-in).
        </p>
      </header>

      <AdminPackageForm initialPackages={packages} />
    </div>
  );
}
