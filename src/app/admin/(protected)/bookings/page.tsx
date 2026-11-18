import { AdminBookingActions } from "@/components/admin-booking-actions";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { listBookings } from "@/lib/bookings";
import { formatRupiah } from "@/lib/pricing";
import { formatDateWita, formatTimeWita } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await listBookings(100);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Booking</h1>
        <p className="text-sm text-slate-400">
          Verifikasi pembayaran tunai, ubah status sesi, dan batalkan booking.
        </p>
      </header>

      {bookings.length === 0 ? (
        <p className="card p-5 text-sm text-slate-400">Belum ada booking.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <article key={booking.id} className="card px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">
                    {booking.code}{" "}
                    <span className="ml-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                      {booking.source === "walk_in" ? "walk-in" : "online"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {booking.customerName} • {booking.whatsapp} • {booking.unitCode}
                  </p>
                  <p className="mt-1 text-sm">
                    {formatDateWita(booking.startAt)} • {formatTimeWita(booking.startAt)}–
                    {formatTimeWita(booking.endAt)} • {booking.durationHours} jam
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <BookingStatusBadge status={booking.bookingStatus} />
                    <PaymentStatusBadge status={booking.paymentStatus} />
                    <span className="text-sm font-bold text-accent">
                      {formatRupiah(booking.rentalPrice)}
                    </span>
                  </div>
                  <AdminBookingActions
                    bookingId={booking.id}
                    bookingStatus={booking.bookingStatus}
                    paymentStatus={booking.paymentStatus}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
