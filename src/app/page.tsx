import Link from "next/link";
import { GamepadArt } from "@/components/gamepad-art";
import { StickArena } from "@/components/stick-arena";
import { getPackages } from "@/lib/packages";
import { formatRupiah } from "@/lib/pricing";
import { listUnitsOverview } from "@/lib/bookings";
import type { Metadata } from "next";
import {
  ADDRESS,
  MAPS_EMBED_URL,
  MAPS_URL,
  OPENING_HOURS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const MENU_PHOTOS = [
  { src: "/menu/mie-goreng.jpg", label: "Mie Goreng" },
  { src: "/menu/mie-soto.jpg", label: "Mie Soto" },
  { src: "/menu/mie-goreng-telur.jpg", label: "Mie Goreng + Telur" },
];

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/hero-beranda.jpg`,
  logo: `${SITE_URL}/favicon.ico`,
  priceRange: "Rp10.000 – Rp35.000",
  currenciesAccepted: "IDR",
  paymentAccepted: "QRIS, Tunai",
  hasMap: MAPS_URL,
  sameAs: [MAPS_URL],
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street,
    addressLocality: ADDRESS.city,
    addressRegion: ADDRESS.region,
    postalCode: ADDRESS.postalCode,
    addressCountry: ADDRESS.country,
  },
  areaServed: {
    "@type": "City",
    name: "Banjarmasin",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: OPENING_HOURS.opens,
      closes: OPENING_HOURS.closes,
    },
  ],
};

export default async function HomePage() {
  const [units, packages] = await Promise.all([listUnitsOverview(), getPackages()]);
  const inUse = units.filter((unit) => unit.inUseNow).length;
  const maintenance = units.filter((unit) => unit.status !== "active").length;
  const ready = units.length - inUse - maintenance;

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
        }}
      />
      <section className="relative overflow-hidden rounded-3xl border border-line/50">
        <div aria-hidden className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-beranda.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/75 to-night/15" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_10%,rgba(34,211,238,0.22),transparent_60%)]" />
        </div>
        <div className="relative z-10 grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
          <div className="space-y-6">
          <span className="chip border-accent/30 bg-accent/10 text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            8 unit PS4 • 2 kursi + 1 meja per unit
          </span>
          <h1 className="display-title text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Main PS4
            <span className="block bg-gradient-to-r from-accent via-cyan-200 to-accent-2 bg-clip-text text-transparent">
              tanpa antre.
            </span>
            <span className="mt-2 block text-2xl font-semibold normal-case tracking-normal text-slate-200 sm:text-3xl">
              Booking dari HP, bayar QRIS.
            </span>
          </h1>
          <p className="max-w-xl text-slate-300">
            Cek unit yang kosong, pilih jadwal, dan konfirmasi otomatis setelah
            pembayaran. Buka setiap hari pukul 10.00–00.00 WITA di Banjarmasin.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/booking" className="btn-primary">
              Booking Sekarang
            </Link>
            <Link href="/menu" className="btn-secondary">
              Lihat Menu F&amp;B
            </Link>
            <Link href="/cek" className="btn-ghost">
              Cek Status
            </Link>
          </div>
          <dl className="grid max-w-lg grid-cols-3 gap-3 pt-2">
            <div className="card-soft px-4 py-3">
              <dt className="text-xs uppercase tracking-wider text-slate-400">Siap dipakai</dt>
              <dd className="font-display text-2xl font-bold text-emerald-300">{ready}</dd>
            </div>
            <div className="card-soft px-4 py-3">
              <dt className="text-xs uppercase tracking-wider text-slate-400">Sedang main</dt>
              <dd className="font-display text-2xl font-bold text-violet-300">{inUse}</dd>
            </div>
            <div className="card-soft px-4 py-3">
              <dt className="text-xs uppercase tracking-wider text-slate-400">Perawatan</dt>
              <dd className="font-display text-2xl font-bold text-slate-300">{maintenance}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="relative h-52 overflow-hidden rounded-2xl border border-line/70 sm:h-64">
            <iframe
              src={MAPS_EMBED_URL}
              title="Peta lokasi EVO Gaming Rental PS4 Banjarmasin"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Buka lokasi EVO Gaming Rental PS4 di Google Maps"
              className="group absolute inset-0 flex items-end justify-between gap-3 bg-gradient-to-t from-night via-night/70 to-night/15 p-3.5 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Lokasi
                </span>
                <span className="mt-0.5 block truncate font-display text-sm font-bold text-white">
                  Ruko Rahayu No.7
                </span>
                <span className="block truncate text-[11px] text-slate-300">
                  Jl. Pramuka, Sungai Lulut, Banjarmasin Timur
                </span>
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/40 bg-night/80 text-accent backdrop-blur transition group-hover:border-accent group-hover:bg-accent group-hover:text-night">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 4h6v6" />
                  <path d="M20 4 11 13" />
                  <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                </svg>
              </span>
            </a>
          </div>

          <div className="relative">
          <div className="pointer-events-none absolute inset-x-6 top-6 h-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="card glow-ring relative overflow-hidden p-5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>EVO Arena</span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <StickArena />
            <div className="mt-3 border-t border-line/60 pt-3">
              <GamepadArt className="mx-auto w-full max-w-sm drop-shadow-[0_16px_28px_rgba(2,6,23,0.85)]" />
              <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Geser stik kiri • tekan ✕ atau PS untuk mulai
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-line/70 bg-night/55 p-3">
              <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="text-slate-400">Harga paket / unit</span>
                <span className="text-accent">10.00–00.00 WITA</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.code}
                    className="min-w-[68px] flex-1 rounded-lg border border-line/60 bg-night/60 px-1.5 py-1.5 text-center"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {pkg.hours} jam
                    </p>
                    <p className="mt-0.5 font-display text-base font-bold text-white">
                      {formatRupiah(pkg.price)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 border-t border-line/50 pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                QRIS • Slot ditahan 15 menit
              </p>
            </div>
          </div>
        </div>
        </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="display-title text-2xl">Status unit saat ini</h2>
            <p className="text-sm text-slate-400">
              Status real-time dari dashboard admin. Pilih jadwal untuk melihat
              ketersediaan pada jam tertentu.
            </p>
          </div>
          <Link href="/booking" className="hidden text-sm font-semibold text-accent sm:block">
            Pilih jadwal →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {units.map((unit) => {
            const maintenanceUnit = unit.status !== "active";
            const label = maintenanceUnit
              ? "Perawatan"
              : unit.inUseNow
                ? "Sedang digunakan"
                : "Tersedia";
            const tone = maintenanceUnit
              ? "border-slate-500/40 bg-slate-500/10 text-slate-300"
              : unit.inUseNow
                ? "border-violet-400/40 bg-violet-400/10 text-violet-200"
                : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";

            return (
              <article
                key={unit.id}
                className="card group relative overflow-hidden p-4 transition hover:border-accent/40"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-0.5 ${
                    maintenanceUnit
                      ? "bg-slate-500/40"
                      : unit.inUseNow
                        ? "bg-violet-400/60"
                        : "bg-emerald-400/60"
                  }`}
                />
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{unit.unitCode}</h3>
                  <span className={`chip ${tone}`}>{label}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{unit.chairCount} kursi</p>
                <p className="text-sm text-slate-400">Meja {unit.tableNumber ?? "-"}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4 p-6">
            <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
              Menu andalan
            </span>
            <h2 className="display-title text-2xl sm:text-3xl">
              Lapar di tengah match?
            </h2>
            <p className="text-sm text-slate-300 sm:text-base">
              Mie goreng dan mie soto hangat diantar langsung ke meja. Pesan dari HP,
              bayar QRIS seperti booking unit PS.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/menu" className="btn-primary">
                Pesan Makanan
              </Link>
              <Link href="/order" className="btn-ghost">
                Cek Pesanan
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4 lg:p-6">
            {MENU_PHOTOS.map((photo, index) => (
              <div
                key={photo.src}
                className={`relative overflow-hidden rounded-xl border border-line/70 ${
                  index === 1 ? "translate-y-3" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.label}
                  className="h-32 w-full object-cover sm:h-40 lg:h-48"
                  loading="lazy"
                />
                <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night to-transparent px-2 py-1 text-[10px] font-semibold text-white">
                  {photo.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            step: "01",
            title: "Pilih jadwal",
            body: "Tentukan tanggal, jam mulai, dan paket durasi. Unit yang bentrok otomatis dinonaktifkan.",
          },
          {
            step: "02",
            title: "Isi data",
            body: "Tanpa akun. Cukup nama dan nomor WhatsApp untuk konfirmasi dan cek status.",
          },
          {
            step: "03",
            title: "Bayar QRIS",
            body: "Slot ditahan 15 menit. Booking terkonfirmasi otomatis setelah pembayaran diterima.",
          },
        ].map((item) => (
          <article key={item.step} className="card p-5">
            <p className="font-display text-3xl font-bold text-accent/40">{item.step}</p>
            <h3 className="mt-2 font-display text-lg font-bold text-accent">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
