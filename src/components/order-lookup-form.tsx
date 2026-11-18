"use client";

import Link from "next/link";
import { useState } from "react";
import { PaymentStatusBadge } from "@/components/status-badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/lib/order-status";
import { formatRupiah } from "@/lib/pricing";
import { formatTimeWita } from "@/lib/time";

type OrderItem = {
  productName: string;
  quantity: number;
  lineTotal: number;
};

type OrderLookup = {
  code: string;
  customerName: string;
  status: string;
  subtotal: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  tableNumber: string | null;
  bookingCode: string | null;
  items: OrderItem[];
};

function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status;
}

function statusTone(status: string): string {
  return (
    ORDER_STATUS_TONES[status as keyof typeof ORDER_STATUS_TONES] ??
    "border-line bg-white/5 text-slate-200"
  );
}

export function OrderLookupForm({ initialWhatsapp = "" }: { initialWhatsapp?: string }) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [results, setResults] = useState<OrderLookup[] | null>(null);
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
      const response = await fetch(`/api/orders/lookup?wa=${encodeURIComponent(value)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Pesanan tidak dapat dimuat.");
        return;
      }
      setResults(payload.orders as OrderLookup[]);
      setSearched(payload.whatsapp as string);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="order-wa">
            Nomor WhatsApp
          </label>
          <input
            id="order-wa"
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
            Nomor yang Anda isi saat memesan F&amp;B. Kode pesanan tidak perlu diingat.
          </p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Mencari…" : "Cek pesanan"}
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
          Tidak ada pesanan untuk nomor <span className="font-semibold">{searched}</span>.
          Pastikan nomor sama dengan yang dipakai saat memesan, atau{" "}
          <Link href="/menu" className="font-semibold text-accent">
            pesan menu
          </Link>
          .
        </p>
      )}

      {results && results.length > 0 && (
        <section className="space-y-3" aria-live="polite">
          <p className="text-sm text-slate-400">
            {results.length} pesanan ditemukan untuk nomor{" "}
            <span className="font-semibold text-slate-200">{searched}</span>.
          </p>
          <ul className="space-y-3">
            {results.map((order) => (
              <li key={order.code} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="code-shimmer inline-block text-xl font-black">
                      {order.code}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatTimeWita(order.createdAt)} WITA • Meja{" "}
                      {order.tableNumber ?? "-"}
                      {order.bookingCode ? ` • ${order.bookingCode}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`chip ${statusTone(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <ul className="space-y-1 text-sm text-slate-300">
                  {order.items.map((item, index) => (
                    <li key={`${order.code}-${index}`} className="flex justify-between gap-3">
                      <span>
                        {item.productName}
                        <span className="text-slate-500"> × {item.quantity}</span>
                      </span>
                      <span className="font-semibold">{formatRupiah(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                  <span className="text-sm text-slate-400">Total</span>
                  <span className="font-display text-lg font-bold text-accent">
                    {formatRupiah(order.subtotal)}
                  </span>
                </div>

                <Link href={`/order/${order.code}`} className="btn-secondary inline-flex">
                  Lihat status pesanan
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
