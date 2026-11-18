import { CheckBookingForm } from "@/components/check-booking-form";

export const dynamic = "force-dynamic";

export default async function CheckBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ wa?: string }>;
}) {
  const { wa } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Cek booking</h1>
        <p className="text-sm text-slate-400">
          Masukkan nomor WhatsApp yang Anda pakai saat booking. Semua booking dari
          nomor tersebut langsung ditampilkan — kode booking tidak perlu diingat.
        </p>
      </header>
      <CheckBookingForm initialWhatsapp={wa ?? ""} />
    </div>
  );
}
