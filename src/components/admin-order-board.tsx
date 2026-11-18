"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/status-badge";
import {
  NEXT_ACTION_LABEL,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  isActiveOrderStatus,
  nextOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";
import { formatRupiah } from "@/lib/pricing";

type OrderItem = {
  id: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type AdminOrder = {
  id: number;
  code: string;
  customerName: string;
  customerWhatsapp: string;
  status: OrderStatus;
  subtotal: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  tableNumber: string | null;
  bookingCode: string | null;
  items: OrderItem[];
};

function timeWita(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(/:/g, ".");
}

export function AdminOrderBoard({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [scope, setScope] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const refresh = useCallback(
    async (nextScope: "active" | "all") => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/orders?status=${nextScope}`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error ?? "Gagal memuat pesanan.");
          return;
        }
        setOrders(payload.orders ?? []);
        setError(null);
      } catch {
        setError("Tidak dapat menghubungi server.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh(scope);
    }, 10_000);
    return () => clearInterval(timer);
  }, [refresh, scope]);

  async function changeScope(nextScope: "active" | "all") {
    setScope(nextScope);
    await refresh(nextScope);
  }

  async function patch(order: AdminOrder, body: Record<string, string>) {
    setPendingId(order.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal memperbarui pesanan.");
        return;
      }
      await refresh(scope);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setPendingId(null);
    }
  }

  const sorted = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const aActive = isActiveOrderStatus(a.status) ? 0 : 1;
        const bActive = isActiveOrderStatus(b.status) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
    [orders],
  );

  const activeCount = orders.filter((order) => isActiveOrderStatus(order.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={scope === "active" ? "btn-primary" : "btn-ghost"}
            onClick={() => void changeScope("active")}
            disabled={loading}
          >
            Antrean aktif ({activeCount})
          </button>
          <button
            type="button"
            className={scope === "all" ? "btn-primary" : "btn-ghost"}
            onClick={() => void changeScope("all")}
            disabled={loading}
          >
            Semua pesanan
          </button>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => void refresh(scope)}
          disabled={loading}
        >
          {loading ? "Memuat…" : "Muat ulang"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="card p-5 text-sm text-slate-400">
          {scope === "active" ? "Tidak ada pesanan aktif." : "Belum ada pesanan."}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((order) => {
            const next = nextOrderStatus(order.status);
            const final = order.status === "completed" || order.status === "cancelled";
            return (
              <article key={order.id} className="card space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {order.code}
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        Meja {order.tableNumber ?? "-"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {order.customerName}
                      {order.customerWhatsapp ? (
                        <>
                          {" • "}
                          <a
                            href={`https://wa.me/${order.customerWhatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-accent hover:underline"
                          >
                            {order.customerWhatsapp}
                          </a>
                        </>
                      ) : null}
                      {order.bookingCode ? ` • ${order.bookingCode}` : ""} •{" "}
                      {timeWita(order.createdAt)} WITA
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`chip ${ORDER_STATUS_TONES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <ul className="space-y-1 rounded-xl border border-line/70 bg-night/40 px-3 py-2 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span>
                        {item.productName}
                        <span className="text-slate-500"> × {item.quantity}</span>
                      </span>
                      <span className="font-semibold">{formatRupiah(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Total <span className="font-bold text-accent">{formatRupiah(order.subtotal)}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Update {timeWita(order.updatedAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {next && (
                    <button
                      type="button"
                      className="rounded-lg border border-accent/50 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/20"
                      onClick={() => void patch(order, { status: next })}
                      disabled={pendingId === order.id}
                    >
                      {NEXT_ACTION_LABEL[order.status] ?? "Lanjut"}
                    </button>
                  )}
                  {order.paymentStatus !== "paid" && !final && (
                    <button
                      type="button"
                      className="rounded-lg border border-emerald-400/40 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10"
                      onClick={() => void patch(order, { paymentStatus: "paid" })}
                      disabled={pendingId === order.id}
                    >
                      Tandai lunas
                    </button>
                  )}
                  {!final && (
                    <button
                      type="button"
                      className="rounded-lg border border-rose-400/40 px-2.5 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-400/10"
                      onClick={() => void patch(order, { status: "cancelled" })}
                      disabled={pendingId === order.id}
                    >
                      Batalkan
                    </button>
                  )}
                  {final && (
                    <span className="text-xs text-slate-500">Pesanan final</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        Halaman menyegarkan otomatis setiap 10 detik. Membatalkan pesanan mengembalikan stok.
      </p>
    </div>
  );
}
