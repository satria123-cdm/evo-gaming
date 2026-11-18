/**
 * Order status flow for the F&B module.
 * Kept free of server imports so client components can share it.
 */
export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "processing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Baru masuk",
  confirmed: "Dikonfirmasi",
  processing: "Diproses",
  ready: "Siap diantar",
  delivering: "Sedang diantar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, string> = {
  new: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  confirmed: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  processing: "border-violet-400/40 bg-violet-400/10 text-violet-200",
  ready: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  delivering: "border-indigo-400/40 bg-indigo-400/10 text-indigo-200",
  completed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  cancelled: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

/** Statuses that still occupy the kitchen/admin queue. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "processing",
  "ready",
  "delivering",
];

const FLOW: OrderStatus[] = [
  "new",
  "confirmed",
  "processing",
  "ready",
  "delivering",
  "completed",
];

/** The next step in the delivery flow, or null when finished. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = FLOW.indexOf(status);
  if (index < 0 || index === FLOW.length - 1) return null;
  return FLOW[index + 1];
}

export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Konfirmasi",
  confirmed: "Proses",
  processing: "Siap",
  ready: "Antar",
  delivering: "Selesai",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isActiveOrderStatus(status: string): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(status);
}
