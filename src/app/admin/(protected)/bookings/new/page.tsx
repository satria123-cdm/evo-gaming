import { WalkInForm } from "@/components/walk-in-form";
import { getPackages } from "@/lib/packages";
import { nowInAppZone } from "@/lib/time";

export const dynamic = "force-dynamic";

function defaultSlot() {
  let candidate = nowInAppZone().set({ second: 0, millisecond: 0 });
  const minute = candidate.minute < 30 ? 30 : 0;
  if (candidate.minute >= 30) candidate = candidate.plus({ hours: 1 });
  candidate = candidate.set({ minute });
  if (candidate.hour < 10) candidate = candidate.set({ hour: 10, minute: 0 });
  if (candidate.hour > 23) candidate = candidate.plus({ days: 1 }).set({ hour: 10, minute: 0 });
  return { date: candidate.toISODate() ?? "", time: candidate.toFormat("HH:mm") };
}

export default async function NewWalkInPage() {
  const slot = defaultSlot();
  const packages = await getPackages();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Booking langsung</h1>
        <p className="text-sm text-slate-400">
          Untuk pelanggan yang datang ke lokasi. Pemeriksaan bentrok sama dengan booking online.
        </p>
      </header>
      <WalkInForm
        defaultDate={slot.date}
        defaultTime={slot.time}
        packages={packages}
      />
    </div>
  );
}
