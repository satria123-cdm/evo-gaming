import Link from "next/link";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
} from "@/lib/order-status";
import { dashboardSummary, listBookings } from "@/lib/bookings";
import { listOrders } from "@/lib/orders";
import { formatRupiah } from "@/lib/pricing";
import { foodToday, lowStockProducts } from "@/lib/reports";
import { formatDateWita, formatTimeWita, nowInAppZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [summary, bookings, food, activeOrders, lowStock] = await Promise.all([
    dashboardSummary(),
    listBookings(12),
    foodToday(),
    listOrders({ activeOnly: true, limit: 5 }),
    lowStockProducts(5),
  ]);

  const stats = [
    { label: "Unit aktif", value: `${summary.unitsTotal - summary.unitsMaintenance}/${summary.unitsTotal}` },
    { label: "Sedang dipakai", value: String(summary.unitsInUse) },
    { label: "Booking hari ini", value: String(summary.todayBookings) },
    { label: "Pendapatan rental", value: formatRupiah(summary.todayRevenue) },
    { label: "Belum lunas", value: String(summary.unpaidCount) },
    { label: "Pesanan aktif", value: String(food.active) },
    { label: "F&B lunas hari ini", value: formatRupiah(food.revenue) },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400">
            {formatDateWita(nowInAppZone().toJSDate())} • WITA
          </p>
        </div>
        <Link href="/admin/bookings/new" className="btn-primary">
          + Booking langsung
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((stat) => (
          <div key={stat.label} className="card px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Booking terbaru</h2>
          <Link href="/admin/bookings" className="text-sm font-semibold text-accent">
            Lihat semua →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="card p-5 text-sm text-slate-400">Belum ada booking.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-bold">{booking.code}</p>
                  <p className="truncate text-xs text-slate-400">
                    {booking.customerName} • {booking.unitCode} •{" "}
                    {formatDateWita(booking.startAt)} {formatTimeWita(booking.startAt)}–
                    {formatTimeWita(booking.endAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BookingStatusBadge status={booking.bookingStatus} />
                  <PaymentStatusBadge status={booking.paymentStatus} />
                  <span className="text-sm font-semibold text-accent">
                    {formatRupiah(booking.rentalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Antrean pesanan F&amp;B</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-accent">
            Kelola pesanan →
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <p className="card p-5 text-sm text-slate-400">Tidak ada pesanan aktif.</p>
        ) : (
          <div className="space-y-2">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-bold">
                    {order.code}
                    <span className="ml-2 text-xs font-medium text-slate-500">
                      Meja {order.tableNumber ?? "-"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {order.customerName} •{" "}
                    {order.items
                      .map((item) => `${item.productName} ×${item.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${ORDER_STATUS_TONES[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-sm font-semibold text-accent">
                    {formatRupiah(order.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {lowStock.length > 0 && (
        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Stok menipis</h2>
            <Link href="/admin/menu" className="text-sm font-semibold text-accent">
              Kelola stok →
            </Link>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {lowStock.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm"
              >
                <span className="font-semibold">{product.name}</span>
                <span className="text-amber-200">Sisa {product.stockQuantity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
