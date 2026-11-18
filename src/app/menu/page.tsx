import Link from "next/link";
import { LiveClock } from "@/components/live-clock";
import { MenuOrder } from "@/components/menu-order";
import { listProducts, listTables } from "@/lib/orders";
import { formatRupiah } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Menu & Pesanan | EVO Gaming",
  description:
    "Pesan makanan dan minuman saat bermain PS4 di EVO Gaming Banjarmasin. Pesanan diantar ke meja Anda.",
};

export default async function MenuPage() {
  const [products, tables] = await Promise.all([listProducts(), listTables()]);

  // Curated hero: the three noodle dishes, using the live product row when it
  // exists so the label and price always match the menu below.
  const heroPhotos = [
    { name: "Mie Goreng", fallback: "/menu/mie-goreng.jpg" },
    { name: "Mie Soto", fallback: "/menu/mie-soto.jpg" },
    { name: "Mie Goreng + Telur", fallback: "/menu/mie-goreng-telur.jpg" },
  ].map((entry) => {
    const product = products.find((item) => item.name === entry.name);
    return {
      key: entry.fallback,
      name: product?.name ?? entry.name,
      imageUrl: product?.imageUrl || entry.fallback,
      price: product?.price ?? null,
      description: product?.description ?? null,
    };
  });

  return (
    <div className="space-y-7">
      <header className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="space-y-3 p-6">
            <span className="chip border-accent/30 bg-accent/10 text-accent">
              Pesanan langsung ke meja
            </span>
            <h1 className="display-title text-3xl sm:text-4xl">
              Menu Makanan &amp; Minuman
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              Pilih menu, isi nama, nomor WhatsApp, dan nomor meja Anda. Pesanan
              diantar ke meja dan dibayar dengan QRIS — sama seperti booking unit
              PS.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <span className="rounded-full border border-line bg-night/60 px-3 py-1.5">
                QRIS otomatis
              </span>
              <span className="rounded-full border border-line bg-night/60 px-3 py-1.5">
                Stok real-time
              </span>
              <span className="rounded-full border border-line bg-night/60 px-3 py-1.5">
                Diantar ke meja
              </span>
            </div>
            <div className="pt-1">
              <LiveClock label="Waktu pesan" />
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-2 gap-2 p-4 md:p-5">
            {heroPhotos.map((photo, index) => (
              <figure
                key={photo.key}
                className={`group relative overflow-hidden rounded-2xl border border-line/70 bg-night/60 ${
                  index === 0 ? "row-span-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.name}
                  className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
                    index === 0 ? "min-h-56 sm:min-h-64" : "min-h-24 sm:min-h-28"
                  }`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/25 to-transparent" />
                {photo.price !== null && (
                  <span className="absolute right-2 top-2 rounded-full bg-night/80 px-2 py-0.5 font-display text-[10px] font-bold text-accent backdrop-blur sm:text-xs">
                    {formatRupiah(photo.price)}
                  </span>
                )}
                <figcaption className="absolute inset-x-0 bottom-0 p-2.5">
                  <p
                    className={`font-display font-bold leading-tight text-white ${
                      index === 0 ? "text-sm sm:text-base" : "text-[11px]"
                    }`}
                  >
                    {photo.name}
                  </p>
                  {index === 0 && photo.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-300">
                      {photo.description}
                    </p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </header>

      <MenuOrder products={products} tables={tables} />

      <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-lg font-bold">Mau cek pesanan?</h2>
          <p className="text-sm text-slate-400">
            Cukup masukkan nomor WhatsApp yang Anda pakai saat memesan untuk melihat
            progres pesanan secara real-time.
          </p>
        </div>
        <Link href="/order" className="btn-ghost">
          Cek status pesanan
        </Link>
      </section>
    </div>
  );
}
