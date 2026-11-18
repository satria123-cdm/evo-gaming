import { BookingForm } from "@/components/booking-form";
import { LiveClock } from "@/components/live-clock";
import { getPackages } from "@/lib/packages";
import { nowInAppZone } from "@/lib/time";

export const dynamic = "force-dynamic";

function defaultSlot() {
  let candidate = nowInAppZone().set({ second: 0, millisecond: 0 });
  if (candidate.minute < 30) {
    candidate = candidate.set({ minute: 30 });
  } else {
    candidate = candidate.plus({ hours: 1 }).set({ minute: 0 });
  }
  if (candidate.hour < 10) candidate = candidate.set({ hour: 10, minute: 0 });
  if (candidate.hour > 23) {
    candidate = candidate.plus({ days: 1 }).set({ hour: 10, minute: 0 });
  }
  return {
    date: candidate.toISODate() ?? "",
    time: candidate.toFormat("HH:mm"),
  };
}

export default async function BookingPage() {
  const slot = defaultSlot();
  const packages = await getPackages();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Booking PS4</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Pilih jadwal dan unit. Ketersediaan diperiksa ulang di server saat booking dibuat,
            jadi slot yang tampil bisa berubah jika ada yang memesan lebih dulu.
          </p>
        </div>
        <LiveClock />
      </header>
      <BookingForm
        defaultDate={slot.date}
        defaultTime={slot.time}
        packages={packages}
      />
    </div>
  );
}
