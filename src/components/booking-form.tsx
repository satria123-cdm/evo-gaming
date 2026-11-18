"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, type PackagePlan } from "@/lib/pricing";

type AvailabilityUnit = {
  id: number;
  unitCode: string;
  name: string;
  chairCount: number;
  tableNumber: string | null;
  maintenance: boolean;
  available: boolean;
  inUseNow: boolean;
};

type AvailabilityResponse = {
  startAt: string;
  endAt: string;
  units: AvailabilityUnit[];
};

const TIMES = Array.from({ length: 27 }, (_, index) => {
  const totalMinutes = 10 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function timeWita(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(":", ".");
}

function dateWita(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    dateStyle: "full",
  }).format(new Date(iso));
}

export function BookingForm({
  defaultDate,
  defaultTime,
  packages,
}: {
  defaultDate: string;
  defaultTime: string;
  packages: PackagePlan[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pkg = useMemo(
    () => packages.find((item) => item.hours === durationHours) ?? packages[0],
    [durationHours, packages],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          date,
          time,
          duration: String(durationHours),
        });
        const response = await fetch(`/api/availability?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          setAvailability(null);
          setError(payload.error ?? "Gagal memuat ketersediaan.");
          return;
        }
        setAvailability(payload as AvailabilityResponse);
        setUnitId((current) => {
          const stillAvailable = (payload as AvailabilityResponse).units.some(
            (unit) => unit.id === current && unit.available,
          );
          return stillAvailable ? current : null;
        });
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError("Tidak dapat menghubungi server.");
        }
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
      setError("Pilih unit PS yang tersedia terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          whatsapp,
          date,
          time,
          durationHours,
          psUnitId: unitId,
          method: "qris",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Booking gagal. Silakan coba lagi.");
        return;
      }
      router.push(`/booking/${payload.booking.code}`);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="text-lg font-bold">1. Pilih jadwal</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="date">
                Tanggal
              </label>
              <input
                id="date"
                type="date"
                className="input"
                value={date}
                min={defaultDate}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="time">
                Jam mulai (WITA)
              </label>
              <select
                id="time"
                className="input"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              >
                {TIMES.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(":", ".")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="duration">
                Durasi
              </label>
              <select
                id="duration"
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
          {availability && (
            <p className="text-xs text-slate-400">
              Slot: {dateWita(availability.startAt)} • {timeWita(availability.startAt)}–
              {timeWita(availability.endAt)} WITA
            </p>
          )}
        </section>

        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">2. Pilih unit PS</h2>
            {loading && <span className="text-xs text-accent">Memuat…</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(availability?.units ?? []).map((unit) => {
              const disabled = !unit.available;
              const selected = unitId === unit.id;
              return (
                <button
                  key={unit.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setUnitId(unit.id)}
                  aria-pressed={selected}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-line bg-night/40 hover:border-accent/40"
                  } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <span className="block font-bold">{unit.unitCode}</span>
                  <span className="block text-xs text-slate-400">
                    Meja {unit.tableNumber ?? "-"}
                  </span>
                  <span className="mt-2 block text-[11px] font-semibold">
                    {unit.maintenance
                      ? "Perawatan"
                      : unit.available
                        ? "Tersedia"
                        : "Sudah dipesan"}
                  </span>
                </button>
              );
            })}
          </div>
          {!loading && availability?.units.length === 0 && (
            <p className="text-sm text-slate-400">Tidak ada unit aktif.</p>
          )}
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-lg font-bold">3. Data pemesan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Nama
              </label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama pemesan"
                minLength={2}
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="whatsapp">
                Nomor WhatsApp
              </label>
              <input
                id="whatsapp"
                className="input"
                inputMode="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Nomor WhatsApp dipakai untuk mengecek status booking. Tidak perlu membuat akun.
          </p>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-4 p-5">
          <h2 className="text-lg font-bold">Ringkasan</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Paket</dt>
              <dd className="font-semibold">{pkg.label}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Unit</dt>
              <dd className="font-semibold">
                {availability?.units.find((unit) => unit.id === unitId)?.unitCode ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Total</dt>
              <dd className="text-xl font-bold text-accent">{formatRupiah(pkg.price)}</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-400">
            Slot ditahan 15 menit setelah booking dibuat. Pembayaran QRIS dikonfirmasi otomatis.
          </p>
          {error && (
            <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={submitting || !unitId}>
            {submitting ? "Memproses…" : "Lanjut ke Pembayaran"}
          </button>
        </div>
      </aside>
    </form>
  );
}
