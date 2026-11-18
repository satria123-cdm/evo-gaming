"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminBookingActions({
  bookingId,
  bookingStatus,
  paymentStatus,
}: {
  bookingId: number;
  bookingStatus: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(body: Record<string, string>) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal memperbarui booking.");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  const canMarkPaid = paymentStatus === "unpaid" || paymentStatus === "pending";
  const canStart = bookingStatus === "confirmed";
  const canFinish = bookingStatus === "in_use";
  const canCancel = bookingStatus === "pending" || bookingStatus === "confirmed";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canMarkPaid && (
        <button
          type="button"
          className="rounded-lg border border-emerald-400/40 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10"
          onClick={() => update({ paymentStatus: "paid" })}
          disabled={loading}
        >
          Tandai lunas
        </button>
      )}
      {canStart && (
        <button
          type="button"
          className="rounded-lg border border-violet-400/40 px-2.5 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-400/10"
          onClick={() => update({ bookingStatus: "in_use" })}
          disabled={loading}
        >
          Mulai
        </button>
      )}
      {canFinish && (
        <button
          type="button"
          className="rounded-lg border border-sky-400/40 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-400/10"
          onClick={() => update({ bookingStatus: "completed" })}
          disabled={loading}
        >
          Selesai
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          className="rounded-lg border border-rose-400/40 px-2.5 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-400/10"
          onClick={() => update({ bookingStatus: "cancelled" })}
          disabled={loading}
        >
          Batalkan
        </button>
      )}
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </div>
  );
}
