"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah, type PackagePlan } from "@/lib/pricing";

type Unit = {
  id: number;
  unitCode: string;
  tableNumber: string | null;
  available: boolean;
  maintenance: boolean;
};

const TIMES = Array.from({ length: 27 }, (_, index) => {
  const total = 10 * 60 + index * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

export function WalkInForm({
  defaultDate,
  defaultTime,
  packages,
}: {
  defaultDate: string;
  defaultTime: string;
  packages: PackagePlan[];
}) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [durationHours, setDurationHours] = useState(1);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [method, setMethod] = useState<"cash" | "qris">("cash");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ code: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ date, time, duration: String(durationHours) });
        const response = await fetch(`/api/availability?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error ?? "Gagal memuat unit.");
          setUnits([]);
          return;
        }
        setError(null);
        setUnits(payload.units as Unit[]);
        setUnitId((current) =>
          (payload.units as Unit[]).some((unit) => unit.id === current && unit.available)
            ? current
            : null,
        );
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") setError("Tidak dapat menghubungi server.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [date, time, durationHours]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!unitId) {
      setError("Pilih unit yang tersedia.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          whatsapp,
          date,
          time,
          durationHours,
          psUnitId: unitId,
          method,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal membuat booking.");
        return;
      }
      setCreated({ code: payload.booking.code });
      setName("");
      setWhatsapp("");
      setUnitId(null);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  const pkg = packages.find((item) => item.hours === durationHours) ?? packages[0];

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="walkin-date">Tanggal</label>
          <input
            id="walkin-date"
            type="date"
            className="input"
            value={date}
            min={defaultDate}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="walkin-time">Jam mulai</label>
          <select id="walkin-time" className="input" value={time} onChange={(event) => setTime(event.target.value)}>
            {TIMES.map((option) => (
              <option key={option} value={option}>{option.replace(":", ".")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="walkin-duration">Durasi</label>
          <select
            id="walkin-duration"
            className="input"
            value={durationHours}
            onChange={(event) => setDurationHours(Number(event.target.value))}
          >
            {packages.map((option) => (
              <option key={option.code} value={option.hours}>
                {option.label} • {formatRupiah(option.price)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="label">Unit {loading && <span className="text-accent">• memuat…</span>}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {units.map((unit) => (
            <button
              key={unit.id}
              type="button"
              disabled={!unit.available}
              onClick={() => setUnitId(unit.id)}
              className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                unitId === unit.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-slate-300"
              } ${!unit.available ? "cursor-not-allowed opacity-40" : "hover:border-accent/50"}`}
            >
              {unit.unitCode}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="walkin-name">Nama pelanggan</label>
          <input
            id="walkin-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="walkin-wa">WhatsApp</label>
          <input
            id="walkin-wa"
            className="input"
            inputMode="tel"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["cash", "qris"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMethod(option)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                method === option
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-slate-300"
              }`}
            >
              {option === "cash" ? "Tunai di tempat" : "QRIS"}
            </button>
          ))}
        </div>
        <span className="text-lg font-bold text-accent">{formatRupiah(pkg.price)}</span>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {created && (
        <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          Booking {created.code} dibuat.{" "}
          <Link href={`/booking/${created.code}`} className="underline">
            Lihat detail
          </Link>
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={submitting || !unitId}>
        {submitting ? "Menyimpan…" : "Simpan booking langsung"}
      </button>
      <p className="text-xs text-slate-500">
        Tunai langsung dicatat sebagai booking terkonfirmasi dengan pembayaran belum lunas.
        Tandai lunas dari halaman Booking setelah uang diterima.
      </p>
    </form>
  );
}
