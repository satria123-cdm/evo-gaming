const BOOKING_LABELS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Menunggu pembayaran",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
  confirmed: {
    label: "Dipesan",
    className: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  },
  in_use: {
    label: "Sedang digunakan",
    className: "border-violet-400/40 bg-violet-400/10 text-violet-200",
  },
  completed: {
    label: "Selesai",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  },
};

const PAYMENT_LABELS: Record<string, { label: string; className: string }> = {
  unpaid: {
    label: "Belum dibayar",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
  pending: {
    label: "Menunggu pembayaran",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
  paid: {
    label: "Lunas",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  failed: {
    label: "Gagal",
    className: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  },
  refunded: {
    label: "Refund",
    className: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const item = BOOKING_LABELS[status] ?? {
    label: status,
    className: "border-line bg-white/5 text-slate-200",
  };
  return <span className={`chip ${item.className}`}>{item.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const item = PAYMENT_LABELS[status] ?? {
    label: status,
    className: "border-line bg-white/5 text-slate-200",
  };
  return <span className={`chip ${item.className}`}>{item.label}</span>;
}
