import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { MockPayButton } from "@/components/mock-pay-button";
import { OrderStatusPanel } from "@/components/order-status-panel";
import { PaymentStatusBadge } from "@/components/status-badge";
import { isMockPaymentEnabled } from "@/lib/gateway";
import { getOrderByCode } from "@/lib/orders";
import { buildDummyQrisPayload } from "@/lib/payments";
import { formatRupiah } from "@/lib/pricing";
import { formatTimeWita, formatWita, hasTimeRemaining } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();

  const mockMode = isMockPaymentEnabled();
  const payment = order.payment;
  const pendingQris = payment?.status === "pending" && payment.method === "qris";
  const holdActive = Boolean(order.paymentExpiresAt && hasTimeRemaining(order.paymentExpiresAt));

  const qrDataUrl =
    mockMode && pendingQris && payment
      ? await QRCode.toDataURL(buildDummyQrisPayload(payment.reference, payment.amount), {
          margin: 1,
          width: 260,
          color: { dark: "#060912", light: "#e6edf7" },
        })
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kode pesanan</p>
          <h1 className="code-shimmer mt-1 inline-block text-3xl font-black tracking-tight">
            {order.code}
          </h1>
        </div>
        <Link href="/menu" className="btn-ghost">
          Pesan lagi
        </Link>
      </div>

      <section className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Meja tujuan</p>
            <p className="font-semibold">Meja {order.tableNumber ?? "-"}</p>
            {order.bookingCode && (
              <p className="text-sm text-slate-400">Booking {order.bookingCode}</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Pemesan</p>
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-sm text-slate-400">
              Dibuat{" "}
              {formatWita(order.createdAt, {
                dateStyle: "medium",
                timeStyle: "medium",
              })}{" "}
              WITA
            </p>
          </div>
        </div>

        <ul className="divide-y divide-line/60 border-t border-line/60 pt-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2">
              <span>
                {item.productName}
                <span className="text-slate-500">
                  {" "}
                  × {item.quantity} @ {formatRupiah(item.unitPrice)}
                </span>
              </span>
              <span className="font-semibold">{formatRupiah(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-line/60 pt-3">
          <span className="text-sm text-slate-400">Total tagihan</span>
          <span className="text-xl font-bold text-accent">{formatRupiah(order.subtotal)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Pesanan masuk antrean dapur setelah pembayaran QRIS diterima.
          </p>
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </section>

      {payment && (
        <section className="card space-y-4 p-5 text-center">
          <div className="flex flex-wrap items-center justify-between gap-2 text-left">
            <h2 className="text-lg font-bold">Pembayaran F&amp;B</h2>
            <PaymentStatusBadge status={payment.status} />
          </div>

          {pendingQris ? (
            mockMode ? (
              <>
                <h3 className="display-title text-base text-accent">
                  Bayar dengan QRIS (Simulasi)
                </h3>
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QRIS simulasi"
                    className="mx-auto h-60 w-60 rounded-xl bg-white p-2"
                  />
                ) : null}
                <p className="text-sm text-slate-300">
                  Nominal {formatRupiah(payment.amount)} • Ref {payment.reference}
                </p>
                <p className="text-xs text-amber-200">
                  QR di atas adalah QR dummy untuk mode simulasi. Tidak ada uang yang
                  benar-benar ditagih.
                </p>
                {holdActive && order.paymentExpiresAt && (
                  <p className="text-xs text-amber-200">
                    Pesanan ditahan sampai {formatTimeWita(order.paymentExpiresAt)} WITA,
                    lalu otomatis dibatalkan dan stok dikembalikan.
                  </p>
                )}
                <MockPayButton reference={payment.reference} />
              </>
            ) : (
              <p className="text-sm text-slate-300">
                Gateway QRIS belum dikonfigurasi. Hubungi petugas untuk menyelesaikan
                pembayaran pesanan ini.
              </p>
            )
          ) : payment.status === "paid" ? (
            <p className="text-sm text-emerald-200">
              Pembayaran QRIS sudah diterima. Terima kasih!
            </p>
          ) : payment.status === "pending" ? (
            <p className="text-sm text-amber-200">
              Menunggu pembayaran. Selesaikan QRIS untuk memproses pesanan.
            </p>
          ) : (
            <p className="text-sm text-slate-300">
              Pembayaran {payment.status === "expired" ? "kedaluwarsa" : "gagal"}. Pesanan
              dibatalkan dan stok dikembalikan. Silakan pesan ulang.
            </p>
          )}
        </section>
      )}

      <OrderStatusPanel
        initialOrder={{
          code: order.code,
          status: order.status,
          paymentStatus: order.paymentStatus,
          updatedAt: order.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
