import { OrderLookupForm } from "@/components/order-lookup-form";

export const dynamic = "force-dynamic";

export default async function OrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ wa?: string; code?: string }>;
}) {
  const { wa } = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pesanan F&amp;B</p>
        <h1 className="text-3xl font-black tracking-tight">Cek pesanan</h1>
        <p className="text-sm text-slate-300">
          Masukkan nomor WhatsApp yang Anda isi saat memesan. Semua pesanan dari nomor
          tersebut langsung ditampilkan, lengkap dengan status dan totalnya.
        </p>
      </header>

      <OrderLookupForm initialWhatsapp={wa ?? ""} />

      <p className="text-center text-xs text-slate-500">
        Belum pesan?{" "}
        <a href="/menu" className="font-semibold text-accent">
          Lihat menu F&amp;B
        </a>
      </p>
    </div>
  );
}
