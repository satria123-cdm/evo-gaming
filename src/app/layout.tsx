import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BackToHome } from "@/components/back-to-home";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} Banjarmasin`,
    template: `%s • ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "rental PS4 Banjarmasin",
    "sewa PlayStation Banjarmasin",
    "rental PS4 murah",
    "booking PS4 online",
    "rental PS4 Banjarmasin Timur",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} Banjarmasin`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/hero-beranda.jpg",
        width: 2200,
        height: 1237,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} Banjarmasin`,
    description: SITE_DESCRIPTION,
    images: ["/hero-beranda.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#070d17",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line/60 bg-night/80 backdrop-blur">
          <div className="h-0.5 w-full bg-gradient-to-r from-accent via-cyan-300 to-accent-2" />
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5 font-display tracking-tight">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-night shadow-[0_8px_24px_-8px_rgba(34,211,238,0.8)]">
                EVO
              </span>
              <span className="text-base leading-tight">
                EVO Gaming
                <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">
                  Rental PS4 Banjarmasin
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm sm:gap-1.5">
              <Link href="/booking" className="nav-btn">
                Booking
              </Link>
              <Link href="/menu" className="nav-btn">
                Menu
              </Link>
              <Link href="/cek" className="nav-btn">
                Cek
              </Link>
              <Link href="/admin/login" className="nav-btn text-slate-400">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">{children}</main>

        <footer className="border-t border-line/60 px-4 py-8 text-center text-xs text-slate-500">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            EVO Gaming Rental PS4
          </p>
          <p className="mt-2">Banjarmasin • Buka setiap hari 10.00–00.00 WITA</p>
          <p className="mt-1">Harga paket transparan • Pembayaran QRIS • Cek halaman booking</p>
        </footer>

        <BackToHome />
      </body>
    </html>
  );
}
