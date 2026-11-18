import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-8 text-center">
      <p className="chip mx-auto border-accent/30 bg-accent/10 text-accent">404</p>
      <h1 className="display-title mt-4 text-3xl sm:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Halaman yang kamu cari mungkin sudah pindah atau tautannya salah ketik.
        Cek status booking lewat nomor WhatsApp, atau langsung pilih jadwal main.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Kembali ke beranda
        </Link>
        <Link href="/booking" className="btn-secondary">
          Booking unit
        </Link>
        <Link href="/cek" className="btn-ghost">
          Cek status
        </Link>
      </div>
    </div>
  );
}
