import { jsonError } from "@/lib/api";
import { getAvailability } from "@/lib/bookings";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { availabilityQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "availability"), {
      limit: 120,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return Response.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const parsed = availabilityQuerySchema.safeParse({
      date: url.searchParams.get("date"),
      time: url.searchParams.get("time"),
      duration: url.searchParams.get("duration"),
    });

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Parameter tidak valid." },
        { status: 400 },
      );
    }

    const data = await getAvailability({
      date: parsed.data.date,
      time: parsed.data.time,
      durationHours: parsed.data.duration,
    });
    return Response.json(data);
  } catch (error) {
    return jsonError(error);
  }
}
