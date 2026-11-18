import { z } from "zod";

/** Normalize Indonesian WhatsApp numbers to digits with a 62 country prefix. */
export function normalizeWhatsapp(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("0")) normalized = `62${normalized.slice(1)}`;
  if (!normalized.startsWith("62")) normalized = `62${normalized}`;
  if (normalized.length < 10 || normalized.length > 15) return null;
  return normalized;
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

/** Shared WhatsApp field: stored as digits with a 62 country prefix. */
const whatsappSchema = z
  .string()
  .trim()
  .min(8, "Nomor WhatsApp tidak valid.")
  .max(20, "Nomor WhatsApp tidak valid.")
  .transform((value, ctx) => {
    const normalized = normalizeWhatsapp(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Nomor WhatsApp tidak valid." });
      return z.NEVER;
    }
    return normalized;
  });

export const createBookingSchema = z.object({
  customerName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  whatsapp: whatsappSchema,
  date: z.string().regex(dateRegex, "Format tanggal tidak valid."),
  time: z.string().regex(timeRegex, "Format jam tidak valid."),
  durationHours: z.coerce.number().int(),
  psUnitId: z.coerce.number().int().positive(),
  method: z.enum(["qris", "cash"]).default("qris"),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(dateRegex, "Format tanggal tidak valid."),
  time: z.string().regex(timeRegex, "Format jam tidak valid."),
  duration: z.coerce.number().int(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().min(3).max(200),
  password: z.string().min(6).max(200),
});

export const walkInBookingSchema = createBookingSchema.extend({
  psUnitId: z.coerce.number().int().positive(),
  method: z.enum(["cash", "qris"]).default("cash"),
});

export const updateBookingSchema = z.object({
  bookingStatus: z
    .enum(["pending", "confirmed", "in_use", "completed", "cancelled", "expired"])
    .optional(),
  paymentStatus: z
    .enum(["unpaid", "pending", "paid", "failed", "expired", "refunded"])
    .optional(),
});

export const webhookSchema = z.object({
  eventId: z.string().min(8),
  paymentReference: z.string().min(4),
  status: z.enum(["paid", "failed", "expired"]),
  amount: z.coerce.number().int().nonnegative(),
  gatewayTransactionId: z.string().min(4).optional(),
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  whatsapp: whatsappSchema,
  tableId: z.coerce.number().int().positive().optional(),
  bookingCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined)),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1, "Jumlah minimal 1.").max(20),
      }),
    )
    .min(1, "Pilih minimal satu menu.")
    .max(20),
});

export const updateOrderSchema = z.object({
  status: z
    .enum([
      "new",
      "confirmed",
      "processing",
      "ready",
      "delivering",
      "completed",
      "cancelled",
    ])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid"]).optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter.").max(100),
  category: z.enum(["food", "drink"]),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif."),
  stockQuantity: z.coerce.number().int().min(0, "Stok tidak boleh negatif."),
  isAvailable: z.boolean().default(true),
});

export const productPatchSchema = productSchema.partial();

export const packagePricesSchema = z
  .object({
    packages: z
      .array(
        z.object({
          hours: z.coerce
            .number()
            .int("Durasi harus bilangan bulat.")
            .min(1, "Durasi minimal 1 jam.")
            .max(14, "Durasi maksimal 14 jam (tutup pukul 00.00)."),
          price: z.coerce
            .number()
            .int("Harga harus bilangan bulat.")
            .min(0, "Harga tidak boleh negatif.")
            .max(100_000_000, "Harga terlalu besar."),
        }),
      )
      .min(1, "Minimal satu paket harga.")
      .max(14, "Maksimal 14 paket."),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    value.packages.forEach((pkg, index) => {
      if (seen.has(pkg.hours)) {
        ctx.addIssue({
          code: "custom",
          message: "Durasi paket tidak boleh dobel.",
          path: ["packages", index, "hours"],
        });
      }
      seen.add(pkg.hours);
    });
  });
