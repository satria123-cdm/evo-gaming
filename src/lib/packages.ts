import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, businessSettings } from "@/db/schema";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_PACKAGES,
  MAX_PACKAGE_HOURS,
  packageCode,
  packageLabel,
  type PackagePlan,
} from "@/lib/pricing";

const SETTING_KEY = "packages";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Read a stored setting value into a clean, sorted package list. */
function normalizeStored(value: unknown): PackagePlan[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const seen = new Set<number>();
  const plans: PackagePlan[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const hours = entry.hours;
    const price = entry.price;
    if (
      !Number.isInteger(hours) ||
      (hours as number) < 1 ||
      (hours as number) > MAX_PACKAGE_HOURS ||
      seen.has(hours as number)
    ) {
      continue;
    }
    if (!Number.isInteger(price) || (price as number) < 0) continue;

    seen.add(hours as number);
    plans.push({
      code: packageCode(hours as number),
      hours: hours as number,
      price: price as number,
      label: packageLabel(hours as number),
    });
  }

  if (plans.length === 0) return null;
  return plans.sort((a, b) => a.hours - b.hours);
}

/**
 * Package plans live in `business_settings` so the owner can add, remove, and
 * reprice them from the admin dashboard. Bookings snapshot `rental_price`, so
 * old rows keep the price they were created with.
 */
export async function getPackages(): Promise<PackagePlan[]> {
  const [row] = await db
    .select({ value: businessSettings.value })
    .from(businessSettings)
    .where(eq(businessSettings.key, SETTING_KEY))
    .limit(1);

  return normalizeStored(row?.value) ?? DEFAULT_PACKAGES.map((pkg) => ({ ...pkg }));
}

export async function savePackages(
  plans: { hours: number; price: number }[],
  actorId: string,
): Promise<PackagePlan[]> {
  const normalized = normalizeStored(
    plans.map((plan) => ({ ...plan, code: packageCode(plan.hours) })),
  );

  if (!normalized) {
    throw new ApiError(
      400,
      "Paket harga harus berisi minimal satu durasi yang valid.",
      "invalid_packages",
    );
  }

  const current = await getPackages();
  const added = normalized.filter(
    (plan) => !current.some((item) => item.hours === plan.hours),
  );
  const removed = current.filter(
    (plan) => !normalized.some((item) => item.hours === plan.hours),
  );
  const repriced = normalized
    .map((plan) => ({
      hours: plan.hours,
      before: current.find((item) => item.hours === plan.hours)?.price ?? null,
      after: plan.price,
    }))
    .filter((change) => change.before !== null && change.before !== change.after);

  await db.transaction(async (tx) => {
    await tx
      .insert(businessSettings)
      .values({ key: SETTING_KEY, value: normalized })
      .onConflictDoUpdate({
        target: businessSettings.key,
        set: { value: normalized, updatedAt: new Date() },
      });

    await tx.insert(auditLogs).values({
      actorType: "admin",
      actorId,
      action: "settings.packages",
      entity: "business_settings",
      entityId: SETTING_KEY,
      meta: { added, removed, repriced },
    });
  });

  return normalized;
}
