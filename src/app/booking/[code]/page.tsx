import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { MockPayButton } from "@/components/mock-pay-button";
import { getBookingByCode } from "@/lib/bookings";
import { isMockPaymentEnabled } from "@/lib/gateway";
import { buildDummyQrisPayload } from "@/lib/payments";
import { formatRupiah } from "@/lib/pricing";
import { formatDateWita, formatTimeWita, formatWita, hasTimeRemaining } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const detail = await getBookingByCode(code);
  if (!detail) notFound();

  const { booking, customer, unit, tableNumber, payments } = detail;
  const activePayment =
    payments.find((payment) => payment.status === "pending") ?? payments[0];
  const isHoldActive =
    booking.bookingStatus === "pending" && hasTimeRemaining(booking.holdExpiresAt);
  const mockMode = isMockPaymentEnabled();
  const pendingQris =
    activePayment?.status === "pending" && activePayment.method === "qris";

  const qrDataUrl =
    mockMode && pendingQris
      ? await QRCode.toDataURL(
          buildDummyQrisPayload(activePayment.paymentReference, activePayment.amount),
          { margin: 1, width: 260, color: { dark: "#060912", light: "#e6edf7" } },
        )
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kode booking</p>
          <h1 className="code-shimmer mt-1 inline-block text-3xl font-black tracking-tight">
            {booking.bookingCode}
          </h1>
          <p className="mt-1 text-[11px] text-slate-500">
            Dibuat{" "}
            {formatWita(booking.createdAt, {
              dateStyle: "medium",
              timeStyle: "medium",
            })}{" "}
            WITA
          </p>
        </div>
        <BookingStatusBadge status={booking.bookingStatus} />
      </div>

      <section className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Jadwal</p>
            <p className="font-semibold">{formatDateWita(booking.startAt)}</p>
            <p className="text-sm text-slate-300">
              {formatTimeWita(booking.startAt)}–{formatTimeWita(booking.endAt)} WITA •{" "}
              {booking.durationHours} jam
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Unit</p>
            <p className="font-semibold">
              {unit.unitCode} • Meja {tableNumber ?? "-"}
            </p>
            <p className="text-sm text-slate-300">{unit.chairCount} kursi</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Pemesan</p>
            <p className="font-semibold">{customer.name}</p>
            <p className="text-sm text-slate-300">{customer.whatsapp}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Pembayaran</p>
            <PaymentStatusBadge status={booking.paymentStatus} />
            <p className="mt-1 text-lg font-bold text-accent">
              {formatRupiah(booking.rentalPrice)}
            </p>
          </div>
        </div>
      </section>

      {pendingQris && (
        <section className="card space-y-4 p-5 text-center">
          <h2 className="text-lg font-bold">
            {mockMode ? "Bayar dengan QRIS (Simulasi)" : "Bayar dengan QRIS"}
          </h2>

          {mockMode ? (
            <>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QRIS simulasi"
                  className="mx-auto h-60 w-60 rounded-xl bg-white p-2"
                />
              ) : null}
              <p className="text-sm text-slate-300">
                Nominal {formatRupiah(activePayment.amount)} • Ref{" "}
                {activePayment.paymentReference}
              </p>
              <p className="text-xs text-amber-200">
                QR di atas adalah QR dummy untuk mode simulasi. Tidak ada uang yang
                benar-benar ditagih.
              </p>
              {isHoldActive && booking.holdExpiresAt && (
                <p className="text-xs text-amber-200">
                  Slot ditahan sampai {formatTimeWita(booking.holdExpiresAt)} WITA. Setelah itu
                  slot dilepas otomatis.
                </p>
              )}
              <MockPayButton reference={activePayment.paymentReference} />
            </>
          ) : (
            <p className="text-sm text-slate-300">
              Gateway QRIS belum dikonfigurasi. Hubungi petugas untuk menyelesaikan
              pembayaran booking ini.
            </p>
          )}
        </section>
      )}

      {booking.bookingStatus === "confirmed" && (
        <section className="card border-emerald-400/30 bg-emerald-400/5 p-5">
          <h2 className="font-bold text-emerald-200">Booking terkonfirmasi</h2>
          <p className="mt-1 text-sm text-slate-300">
            Datang sesuai jadwal dan tunjukkan kode booking ini. Pembayaran sudah diterima.
          </p>
        </section>
      )}

      {(booking.bookingStatus === "expired" || booking.bookingStatus === "cancelled") && (
        <section className="card border-rose-400/30 bg-rose-400/5 p-5">
          <h2 className="font-bold text-rose-200">Booking tidak aktif</h2>
          <p className="mt-1 text-sm text-slate-300">
            Slot sudah dilepas. Silakan buat booking baru jika masih ingin bermain.
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/booking" className="btn-ghost">
          Booking lagi
        </Link>
        <Link href={`/cek?wa=${encodeURIComponent(customer.whatsapp)}`} className="btn-ghost">
          Cek status
        </Link>
      </div>
    </div>
  );
}
