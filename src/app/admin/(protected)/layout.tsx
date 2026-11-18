import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href="/admin" className="nav-btn">
            Dashboard
          </Link>
          <Link href="/admin/bookings" className="nav-btn">
            Booking
          </Link>
          <Link href="/admin/bookings/new" className="nav-btn">
            Booking langsung
          </Link>
          <Link href="/admin/orders" className="nav-btn">
            Pesanan
          </Link>
          <Link href="/admin/menu" className="nav-btn">
            Menu &amp; Stok
          </Link>
          <Link href="/admin/pricing" className="nav-btn">
            Harga
          </Link>
          <Link href="/admin/reports" className="nav-btn">
            Laporan
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{session.name}</span>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
