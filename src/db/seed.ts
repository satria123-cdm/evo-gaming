import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./index";
import {
  admins,
  businessSettings,
  products,
  psTables,
  psUnits,
} from "./schema";

const TABLES = Array.from({ length: 8 }, (_, i) => String(i + 1).padStart(2, "0"));

async function seedTablesAndUnits() {
  for (const [index, number] of TABLES.entries()) {
    const [table] = await db
      .insert(psTables)
      .values({ tableNumber: number })
      .onConflictDoNothing({ target: psTables.tableNumber })
      .returning();

    const tableId =
      table?.id ??
      (
        await db
          .select({ id: psTables.id })
          .from(psTables)
          .where(eq(psTables.tableNumber, number))
          .limit(1)
      )[0]?.id;

    await db
      .insert(psUnits)
      .values({
        unitCode: `PS${String(index + 1).padStart(2, "0")}`,
        name: `PlayStation ${index + 1}`,
        chairCount: 2,
        tableId,
        status: "active",
      })
      .onConflictDoNothing({ target: psUnits.unitCode });
  }
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "owner@evogaming.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "evoOwner123";
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(admins)
    .values({ name: "Pemilik EVO Gaming", email, passwordHash, role: "owner" })
    .onConflictDoUpdate({
      target: admins.email,
      set: { passwordHash, name: "Pemilik EVO Gaming", role: "owner" },
    });

  return { email, password };
}

async function seedSettings() {
  const settings = [
    { key: "timezone", value: "Asia/Makassar" },
    { key: "open_hour", value: 10 },
    { key: "close_hour", value: 24 },
    {
      key: "packages",
      value: [
        { code: "PKG1", hours: 1, price: 10000 },
        { code: "PKG3", hours: 3, price: 25000 },
        { code: "PKG4", hours: 4, price: 35000 },
      ],
    },
    { key: "cash_online_enabled", value: false },
    { key: "hold_minutes", value: 15 },
    { key: "unit_count", value: 8 },
  ];

  for (const setting of settings) {
    await db
      .insert(businessSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: businessSettings.key,
        set: { value: setting.value, updatedAt: new Date() },
      });
  }
}

type SeedProduct = {
  name: string;
  category: "food" | "drink";
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Air Mineral",
    category: "drink",
    description: "Air mineral dingin, pas untuk menemani sesi panjang.",
    price: 5000,
    stockQuantity: 24,
    imageUrl: "/menu/air-mineral.jpg",
  },
  { name: "Kopi Botolan", category: "drink", price: 8000, stockQuantity: 12 },
  {
    name: "Coca-Cola",
    category: "drink",
    description: "Coca-Cola dingin dalam botol.",
    price: 7000,
    stockQuantity: 24,
    imageUrl: "/menu/coca-cola.jpg",
  },
  {
    name: "Kopi Golda Aren Late",
    category: "drink",
    description: "Kopi susu Golda dengan gula aren.",
    price: 5000,
    stockQuantity: 12,
    imageUrl: "/menu/kopi-golda-aren.jpg",
  },
  {
    name: "Teh Pucuk",
    category: "drink",
    description: "Teh Pucuk Harum dingin.",
    price: 5000,
    stockQuantity: 24,
    imageUrl: "/menu/teh-pucuk.jpg",
  },
  {
    name: "Mie Goreng",
    category: "food",
    description: "Mie goreng kampung dengan bumbu spesial EVO.",
    price: 12000,
    stockQuantity: 20,
    imageUrl: "/menu/mie-goreng.jpg",
  },
  {
    name: "Mie Goreng + Telur",
    category: "food",
    description: "Mie goreng kampung plus telur ceplok.",
    price: 15000,
    stockQuantity: 15,
    imageUrl: "/menu/mie-goreng-telur.jpg",
  },
  {
    name: "Mie Soto",
    category: "food",
    description: "Mie soto Banjar kuah gurih, disajikan hangat.",
    price: 12000,
    stockQuantity: 20,
    imageUrl: "/menu/mie-soto.jpg",
  },
  {
    name: "Mie Soto + Telur",
    category: "food",
    description: "Mie soto Banjar dengan tambahan telur.",
    price: 15000,
    stockQuantity: 15,
    imageUrl: "/menu/mie-soto-telur.jpg",
  },
  { name: "Camilan", category: "food", price: 10000, stockQuantity: 20 },
];

/** Old product names from earlier seeds, renamed in place to keep stock. */
const LEGACY_PRODUCT_NAMES: { from: string; to: string }[] = [
  { from: "Mi Instan", to: "Mie Goreng" },
  { from: "Mi Instan + Telur", to: "Mie Goreng + Telur" },
];

async function seedProducts() {
  for (const rename of LEGACY_PRODUCT_NAMES) {
    const [alreadyRenamed] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.name, rename.to))
      .limit(1);
    if (alreadyRenamed) continue;

    const item = PRODUCTS.find((product) => product.name === rename.to);
    if (!item) continue;
    // Rename in place; stock stays whatever the outlet currently has.
    const fields = {
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
    };
    await db
      .update(products)
      .set(fields)
      .where(eq(products.name, rename.from));
  }

  for (const item of PRODUCTS) {
    const [existing] = await db
      .select({ id: products.id, imageUrl: products.imageUrl })
      .from(products)
      .where(eq(products.name, item.name))
      .limit(1);

    if (!existing) {
      await db.insert(products).values(item);
      continue;
    }

    // Backfill artwork for products created before the menu photos existed.
    if (item.imageUrl && !existing.imageUrl) {
      await db
        .update(products)
        .set({ imageUrl: item.imageUrl, description: item.description })
        .where(eq(products.id, existing.id));
    }
  }
}

async function addOverlapConstraint() {
  // Backstop against double booking for confirmed/in-use rows.
  // Pending QRIS holds are serialized with pg_advisory_xact_lock instead,
  // because an exclusion constraint cannot reference now()/hold_expires_at.
  await db.execute(sql`create extension if not exists btree_gist`);
  await db.execute(sql`
    do $$
    begin
      alter table bookings
        add constraint bookings_no_overlap_confirmed
        exclude using gist (
          ps_unit_id with =,
          tstzrange(start_at, end_at) with &&
        ) where (booking_status in ('confirmed', 'in_use'));
    exception
      when duplicate_object or duplicate_table then null;
    end $$;
  `);
}

async function main() {
  console.log("Seeding EVO Gaming…");
  await seedTablesAndUnits();
  const admin = await seedAdmin();
  await seedSettings();
  await seedProducts();
  await addOverlapConstraint();

  console.log("Seed selesai.");
  console.log(`Admin: ${admin.email} / ${admin.password}`);
  console.log("Ganti password default sebelum dipakai di produksi.");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
