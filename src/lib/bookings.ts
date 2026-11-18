import { and, asc, desc, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  bookings,
  customers,
  payments,
  psTables,
  psUnits,
} from "@/db/schema";
import { ApiError, bookingCode, paymentReference } from "@/lib/api";
import { getPackages } from "@/lib/packages";
import { findPackageByHours } from "@/lib/pricing";
import { buildSlot, nowInAppZone } from "@/lib/time";

export const HOLD_MINUTES = 15;

export type AvailabilityUnit = {
  id: number;
  unitCode: string;
  name: string;
  chairCount: number;
  tableNumber: string | null;
  maintenance: boolean;
  available: boolean;
  inUseNow: boolean;
};

export type BookingDetail = NonNullable<Awaited<ReturnType<typeof getBookingByCode>>>;

/** Release holds whose payment window elapsed. Called before every availability/booking write. */
export async function expireStaleHolds(): Promise<number> {
  const expired = await db
    .update(bookings)
    .set({
      bookingStatus: "expired",
      paymentStatus: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.bookingStatus, "pending"),
        lt(bookings.holdExpiresAt, new Date()),
      ),
    )
    .returning({ id: bookings.id });

  if (expired.length > 0) {
    const ids = expired.map((row) => row.id);
    await db
      .update(payments)
      .set({ status: "expired" })
      .where(and(inArray(payments.bookingId, ids), eq(payments.status, "pending")));
  }
  return expired.length;
}

async function unitsWithBookings(start: Date, end: Date, now: Date) {
  const units = await db
    .select({
      id: psUnits.id,
      unitCode: psUnits.unitCode,
      name: psUnits.name,
      chairCount: psUnits.chairCount,
      status: psUnits.status,
      tableNumber: psTables.tableNumber,
    })
    .from(psUnits)
    .leftJoin(psTables, eq(psUnits.tableId, psTables.id))
    .orderBy(asc(psUnits.unitCode));

  const activeBookings = await db
    .select({
      psUnitId: bookings.psUnitId,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      bookingStatus: bookings.bookingStatus,
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.bookingStatus, ["pending", "confirmed", "in_use"]),
        or(ne(bookings.bookingStatus, "pending"), gt(bookings.holdExpiresAt, now)),
        lt(bookings.startAt, end),
        gt(bookings.endAt, start),
      ),
    );

  const overlapping = new Set(activeBookings.map((row) => row.psUnitId));

  const inUse = await db
    .select({ psUnitId: bookings.psUnitId })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingStatus, "in_use"),
        lt(bookings.startAt, now),
        gt(bookings.endAt, now),
      ),
    );
  const inUseSet = new Set(inUse.map((row) => row.psUnitId));

  return units.map<AvailabilityUnit>((unit) => ({
    id: unit.id,
    unitCode: unit.unitCode,
    name: unit.name,
    chairCount: unit.chairCount,
    tableNumber: unit.tableNumber,
    maintenance: unit.status !== "active",
    available: unit.status === "active" && !overlapping.has(unit.id),
    inUseNow: inUseSet.has(unit.id),
  }));
}

export async function getAvailability(input: {
  date: string;
  time: string;
  durationHours: number;
}) {
  const slot = buildSlot(input.date, input.time, input.durationHours);
  if (!slot.ok) {
    throw new ApiError(400, slot.error, "invalid_slot");
  }
  await expireStaleHolds();
  const units = await unitsWithBookings(slot.start, slot.end, new Date());
  return {
    startAt: slot.start.toISOString(),
    endAt: slot.end.toISOString(),
    units,
  };
}

function assertUnitBookable(unit: { status: string } | undefined, unitId: number) {
  if (!unit) {
    throw new ApiError(404, `Unit PS ${unitId} tidak ditemukan.`, "unit_not_found");
  }
  if (unit.status !== "active") {
    throw new ApiError(409, "Unit sedang dalam perawatan.", "unit_maintenance");
  }
}

async function assertNoConflict(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  unitId: number,
  start: Date,
  end: Date,
  now: Date,
) {
  // Serialize concurrent bookings for the same unit. The overlap query alone
  // is racy under READ COMMITTED without this lock.
  await tx.execute(sql`select pg_advisory_xact_lock(${unitId})`);

  const conflict = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.psUnitId, unitId),
        inArray(bookings.bookingStatus, ["pending", "confirmed", "in_use"]),
        or(ne(bookings.bookingStatus, "pending"), gt(bookings.holdExpiresAt, now)),
        lt(bookings.startAt, end),
        gt(bookings.endAt, start),
      ),
    )
    .limit(1);

  if (conflict.length > 0) {
    throw new ApiError(
      409,
      "Unit ini baru saja dipesan pada jam tersebut. Silakan pilih unit atau jam lain.",
      "slot_taken",
    );
  }
}

async function uniqueBookingCode(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = bookingCode();
    const existing = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.bookingCode, code))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new ApiError(500, "Gagal membuat kode booking.", "code_generation_failed");
}

export type CreateBookingInput = {
  customerName: string;
  whatsapp: string;
  date: string;
  time: string;
  durationHours: number;
  psUnitId: number;
  source: "online" | "walk_in";
  method: "qris" | "cash";
};

export async function createBooking(input: CreateBookingInput) {
  const packages = await getPackages();
  const pkg = findPackageByHours(packages, input.durationHours);
  if (!pkg) {
    throw new ApiError(
      400,
      "Durasi hanya tersedia untuk paket 1, 3, atau 4 jam.",
      "invalid_duration",
    );
  }

  const slot = buildSlot(input.date, input.time, input.durationHours);
  if (!slot.ok) {
    throw new ApiError(400, slot.error, "invalid_slot");
  }

  await expireStaleHolds();
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [unit] = await tx
      .select({ id: psUnits.id, status: psUnits.status })
      .from(psUnits)
      .where(eq(psUnits.id, input.psUnitId))
      .limit(1);

    assertUnitBookable(unit, input.psUnitId);
    await assertNoConflict(tx, input.psUnitId, slot.start, slot.end, now);

    const [customer] = await tx
      .insert(customers)
      .values({ name: input.customerName, whatsapp: input.whatsapp })
      .onConflictDoUpdate({
        target: customers.whatsapp,
        set: { name: input.customerName },
      })
      .returning({ id: customers.id, name: customers.name, whatsapp: customers.whatsapp });

    const code = await uniqueBookingCode(tx);

    const isCash = input.method === "cash";
    const bookingStatus = isCash ? "confirmed" : "pending";
    const paymentStatus = isCash ? "unpaid" : "pending";
    // Cash walk-ins do not hold a payment window; QRIS bookings do.
    const holdExpiresAt = isCash
      ? null
      : new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    const [booking] = await tx
      .insert(bookings)
      .values({
        bookingCode: code,
        customerId: customer.id,
        psUnitId: input.psUnitId,
        startAt: slot.start,
        endAt: slot.end,
        durationHours: pkg.hours,
        packageCode: pkg.code,
        rentalPrice: pkg.price,
        bookingSource: input.source,
        bookingStatus,
        paymentStatus,
        holdExpiresAt,
      })
      .returning();

    const [payment] = await tx
      .insert(payments)
      .values({
        bookingId: booking.id,
        paymentReference: paymentReference(),
        method: input.method,
        amount: pkg.price,
        status: isCash ? "unpaid" : "pending",
      })
      .returning();

    await tx.insert(auditLogs).values({
      actorType: input.source === "online" ? "customer" : "admin",
      actorId: String(customer.id),
      action: "booking.created",
      entity: "booking",
      entityId: String(booking.id),
      meta: {
        bookingCode: booking.bookingCode,
        source: input.source,
        method: input.method,
        price: pkg.price,
      },
    });

    return { booking, payment, customer };
  });

  return result;
}

export async function getBookingByCode(code: string) {
  const [row] = await db
    .select({
      booking: bookings,
      customer: customers,
      unit: psUnits,
      tableNumber: psTables.tableNumber,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
    .leftJoin(psTables, eq(psUnits.tableId, psTables.id))
    .where(eq(bookings.bookingCode, code.toUpperCase()))
    .limit(1);

  if (!row) return null;

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, row.booking.id))
    .orderBy(desc(payments.createdAt));

  return { ...row, payments: paymentRows };
}

export async function getBookingById(id: number) {
  const [row] = await db
    .select({
      booking: bookings,
      customer: customers,
      unit: psUnits,
      tableNumber: psTables.tableNumber,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
    .leftJoin(psTables, eq(psUnits.tableId, psTables.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) return null;
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, id))
    .orderBy(desc(payments.createdAt));
  return { ...row, payments: paymentRows };
}

export async function listBookings(limit = 50) {
  return db
    .select({
      id: bookings.id,
      code: bookings.bookingCode,
      customerName: customers.name,
      whatsapp: customers.whatsapp,
      unitCode: psUnits.unitCode,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      durationHours: bookings.durationHours,
      rentalPrice: bookings.rentalPrice,
      bookingStatus: bookings.bookingStatus,
      paymentStatus: bookings.paymentStatus,
      source: bookings.bookingSource,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}

/**
 * Public lookup: every booking made with one WhatsApp number, newest first.
 * Stale QRIS holds are released first so an expired booking does not look
 * active on the customer page.
 */
export async function listBookingsByWhatsapp(whatsapp: string, limit = 20) {
  await expireStaleHolds();

  return db
    .select({
      id: bookings.id,
      code: bookings.bookingCode,
      customerName: customers.name,
      whatsapp: customers.whatsapp,
      unitCode: psUnits.unitCode,
      tableNumber: psTables.tableNumber,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      durationHours: bookings.durationHours,
      packageCode: bookings.packageCode,
      rentalPrice: bookings.rentalPrice,
      bookingStatus: bookings.bookingStatus,
      paymentStatus: bookings.paymentStatus,
      source: bookings.bookingSource,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(psUnits, eq(bookings.psUnitId, psUnits.id))
    .leftJoin(psTables, eq(psUnits.tableId, psTables.id))
    .where(eq(customers.whatsapp, whatsapp))
    .orderBy(desc(bookings.startAt))
    .limit(limit);
}

export async function listUnitsOverview() {
  const now = new Date();
  const units = await db
    .select({
      id: psUnits.id,
      unitCode: psUnits.unitCode,
      name: psUnits.name,
      chairCount: psUnits.chairCount,
      status: psUnits.status,
      tableNumber: psTables.tableNumber,
    })
    .from(psUnits)
    .leftJoin(psTables, eq(psUnits.tableId, psTables.id))
    .orderBy(asc(psUnits.unitCode));

  const inUse = await db
    .select({ psUnitId: bookings.psUnitId })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingStatus, "in_use"),
        lt(bookings.startAt, now),
        gt(bookings.endAt, now),
      ),
    );
  const inUseSet = new Set(inUse.map((row) => row.psUnitId));

  return units.map((unit) => ({
    ...unit,
    inUseNow: inUseSet.has(unit.id),
  }));
}

export async function dashboardSummary() {
  await expireStaleHolds();
  const now = new Date();
  const dayStart = nowInAppZone().startOf("day").toJSDate();
  const dayEnd = nowInAppZone().plus({ days: 1 }).startOf("day").toJSDate();

  const [units] = await db
    .select({
      total: sql<number>`count(*)::int`,
      maintenance: sql<number>`count(*) filter (where ${psUnits.status} <> 'active')::int`,
    })
    .from(psUnits);

  const [today] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bookings.rentalPrice}) filter (where ${bookings.paymentStatus} = 'paid'), 0)::int`,
      pending: sql<number>`count(*) filter (where ${bookings.paymentStatus} in ('pending','unpaid'))::int`,
    })
    .from(bookings)
    .where(and(gt(bookings.startAt, dayStart), lt(bookings.startAt, dayEnd)));

  const [inUse] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingStatus, "in_use"),
        lt(bookings.startAt, now),
        gt(bookings.endAt, now),
      ),
    );

  return {
    unitsTotal: units?.total ?? 0,
    unitsMaintenance: units?.maintenance ?? 0,
    unitsInUse: inUse?.count ?? 0,
    todayBookings: today?.count ?? 0,
    todayRevenue: today?.revenue ?? 0,
    unpaidCount: today?.pending ?? 0,
  };
}
