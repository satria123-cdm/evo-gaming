"use client";

import { useState } from "react";
import {
  formatRupiah,
  MAX_PACKAGE_HOURS,
  type PackagePlan,
} from "@/lib/pricing";

type Row = { hours: string; price: string };

function toRows(packages: PackagePlan[]): Row[] {
  return packages.map((pkg) => ({
    hours: String(pkg.hours),
    price: String(pkg.price),
  }));
}

function nextFreeHours(rows: Row[]): number | null {
  const used = new Set(rows.map((row) => Number(row.hours)));
  for (let hours = 1; hours <= MAX_PACKAGE_HOURS; hours += 1) {
    if (!used.has(hours)) return hours;
  }
  return null;
}

export function AdminPackageForm({ initialPackages }: { initialPackages: PackagePlan[] }) {
  const [rows, setRows] = useState<Row[]>(toRows(initialPackages));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function addRow() {
    setError(null);
    setNotice(null);
    const hours = nextFreeHours(rows);
    if (hours === null) {
      setError(`Semua durasi 1–${MAX_PACKAGE_HOURS} jam sudah dipakai.`);
      return;
    }
    setRows((current) => [...current, { hours: String(hours), price: "" }]);
  }

  function removeRow(index: number) {
    setError(null);
    setNotice(null);
    if (rows.length <= 1) {
      setError("Minimal harus ada satu paket harga.");
      return;
    }
    setRows((current) => current.filter((_, position) => position !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      packages: rows.map((row) => ({
        hours: Number(row.hours),
        price: Number(row.price),
      })),
    };

    const seen = new Set<number>();
    for (const pkg of payload.packages) {
      if (seen.has(pkg.hours)) {
        setError(`Durasi ${pkg.hours} jam dipakai lebih dari sekali.`);
        setSaving(false);
        return;
      }
      seen.add(pkg.hours);
    }

    try {
      const response = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Gagal menyimpan paket harga.");
        return;
      }
      setRows(toRows(body.packages ?? initialPackages));
      setNotice("Paket harga diperbarui. Halaman booking langsung memakai daftar ini.");
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display-title text-xl">Paket &amp; harga rental</h2>
          <p className="text-sm text-slate-400">
            Tambah, hapus, atau ubah harga paket per jam. Durasi 1–
            {MAX_PACKAGE_HOURS} jam agar sesi tetap selesai sebelum 00.00 WITA.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={addRow} disabled={saving}>
          + Tambah paket
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row, index) => {
          const hours = Number(row.hours);
          const price = Number(row.price);
          const perHour =
            Number.isFinite(hours) && hours > 0 && Number.isFinite(price)
              ? Math.round(price / hours)
              : 0;

          return (
            <div
              key={index}
              className="relative rounded-xl border border-line/70 bg-night/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-wider text-slate-200">
                  Paket {hours > 0 ? `${hours} jam` : "baru"}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-rose-400/40 px-2 py-0.5 text-[11px] font-semibold text-rose-200 hover:border-rose-300 hover:bg-rose-400/10"
                  onClick={() => removeRow(index)}
                  disabled={saving}
                >
                  Hapus
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="label" htmlFor={`hours-${index}`}>
                    Durasi (jam)
                  </label>
                  <input
                    id={`hours-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_PACKAGE_HOURS}
                    className="input"
                    value={row.hours}
                    onChange={(event) => updateRow(index, { hours: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`price-${index}`}>
                    Harga (Rp)
                  </label>
                  <input
                    id={`price-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={500}
                    className="input"
                    value={row.price}
                    onChange={(event) => updateRow(index, { price: event.target.value })}
                    required
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                ≈ {formatRupiah(perHour)} / jam
              </p>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan paket"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setRows(toRows(initialPackages));
            setError(null);
            setNotice(null);
          }}
          disabled={saving}
        >
          Reset ke nilai tersimpan
        </button>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Menghapus paket hanya menghilangkan pilihan durasi untuk booking baru.
        Booking yang sudah dibuat tetap menyimpan durasi dan harga saat itu.
      </p>
    </form>
  );
}
