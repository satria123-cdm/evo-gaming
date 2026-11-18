"use client";

import { useEffect, useState } from "react";
import { PaymentStatusBadge } from "@/components/status-badge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  type OrderStatus,
} from "@/lib/order-status";

const FLOW: OrderStatus[] = [
  "new",
  "confirmed",
  "processing",
  "ready",
  "delivering",
  "completed",
];

const STEP_COPY: Record<OrderStatus, string> = {
  new: "Pesanan diterima",
  confirmed: "Dikonfirmasi petugas",
  processing: "Sedang disiapkan",
  ready: "Siap diantar",
  delivering: "Sedang diantar ke meja",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

function timeWita(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(new Date(iso))
    .replace(/:/g, ".");
}

type LiveOrder = {
  code: string;
  status: OrderStatus;
  paymentStatus: string;
  updatedAt: string;
};

export function OrderStatusPanel({
  initialOrder,
}: {
  initialOrder: LiveOrder;
}) {
  const [order, setOrder] = useState<LiveOrder>(initialOrder);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch(`/api/orders/${order.code}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (!active) return;
        setOrder({
          code: payload.order.code,
          status: payload.order.status,
          paymentStatus: payload.order.paymentStatus,
          updatedAt: payload.order.updatedAt,
        });
        setOffline(false);
      } catch {
        if (active) setOffline(true);
      }
    }

    const timer = setInterval(refresh, 10_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [order.code]);

  const cancelled = order.status === "cancelled";
  const currentIndex = FLOW.indexOf(order.status);
  const statusTone = ORDER_STATUS_TONES[order.status];

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Status pesanan</h2>
        <div className="flex items-center gap-2">
          <span className={`chip ${statusTone}`}>{ORDER_STATUS_LABELS[order.status]}</span>
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {cancelled ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          Pesanan ini dibatalkan. Silakan hubungi petugas jika ada pertanyaan.
        </p>
      ) : (
        <ol className="space-y-3">
          {FLOW.map((step, index) => {
            const done = index <= currentIndex;
            return (
              <li key={step} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                    done
                      ? "border-accent bg-accent text-night"
                      : "border-line bg-night/60 text-slate-500"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </span>
                <div>
                  <p className={done ? "font-semibold text-white" : "text-slate-400"}>
                    {STEP_COPY[step]}
                  </p>
                  {index === currentIndex && (
                    <p className="text-xs text-accent">Tahap saat ini</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-[11px] text-slate-500">
        Diperbarui {timeWita(order.updatedAt)} WITA • halaman ini menyegarkan otomatis
        setiap 10 detik
        {offline ? " • koneksi terputus sementara" : ""}
      </p>
    </section>
  );
}
