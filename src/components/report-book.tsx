"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatRupiah } from "@/lib/pricing";
import type { LiveReport, SalesReport } from "@/lib/reports";
import { formatDateWita, formatTimeWita } from "@/lib/time";
import { LIVE_REFRESH_MS, useLiveReport } from "@/lib/use-live-report";

type RentalRow = {
  id: number;
  code: string;
  customerName: string;
  whatsapp: string;
  unitCode: string;
  tableNumber: string | null;
  startAt: string;
  endAt: string;
  durationHours: number;
  packageCode: string;
  rentalPrice: number;
  bookingStatus: string;
  paymentStatus: string;
  source: string;
};

type FoodRow = {
  id: number;
  code: string;
  customerName: string;
  whatsapp: string;
  tableNumber: string | null;
  bookingCode: string | null;
  status: string;
  paymentStatus: string;
  subtotal: number;
  createdAt: string;
};

type LowStockRow = { id: number; name: string; stockQuantity: number };

type ReportBookProps = {
  from: string;
  to: string;
  rangeText: string;
  days: number;
  liveInitial: LiveReport;
  report: SalesReport;
  rentalRows: RentalRow[];
  foodRows: FoodRow[];
  lowStock: LowStockRow[];
};

const SPREADS = [
  { left: "Ringkasan penjualan", right: "Pembayaran masuk" },
  { left: "Paket rental PS", right: "Menu F&B & stok" },
  { left: "Riwayat booking PS", right: "Riwayat pesanan F&B" },
] as const;

const BOOKING_INK: Record<string, { label: string; tone: string }> = {
  pending: { label: "Menunggu bayar", tone: "book-ink-amber" },
  confirmed: { label: "Dipesan", tone: "book-ink-blue" },
  in_use: { label: "Sedang dipakai", tone: "book-ink-violet" },
  completed: { label: "Selesai", tone: "book-ink-green" },
  cancelled: { label: "Dibatalkan", tone: "book-ink-slate" },
  expired: { label: "Kedaluwarsa", tone: "book-ink-slate" },
};

const PAYMENT_INK: Record<string, { label: string; tone: string }> = {
  paid: { label: "Lunas", tone: "book-ink-green" },
  unpaid: { label: "Belum bayar", tone: "book-ink-amber" },
  pending: { label: "Menunggu", tone: "book-ink-amber" },
  failed: { label: "Gagal", tone: "book-ink-rose" },
  expired: { label: "Kedaluwarsa", tone: "book-ink-slate" },
  refunded: { label: "Refund", tone: "book-ink-blue" },
};

const ORDER_INK_TONE: Record<string, string> = {
  new: "book-ink-blue",
  confirmed: "book-ink-blue",
  processing: "book-ink-amber",
  ready: "book-ink-green",
  delivering: "book-ink-green",
  completed: "book-ink-green",
  cancelled: "book-ink-slate",
};

function Ink({ label, tone }: { label: string; tone: string }) {
  return <span className={`book-ink ${tone}`}>{label}</span>;
}

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

function Page({
  side,
  title,
  subtitle,
  number,
  children,
}: {
  side: "left" | "right";
  title: string;
  subtitle?: string;
  number: number;
  children: React.ReactNode;
}) {
  return (
    <article className={`book-page book-page-${side}`}>
      <div className="book-page-head">
        <div>
          <p className="book-eyebrow">EVO GAMING • BANJARMASIN</p>
          <h3 className="book-title">{title}</h3>
          {subtitle && <p className="book-subtitle">{subtitle}</p>}
        </div>
        <span className="book-folio">{number}</span>
      </div>
      <div className="book-rule">
        <span />
      </div>
      <div className="book-page-body">{children}</div>
      <p className="book-page-foot">EVO Gaming Rental PS4 • Laporan WITA</p>
    </article>
  );
}

/** A real-feeling report book: closed cover, opening, and two-page spreads. */
export function ReportBook({
  from,
  to,
  rangeText,
  days,
  liveInitial,
  report,
  rentalRows,
  foodRows,
  lowStock,
}: ReportBookProps) {
  const [open, setOpen] = useState(false);
  const [spread, setSpread] = useState(0);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);
  const flipTimer = useRef<number | null>(null);
  const { report: live, offline, checkedAt } = useLiveReport({ from, to, initial: liveInitial });

  useEffect(
    () => () => {
      if (flipTimer.current !== null) window.clearTimeout(flipTimer.current);
    },
    [],
  );

  function go(direction: 1 | -1) {
    const target = Math.max(0, Math.min(SPREADS.length - 1, spread + direction));
    if (target === spread) return;
    if (flipTimer.current !== null) window.clearTimeout(flipTimer.current);
    setFlip(direction === 1 ? "next" : "prev");
    setSpread(target);
    flipTimer.current = window.setTimeout(() => setFlip(null), 560);
  }

  function jump(target: number) {
    if (target === spread) return;
    if (flipTimer.current !== null) window.clearTimeout(flipTimer.current);
    setFlip(target > spread ? "next" : "prev");
    setSpread(target);
    flipTimer.current = window.setTimeout(() => setFlip(null), 560);
  }

  function close() {
    if (flipTimer.current !== null) window.clearTimeout(flipTimer.current);
    setFlip(null);
    setOpen(false);
  }

  const latestTime = checkedAt ? timeWita(checkedAt) : null;
  const totalPages = SPREADS.length * 2;

  return (
    <div className="space-y-4">
      <div className="book-scene">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="book-cover"
            aria-label="Buka buku laporan"
          >
            <span className="book-cover-spine" aria-hidden="true" />
            <span className="book-cover-pages" aria-hidden="true" />
            <span className="book-cover-inner">
              <span className="book-crest">EVO</span>
              <span className="book-cover-kicker">Buku Laporan Penjualan</span>
              <span className="book-cover-title">
                EVO Gaming
                <br />
                Rental PS4
              </span>
              <span className="book-cover-divider" />
              <span className="book-cover-range">{rangeText}</span>
              <span className="book-cover-hint">Klik untuk membuka buku →</span>
            </span>
          </button>
        ) : (
          <div
            key={spread}
            className={`book-spread${flip ? ` book-flip-${flip}` : ""}`}
          >
            <span className="book-spine" aria-hidden="true" />
            <div className="book-bookmark" aria-hidden="true" />

            {spread === 0 && (
              <>
                <Page
                  side="left"
                  title="Ringkasan penjualan"
                  subtitle={`${days} hari • ${rangeText}`}
                  number={1}
                >
                  <div className="book-hero-amount">
                    <p>Total pendapatan lunas</p>
                    <strong>{formatRupiah(live.totalRevenue)}</strong>
                    <span>
                      {live.rental.count} booking PS • {live.food.count} pesanan F&amp;B
                    </span>
                  </div>

                  <div className="book-stat-grid">
                    <div>
                      <span>Rental PS</span>
                      <strong>{formatRupiah(live.rental.revenue)}</strong>
                      <small>{live.rental.paidHours} jam bermain</small>
                    </div>
                    <div>
                      <span>Makanan &amp; minuman</span>
                      <strong>{formatRupiah(live.food.revenue)}</strong>
                      <small>Pesanan lunas</small>
                    </div>
                    <div>
                      <span>Belum lunas</span>
                      <strong>{formatRupiah(live.unpaidAmount)}</strong>
                      <small>{live.unpaidCount} transaksi pending</small>
                    </div>
                  </div>

                  <h4 className="book-section-title">Sumber pendapatan</h4>
                  <ul className="book-list">
                    {live.sources.map((source) => (
                      <li key={source.key}>
                        <span className="book-list-main">
                          {source.label}
                          <small>{source.count} transaksi</small>
                        </span>
                        <strong>{formatRupiah(source.revenue)}</strong>
                      </li>
                    ))}
                  </ul>
                </Page>

                <Page
                  side="right"
                  title="Pembayaran masuk"
                  subtitle="Transaksi lunas terbaru dari PS dan F&B"
                  number={2}
                >
                  <div className="book-live-note">
                    <span
                      className={`book-live-dot${offline ? " is-offline" : ""}`}
                      aria-hidden="true"
                    />
                    {offline
                      ? "Koneksi terputus, mencoba lagi…"
                      : latestTime
                        ? `Diperbarui ${latestTime} WITA`
                        : "Memantau pembayaran baru…"}
                    <small>tiap {LIVE_REFRESH_MS / 1000} detik</small>
                  </div>

                  {live.latest.length === 0 ? (
                    <p className="book-empty">Belum ada pembayaran lunas pada periode ini.</p>
                  ) : (
                    <ul className="book-feed">
                      {live.latest.map((item) => (
                        <li key={item.id}>
                          <span className="book-feed-time">{timeWita(item.at)}</span>
                          <span className="book-feed-body">
                            <strong>{item.code}</strong>
                            <small>
                              {item.kind === "rental" ? "PS" : "F&B"} • {item.customer} •{" "}
                              {item.detail}
                            </small>
                          </span>
                          <strong className="book-feed-amount">
                            {formatRupiah(item.amount)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="book-note">
                    <strong>Catatan bendahara</strong>
                    <p>
                      Angka diambil dari transaksi berstatus lunas. Pembayaran yang masih
                      menunggu tidak masuk pendapatan sampai dikonfirmasi.
                    </p>
                  </div>
                </Page>
              </>
            )}

            {spread === 1 && (
              <>
                <Page
                  side="left"
                  title="Paket rental PS"
                  subtitle="Pendapatan berdasarkan durasi sewa"
                  number={3}
                >
                  {report.packages.length === 0 ? (
                    <p className="book-empty">Belum ada rental pada periode ini.</p>
                  ) : (
                    <ul className="book-bars">
                      {report.packages.map((pack) => {
                        const share =
                          live.rental.revenue > 0
                            ? Math.round((pack.revenue / live.rental.revenue) * 100)
                            : 0;
                        return (
                          <li key={pack.packageCode}>
                            <div className="book-bar-head">
                              <strong>{pack.packageCode}</strong>
                              <span>{pack.count} booking</span>
                              <strong>{formatRupiah(pack.revenue)}</strong>
                            </div>
                            <div className="book-bar-track">
                              <span style={{ width: `${Math.max(3, share)}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="book-note">
                    <strong>Harga paket</strong>
                    <p>
                      Durasi dan harga dapat diubah di halaman Pengaturan paket. Nilai pada
                      booking lama tetap mengikuti harga saat transaksi dibuat.
                    </p>
                  </div>
                </Page>

                <Page
                  side="right"
                  title="Menu F&B & stok"
                  subtitle="Produk terlaris dan stok yang perlu diperhatikan"
                  number={4}
                >
                  <h4 className="book-section-title">Produk terlaris</h4>
                  {report.topProducts.length === 0 ? (
                    <p className="book-empty">Belum ada pesanan F&amp;B lunas.</p>
                  ) : (
                    <ul className="book-list">
                      {report.topProducts.map((product) => (
                        <li key={product.name}>
                          <span className="book-list-main">
                            {product.name}
                            <small>{product.quantity} terjual</small>
                          </span>
                          <strong>{formatRupiah(product.revenue)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h4 className="book-section-title">Stok menipis</h4>
                  {lowStock.length === 0 ? (
                    <p className="book-empty">Semua stok masih di atas ambang 5.</p>
                  ) : (
                    <ul className="book-stock">
                      {lowStock.map((product) => (
                        <li key={product.id}>
                          <span>{product.name}</span>
                          <strong>{product.stockQuantity} pcs</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/admin/menu" className="book-link">
                    Kelola menu &amp; stok →
                  </Link>
                </Page>
              </>
            )}

            {spread === 2 && (
              <>
                <Page
                  side="left"
                  title="Riwayat booking PS"
                  subtitle={`${rentalRows.length} booking terbaru pada periode ini`}
                  number={5}
                >
                  {rentalRows.length === 0 ? (
                    <p className="book-empty">Belum ada booking pada periode ini.</p>
                  ) : (
                    <ul className="book-history">
                      {rentalRows.map((row) => {
                        const booking = BOOKING_INK[row.bookingStatus];
                        const payment = PAYMENT_INK[row.paymentStatus];
                        return (
                          <li key={row.id}>
                            <div className="book-history-top">
                              <strong className="book-history-code">{row.code}</strong>
                              <strong>{formatRupiah(row.rentalPrice)}</strong>
                            </div>
                            <p className="book-history-meta">
                              {formatDateWita(row.startAt)} • {formatTimeWita(row.startAt)}–
                              {formatTimeWita(row.endAt)} WITA
                            </p>
                            <p className="book-history-meta">
                              {row.customerName} • {row.whatsapp} • {row.unitCode}
                              {row.tableNumber ? ` / Meja ${row.tableNumber}` : ""}
                            </p>
                            <div className="book-history-tags">
                              <Ink label={booking?.label ?? row.bookingStatus} tone={booking?.tone ?? "book-ink-slate"} />
                              <Ink label={payment?.label ?? row.paymentStatus} tone={payment?.tone ?? "book-ink-slate"} />
                              <span className="book-history-small">
                                {row.source === "walk_in" ? "Walk-in" : "Online"}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Page>

                <Page
                  side="right"
                  title="Riwayat pesanan F&B"
                  subtitle={`${foodRows.length} pesanan terbaru pada periode ini`}
                  number={6}
                >
                  {foodRows.length === 0 ? (
                    <p className="book-empty">Belum ada pesanan F&amp;B pada periode ini.</p>
                  ) : (
                    <ul className="book-history">
                      {foodRows.map((row) => {
                        const orderLabel =
                          ORDER_STATUS_LABELS[row.status as keyof typeof ORDER_STATUS_LABELS] ??
                          row.status;
                        const payment = PAYMENT_INK[row.paymentStatus];
                        return (
                          <li key={row.id}>
                            <div className="book-history-top">
                              <strong className="book-history-code">{row.code}</strong>
                              <strong>{formatRupiah(row.subtotal)}</strong>
                            </div>
                            <p className="book-history-meta">
                              {formatDateWita(row.createdAt)} • {formatTimeWita(row.createdAt)} WITA
                              • Meja {row.tableNumber ?? "-"}
                            </p>
                            <p className="book-history-meta">
                              {row.customerName} • {row.whatsapp || "-"}
                              {row.bookingCode ? ` • ${row.bookingCode}` : ""}
                            </p>
                            <div className="book-history-tags">
                              <Ink
                                label={orderLabel}
                                tone={ORDER_INK_TONE[row.status] ?? "book-ink-slate"}
                              />
                              <Ink label={payment?.label ?? row.paymentStatus} tone={payment?.tone ?? "book-ink-slate"} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Page>
              </>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="book-controls">
          <button
            type="button"
            className="book-btn"
            onClick={() => go(-1)}
            disabled={spread === 0}
          >
            ← Sebelumnya
          </button>
          <div className="book-controls-center">
            <div className="book-dots" aria-label="Pilih halaman">
              {SPREADS.map((item, index) => (
                <button
                  key={item.left}
                  type="button"
                  aria-label={`Buka ${item.left}`}
                  aria-current={index === spread ? "page" : undefined}
                  className={`book-dot${index === spread ? " is-active" : ""}`}
                  onClick={() => jump(index)}
                />
              ))}
            </div>
            <span className="book-page-count">
              Halaman {spread * 2 + 1}–{spread * 2 + 2} dari {totalPages}
            </span>
          </div>
          <div className="book-controls-right">
            <button
              type="button"
              className="book-btn"
              onClick={() => go(1)}
              disabled={spread === SPREADS.length - 1}
            >
              Berikutnya →
            </button>
            <button type="button" className="book-btn book-btn-close" onClick={close}>
              Tutup buku
            </button>
          </div>
        </div>
      )}

      {!open && (
        <p className="text-center text-xs text-slate-500">
          Buku laporan ini dapat dibuka, dibalik halamannya, lalu ditutup kembali.
        </p>
      )}
    </div>
  );
}
