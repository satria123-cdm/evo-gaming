import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-black tracking-tight">Admin EVO Gaming</h1>
        <p className="text-sm text-slate-400">
          Login untuk mengelola booking, pembayaran, dan status unit.
        </p>
      </header>
      <AdminLoginForm />
      <p className="text-center text-xs text-slate-500">
        Akun default dibuat oleh <code className="text-slate-300">npm run db:seed</code>.
        Ganti password sebelum dipakai di produksi.
      </p>
    </div>
  );
}
