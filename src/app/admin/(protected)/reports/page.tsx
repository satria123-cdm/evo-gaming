import Link from "next/link";
import { ReportBook } from "@/components/report-book";
import {
  defaultReportRange,
  foodOrderHistory,
  liveReport,
  lowStockProducts,
  rangeLabel,
  rentalHistory,
  salesReport,
  type LiveReport,
  type SalesReport,
} from "@/lib/reports";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const fallback = defaultReportRange();
  const from = params.from && DATE_RE.test(params.from) ? params.from : fallback.from;
  const to = params.to && DATE_RE.test(params.to) ? params.to : fallback.to;

  let report: SalesReport | null = null;
  let live: LiveReport | null = null;
  let rentalRows: Awaited<ReturnType<typeof rentalHistory>> = [];
  let foodRows: Awaited<ReturnType<typeof foodOrderHistory>> = [];
  let error: string | null = null;
  try {
    [report, live, rentalRows, foodRows] = await Promise.all([
      salesReport(from, to),
      liveReport(from, to),
      rentalHistory(from, to),
      foodOrderHistory(from, to),
    ]);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Laporan tidak dapat dimuat.";
  }

  const lowStock = await lowStockProducts(5);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Laporan</h1>
          <p className="text-sm text-slate-400">
            Buku besar rental dan F&amp;B. Buka bukunya untuk membaca ringkasan, memutar
            halaman, lalu menutupnya kembali. Hari mengikuti WITA (UTC+8).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-ghost">
            Buka antrean pesanan
          </Link>
          <Link href="/admin/menu" className="btn-ghost">
            Kelola menu
          </Link>
        </div>
      </header>

      <form action="/admin/reports" method="get" className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label" htmlFor="report-from">
            Dari tanggal
          </label>
          <input id="report-from" name="from" type="date" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="report-to">
            Sampai tanggal
          </label>
          <input id="report-to" name="to" type="date" defaultValue={to} className="input" />
        </div>
        <button type="submit" className="btn-primary">
          Tampilkan
        </button>
        <p className="w-full text-[11px] text-slate-500">
          Maksimal 366 hari. Pendapatan dihitung dari transaksi berstatus lunas; ringkasan
          dan pembayaran terbaru menyegarkan sendiri setiap 10 detik.
        </p>
      </form>

      {error || !report || !live ? (
        <p className="card border-rose-400/40 bg-rose-400/10 p-5 text-sm text-rose-200">
          {error ?? "Laporan tidak dapat dimuat."}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            Periode: <span className="font-semibold text-slate-200">{rangeLabel(from, to)}</span>{" "}
            • {report.range.days} hari
          </p>

          <ReportBook
            from={from}
            to={to}
            days={report.range.days}
            rangeText={rangeLabel(from, to)}
            liveInitial={live}
            report={report}
            rentalRows={rentalRows.map((row) => ({
              ...row,
              startAt: row.startAt.toISOString(),
              endAt: row.endAt.toISOString(),
            }))}
            foodRows={foodRows.map((row) => ({
              ...row,
              createdAt: row.createdAt.toISOString(),
            }))}
            lowStock={lowStock.map((product) => ({
              id: product.id,
              name: product.name,
              stockQuantity: product.stockQuantity,
            }))}
          />
        </>
      )}
    </div>
  );
}
