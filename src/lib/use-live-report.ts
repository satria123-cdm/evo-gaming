"use client";

import { useEffect, useState } from "react";
import type { LiveReport } from "@/lib/reports";

export const LIVE_REFRESH_MS = 10_000;

/**
 * Polls `GET /api/admin/reports/live` for the selected range. The server
 * renders the first snapshot, then the panel refreshes itself every 10 seconds
 * so newly settled payments show up without reloading the page.
 */
export function useLiveReport({
  from,
  to,
  initial,
}: {
  from: string;
  to: string;
  initial: LiveReport;
}) {
  const [report, setReport] = useState(initial);
  const [offline, setOffline] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(
          `/api/admin/reports/live?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          if (active) setOffline(true);
          return;
        }
        const payload = (await response.json()) as { report: LiveReport };
        if (!active) return;
        setReport(payload.report);
        setOffline(false);
      } catch {
        if (active) setOffline(true);
      } finally {
        if (active) setCheckedAt(new Date().toISOString());
      }
    }

    const firstRun = window.setTimeout(load, 1_500);
    const timer = window.setInterval(load, LIVE_REFRESH_MS);
    return () => {
      active = false;
      window.clearTimeout(firstRun);
      window.clearInterval(timer);
    };
  }, [from, to]);

  return { report, offline, checkedAt };
}
