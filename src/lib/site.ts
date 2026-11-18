/**
 * Single source for business facts that show up in more than one place:
 * the homepage location card, structured data (JSON-LD), sitemap, robots,
 * and page metadata. Keep the address in sync with the Google Maps listing.
 */

export const SITE_NAME = "EVO Gaming Rental PS4";
export const SITE_TAGLINE = "Rental PS4 Banjarmasin";
export const SITE_DESCRIPTION =
  "Booking rental PlayStation 4 di Banjarmasin. Cek ketersediaan unit, pilih jadwal, dan bayar dengan QRIS.";

/** Public origin, e.g. https://evo-gaming.onrender.com. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const MAPS_URL = "https://maps.app.goo.gl/YezvMzoxgDScEiyg7";
export const MAPS_PLACE =
  "EVO Gaming Rental PS 4 Banjarmasin, Jl. Pramuka, Komplek Rahayu Ruko No.7, Sungai Lulut, Banjarmasin";
export const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(
  MAPS_PLACE,
)}&z=16&output=embed`;

export const ADDRESS = {
  street: "Jl. Pramuka, Komplek Rahayu Ruko No.7",
  district: "Sungai Lulut, Banjarmasin Timur",
  city: "Banjarmasin",
  region: "Kalimantan Selatan",
  postalCode: "70238",
  country: "ID",
} as const;

export const ADDRESS_LINE = `${ADDRESS.street}, ${ADDRESS.district}`;

/** The shop closes at midnight, so schema.org gets 23:59 as the closing time. */
export const OPENING_HOURS = { opens: "10:00", closes: "23:59" } as const;
