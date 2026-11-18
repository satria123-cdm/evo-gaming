"use client";

import Link from "next/link";
import { useState } from "react";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { formatRupiah } from "@/lib/pricing";
import { formatDateWita, formatTimeWita } from "@/lib/time";

type BookingLookup = {
  code: string;
  customerName: string;
  unit: string;
  tableNumber: string | null;
  startAt: string;
  endAt: string;
  durationHours: number;
  packageCode: string;
  price: number;
  status: string;
  paymentStatus: string;
  source: string;
};

export function CheckBookingForm({ initialWhatsapp = "" }: { initialWhatsapp?: string }) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [results, setResults] = useState<BookingLookup[] | null>(null);
  const [searched, setSearched] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = whatsapp.trim();
    if (value.replace(/\D/g, "").length < 8) {
      setError("Masukkan nomor WhatsApp yang valid.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch(
        `/api/bookings/lookup?wa=${encodeURIComponent(value)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Booking tidak dapat dimuat.");
        return;
      }
      setResults(payload.bookings as BookingLookup[]);
      setSearched(payload.whatsapp as string);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="card grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div>
          <label className="label" htmlFor="wa">
            Nomor WhatsApp
          </label>
          <input
            id="wa"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="08xxxxxxxxxx"
            required
            minLength={8}
            maxLength={20}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Gunakan nomor yang Anda isi saat booking. Kode booking tidak perlu diingat.
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Mencari…" : "Cek booking"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      {results && results.length === 0 && (
        <p className="card p-5 text-sm text-slate-300">
          Tidak ada booking untuk nomor <span className="font-semibold">{searched}</span>.
          Pastikan nomor sama dengan yang dipakai saat memesan, atau{" "}
          <Link href="/booking" className="font-semibold text-accent">
            buat booking baru
          </Link>
          .
        </p>
      )}

      {results && results.length > 0 && (
        <section className="space-y-3" aria-live="polite">
          <p className="text-sm text-slate-400">
            {results.length} booking ditemukan untuk nomor{" "}
            <span className="font-semibold text-slate-200">{searched}</span>.
          </p>
          <ul className="space-y-3">
            {results.map((booking) => (
              <li key={booking.code} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="code-shimmer inline-block text-xl font-black">
                      {booking.code}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {booking.source === "walk_in" ? "Walk-in" : "Online"} • Paket{" "}
                      {booking.packageCode}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <BookingStatusBadge status={booking.status} />
                    <PaymentStatusBadge status={booking.paymentStatus} />
                  </div>
                </div>

                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-400">Pemesan</dt>
                    <dd className="font-semibold">{booking.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Unit / Meja</dt>
                    <dd className="font-semibold">
                      {booking.unit} • Meja {booking.tableNumber ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Jadwal (WITA)</dt>
                    <dd className="font-semibold">
                      {formatDateWita(booking.startAt)} • {formatTimeWita(booking.startAt)}–
                      {formatTimeWita(booking.endAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Durasi / Biaya</dt>
                    <dd className="font-semibold">
                      {booking.durationHours} jam •{" "}
                      <span className="text-accent">{formatRupiah(booking.price)}</span>
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/booking/${booking.code}`} className="btn-secondary">
                    Lihat detail{booking.status === "pending" ? " & bayar" : ""}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
