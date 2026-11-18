"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MockPayButton({ reference }: { reference: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payments/${reference}/mock`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal mensimulasikan pembayaran.");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={pay} className="btn-secondary w-full" disabled={loading}>
        {loading ? "Memproses…" : "Simulasi Bayar Berhasil"}
      </button>
      <p className="text-center text-[11px] text-slate-500">
        Mode simulasi (PAYMENT_MODE=mock): transaksi langsung ditandai lunas tanpa
        gateway sungguhan.
      </p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}
