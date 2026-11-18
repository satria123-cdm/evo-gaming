import { ApiError, jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { defaultReportRange, liveReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Live snapshot for the admin report page. Polled by the client every few
 * seconds so revenue from new PS bookings and F&B orders shows up without a
 * manual reload.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const params = new URL(request.url).searchParams;
    const fallback = defaultReportRange();
    const from = params.get("from") ?? fallback.from;
    const to = params.get("to") ?? fallback.to;

    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      throw new ApiError(400, "Format tanggal laporan tidak valid.", "invalid_range");
    }

    return Response.json({ ok: true, report: await liveReport(from, to) });
  } catch (error) {
    return jsonError(error);
  }
}
