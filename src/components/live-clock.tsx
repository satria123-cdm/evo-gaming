"use client";

import { useEffect, useState } from "react";

const TIME_FORMAT = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Makassar",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Makassar",
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type ClockValue = { time: string; date: string };

function read(): ClockValue {
  const now = new Date();
  return {
    time: TIME_FORMAT.format(now).replace(/:/g, "."),
    date: DATE_FORMAT.format(now),
  };
}

/**
 * Ticking WITA clock for customer-facing pages.
 *
 * The first value arrives from a timer callback (not during render or
 * synchronously inside the effect) so server render and hydration agree, and
 * so React's purity rules stay happy. Afterwards it updates once per second.
 */
export function LiveClock({
  label = "Waktu sekarang",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [value, setValue] = useState<ClockValue | null>(null);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setValue(read());
      timer = window.setTimeout(tick, 1_000 - (Date.now() % 1_000));
    };
    timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span className={`live-clock ${className}`} role="status" aria-live="off">
      <span className="live-dot" aria-hidden="true" />
      <span className="text-[9px] uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="live-clock-time">{value?.time ?? "--.--.--"}</span>
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-accent">WITA</span>
      <span className="hidden text-[10px] font-normal text-slate-500 sm:inline">
        {value?.date ?? ""}
      </span>
    </span>
  );
}
