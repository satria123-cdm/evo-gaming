import { DateTime } from "luxon";

/** Banjarmasin uses WITA (UTC+8). Single source of truth for scheduling. */
export const APP_ZONE = "Asia/Makassar";

export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 24; // midnight = end of the operational day

export const MIN_BOOKING_NOTICE_MINUTES = 5;

export function nowInAppZone(): DateTime {
  return DateTime.now().setZone(APP_ZONE);
}

export function toDateTime(value: Date | string): DateTime {
  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value), {
    zone: APP_ZONE,
  });
}

/** Parse a `YYYY-MM-DD` + `HH:mm` pair chosen by a customer as WITA wall time. */
export function parseWitaSlot(dateISO: string, timeHHmm: string): DateTime {
  return DateTime.fromISO(`${dateISO}T${timeHHmm}`, { zone: APP_ZONE });
}

/**
 * Operational day runs 10:00 -> 24:00. Returns the window for a date,
 * or null if the input cannot be parsed.
 */
export function operationalDay(dateISO: string) {
  const open = DateTime.fromISO(dateISO, { zone: APP_ZONE }).set({
    hour: OPEN_HOUR,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  if (!open.isValid) return null;
  const close = open.plus({ days: 1 }).startOf("day");
  return { open, close };
}

export type SlotResult =
  | { ok: true; start: Date; end: Date; startDt: DateTime; endDt: DateTime }
  | { ok: false; error: string };

export function buildSlot(
  dateISO: string,
  timeHHmm: string,
  durationHours: number,
): SlotResult {
  const startDt = parseWitaSlot(dateISO, timeHHmm);
  if (!startDt.isValid) {
    return { ok: false, error: "Tanggal atau jam tidak valid." };
  }
  const day = operationalDay(dateISO);
  if (!day) {
    return { ok: false, error: "Tanggal tidak valid." };
  }
  if (startDt < day.open) {
    return { ok: false, error: "Jam mulai paling awal 10.00 WITA." };
  }

  const endDt = startDt.plus({ hours: durationHours });
  if (endDt > day.close) {
    return {
      ok: false,
      error: "Booking harus selesai paling lambat pukul 00.00 WITA.",
    };
  }

  if (startDt < nowInAppZone().plus({ minutes: MIN_BOOKING_NOTICE_MINUTES })) {
    return { ok: false, error: "Jadwal yang dipilih sudah lewat." };
  }

  return { ok: true, start: startDt.toJSDate(), end: endDt.toJSDate(), startDt, endDt };
}

export function formatWita(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_ZONE,
    ...options,
  }).format(value instanceof Date ? value : new Date(value));
}

export function formatDateWita(value: Date | string): string {
  return formatWita(value, { dateStyle: "full" });
}

export function formatTimeWita(value: Date | string): string {
  return formatWita(value, { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
}

export function todayISO(): string {
  return nowInAppZone().toISODate() ?? "";
}

/** True when a timestamp (e.g. a payment hold) is still in the future. */
export function hasTimeRemaining(value: Date | string | null): boolean {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}
