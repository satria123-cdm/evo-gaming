import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Naming follows EVO-Gaming-Rental-PS4-Planning.md §11.
 * Money is stored as integer rupiah (no cents) to avoid float rounding.
 */

export const admins = pgTable(
  "admins",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("admins_email_unique").on(table.email)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("customers_whatsapp_unique").on(table.whatsapp)],
);

export const psTables = pgTable(
  "tables",
  {
    id: serial("id").primaryKey(),
    tableNumber: text("table_number").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("tables_number_unique").on(table.tableNumber)],
);

export const psUnits = pgTable(
  "ps_units",
  {
    id: serial("id").primaryKey(),
    unitCode: text("unit_code").notNull(),
    name: text("name").notNull(),
    chairCount: integer("chair_count").notNull().default(2),
    tableId: integer("table_id").references(() => psTables.id),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ps_units_code_unique").on(table.unitCode)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    bookingCode: text("booking_code").notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    psUnitId: integer("ps_unit_id")
      .notNull()
      .references(() => psUnits.id),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    durationHours: integer("duration_hours").notNull(),
    packageCode: text("package_code").notNull(),
    rentalPrice: integer("rental_price").notNull(),
    bookingSource: text("booking_source").notNull().default("online"),
    bookingStatus: text("booking_status").notNull().default("pending"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bookings_code_unique").on(table.bookingCode),
    index("bookings_unit_window_idx").on(table.psUnitId, table.startAt, table.endAt),
    index("bookings_status_idx").on(table.bookingStatus),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id").references(() => bookings.id),
    // F&B orders pay through the same QRIS pipeline as bookings.
    foodOrderId: integer("food_order_id").references(() => foodOrders.id),
    paymentReference: text("payment_reference").notNull(),
    gatewayTransactionId: text("gateway_transaction_id"),
    method: text("method").notNull(),
    amount: integer("amount").notNull(),
    status: text("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payments_reference_unique").on(table.paymentReference),
    uniqueIndex("payments_gateway_tx_unique").on(table.gatewayTransactionId),
  ],
);

/** Processed webhook events — the unique event id is the idempotency key. */
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: serial("id").primaryKey(),
    eventId: text("event_id").notNull(),
    paymentReference: text("payment_reference").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("payment_events_event_unique").on(table.eventId)],
);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const foodOrders = pgTable(
  "food_orders",
  {
    id: serial("id").primaryKey(),
    orderCode: text("order_code").notNull(),
    bookingId: integer("booking_id").references(() => bookings.id),
    tableId: integer("table_id").references(() => psTables.id),
    customerName: text("customer_name").notNull(),
    customerWhatsapp: text("customer_whatsapp").notNull().default(""),
    status: text("status").notNull().default("new"),
    subtotal: integer("subtotal").notNull().default(0),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("food_orders_code_unique").on(table.orderCode),
    index("food_orders_status_idx").on(table.status, table.createdAt),
    index("food_orders_created_idx").on(table.createdAt),
    index("food_orders_whatsapp_idx").on(table.customerWhatsapp),
  ],
);

export const foodOrderItems = pgTable(
  "food_order_items",
  {
    id: serial("id").primaryKey(),
    foodOrderId: integer("food_order_id")
      .notNull()
      .references(() => foodOrders.id),
    productId: integer("product_id").references(() => products.id),
    productName: text("product_name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [index("food_order_items_order_idx").on(table.foodOrderId)],
);

export const businessSettings = pgTable(
  "business_settings",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("business_settings_key_unique").on(table.key)],
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PsUnit = typeof psUnits.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
