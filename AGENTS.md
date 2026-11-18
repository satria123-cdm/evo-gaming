<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# EVO Gaming Rental PS4 — Project Guide

Website booking rental PS4 Banjarmasin. Source of truth for requirements:
`EVO-Gaming-Rental-PS4-Planning.md`.

## Stack (installed, no admin rights)

The machine has no Node/PostgreSQL system install and no admin rights, so
portable builds live under `%LOCALAPPDATA%\evo-gaming-tools`:

| Tool | Path |
| --- | --- |
| Node 26.13.1 / npm 11 | `%LOCALAPPDATA%\evo-gaming-tools\node` |
| PostgreSQL 18.1 binaries | `%LOCALAPPDATA%\evo-gaming-tools\pg\bin` |
| PostgreSQL data/logs | `%LOCALAPPDATA%\evo-gaming-tools\pgdata` |

- PostgreSQL listens on **127.0.0.1:5433** (not 5432), database `evo_gaming`.
- PowerShell blocks `.ps1` scripts: call `npm.cmd` / `npx.cmd`, and prefix
  `PATH` with the Node directory in every new shell:
  `$env:PATH="$env:LOCALAPPDATA\evo-gaming-tools\node;$env:PATH"`.
- XAMPP (PHP/MySQL/Apache) exists on this machine but is **not** used here.

## Commands

```powershell
npm run db:start     # start local PostgreSQL (no visible window)
npm run db:status
npm run dev          # ensures DB, then next dev (port 3000)
npm run build
npm run start
npm run check        # eslint + tsc --noEmit
npm run smoke        # e2e vs BASE_URL (default :3100; dev serves :3000)
npm run db:generate  # drizzle-kit generate -> drizzle/*.sql
npm run db:migrate   # apply pending drizzle/*.sql (tracks _evo_migrations)
npm run db:seed      # 8 units + 8 tables, admin, settings, products
npm run db:studio    # drizzle-kit studio (inspect the local DB)
npm run db:stop
```

`drizzle-kit push` is unreliable in this environment (exits 1 with no
output). Use **generate + migrate** instead. Migrations are plain SQL and
are applied by `scripts/migrate.mjs`, which records each file in
`_evo_migrations`. A database created before this runner existed needs
`0000_perfect_captain_britain.sql` marked as applied once.

## Environment

Copy `.env.example` to `.env.local`. Required: `DATABASE_URL`,
`AUTH_SECRET`, `MOCK_GATEWAY_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
Optional: `NEXT_PUBLIC_SITE_URL` (public origin used by metadata,
`sitemap.xml`, `robots.txt`, and JSON-LD; defaults to
`http://localhost:3000`) — set the real domain before deploying.
`PAYMENT_MODE=mock` enables QRIS simulation: the booking page renders a
dummy QR plus a **Simulasi Bayar Berhasil** button and
`POST /api/payments/[reference]/mock` is allowed. Any other value (or
unset) keeps simulation off — the safe default outside local development.

Local admin: `owner@evogaming.local` / `evoOwner123` (this machine's
`.env.local`). `.env.example` ships `ADMIN_PASSWORD=change-me`, so seeding
after copying it gives `change-me` instead. **Change before production**
(`npm run db:seed` re-hashes from `ADMIN_PASSWORD`).

## Business rules baked into code

- 8 units (PS01–PS08), each with a table and 2 chairs.
- Hours 10:00–24:00 **WITA** (`Asia/Makassar`, UTC+8). A booking must end by
  00:00; same-day slots only.
- Package pricing: default 1h Rp10.000 (`PKG1`), 3h Rp25.000 (`PKG3`),
  4h Rp35.000 (`PKG4`). Admin can add/remove durations (1–14 hours) and
  edit prices at `/admin/pricing`; the set is stored in `business_settings`
  (key `packages`) with `DEFAULT_PACKAGES` as fallback. `rental_price` is
  snapshotted on the booking.
- No customer accounts. Public lookup by WhatsApp number only:
  `GET /api/bookings/lookup?wa=…` lists every booking for that number and
  `GET /api/orders/lookup?wa=…` lists every F&B order. The old
  code+WhatsApp lookup (`GET /api/bookings/[code]?wa=…`) still exists for the
  status page. Known gap: anyone who knows a number (or a booking code) can
  see that customer's name/phone — tighten before production.
- Online bookings are **QRIS only**; cash is admin walk-in
  (`confirmed` + `unpaid`, no payment hold).
- Double-booking protection lives server-side:
  `pg_advisory_xact_lock(ps_unit_id)` + overlap query inside the booking
  transaction, plus exclusion constraint
  `bookings_no_overlap_confirmed` for `confirmed`/`in_use` rows.
- QRIS bookings hold the slot for 15 minutes (`hold_expires_at`); stale
  holds are expired lazily on availability/booking calls.
- F&B orders pay with QRIS too (`payments.food_order_id`). Unpaid orders
  hold stock for 15 minutes, then are cancelled with stock restored. Admin
  can still mark a cash payment as paid.
- F&B orders require a name, WhatsApp number (stored normalized in
  `food_orders.customer_whatsapp`) and table number; a booking code is
  optional linking sugar. `customerWhatsapp` powers
  `GET /api/orders/lookup`.
- Payment callbacks are idempotent via unique `payment_events.event_id`,
  HMAC-signed over the raw body (`x-mock-signature`), amount-checked.
- Customers see a ticking WITA clock on `/booking` and `/menu`; the
  "Dibuat" timestamps on status pages include seconds.
- The homepage hero uses `public/hero-beranda.jpg` with a bright-to-faded
  gradient overlay. A compact **Lokasi** map card (about half the height of
  the EVO Arena box) sits at the top of the hero's right column, right above
  the EVO Arena box, and links out to
  `https://maps.app.goo.gl/YezvMzoxgDScEiyg7` (address: Jl. Pramuka,
  Komplek Rahayu Ruko No.7, Banjarmasin Timur). The saved-code chips feature
  was removed; status-page headings keep their shimmer.
- The **EVO Arena** box is a single frame holding the mini game, the PS4
  controller directly below it, and the rental package prices underneath.
  The controller (`src/components/gamepad-art.tsx`) is a plain **black**
  DualShock-style SVG with no shoulder buttons/triggers (`L1`, `L2`, `R1`,
  `R2`); it is intentionally the earlier, simpler version, not the
  "realistic" pass. The mini game, **EVO Catch**, is rendered first inside
  that same frame (`src/components/stick-arena.tsx`, a plain `<div>` wrapper
  with no card styling). The left analog stick slides the paddle (arrow keys
  work too), ✕ or the PS button starts/restarts, a round lasts 40 s with
  3 lives, and the best score lives in `localStorage` through
  `src/lib/arcade-best.ts`. Controller input reaches the game via the
  `src/lib/pad-input.ts` pub/sub bridge, so the controller art stays
  self-contained and reusable.
- SEO/branding: root metadata sets Open Graph/Twitter cards, `metadataBase`
  comes from `NEXT_PUBLIC_SITE_URL`, `/sitemap.xml` and `/robots.txt` are
  generated from `src/lib/site.ts`, the homepage embeds `LocalBusiness`
  JSON-LD, and `src/app/not-found.tsx` is a branded 404.
- `/admin/reports` renders as a book: closed cover, two-page spreads with
  page turns, and a close button (`src/components/report-book.tsx`).

## Architecture notes

- Drizzle ORM + `pg` (not Prisma) for explicit locking/constraints.
- `src/lib/bookings.ts` — availability, create booking, summaries.
- `src/lib/pricing.ts` — `DEFAULT_PACKAGES`, `PackagePlan`, helpers.
- `src/lib/packages.ts` — reads/writes editable package prices in
  `business_settings`.
- `src/lib/payments.ts` — `handlePaymentEvent` (booking + F&B settlement)
  and the dummy QRIS payload used in mock mode.
- `src/lib/orders.ts` — F&B menu/orders, QRIS payment row per order, stock
  reserved under `SELECT … FOR UPDATE` at creation and restored on
  cancel/timeout.
- `src/lib/order-status.ts` — shared status flow/labels for client + server.
- `src/lib/reports.ts` — rental vs F&B sales report with WITA day ranges,
  plus `liveReport` (totals, revenue sources, newest paid feed),
  `rentalHistory`, and `foodOrderHistory`. `GET /api/admin/reports/live`
  feeds the polling panel; `/admin/reports` renders both history lists
  (max 300 rows each) inside the report book.
- `src/components/report-book.tsx` — the openable/closable report book
  (cover, spreads, page turns, 10-second live poll) with
  `src/lib/use-live-report.ts` holding the polling hook.
- `src/components/live-clock.tsx` — client WITA clock used on `/booking`
  and `/menu`. `src/components/check-booking-form.tsx` and
  `src/components/order-lookup-form.tsx` are the WhatsApp-only lookups.
- `src/db/schema.ts` — 12 tables; `src/db/seed.ts` — seed + exclusion
  constraint.
- `src/components/gamepad-art.tsx` — simple black DualShock-style SVG
  (no L1/L2/R1/R2 shoulder buttons) that publishes stick/button input to
  `src/lib/pad-input.ts`; fonts live in `public/fonts/`, menu photos in
  `public/menu/`.
- `src/components/stick-arena.tsx` — the EVO Catch mini game (request
  animation frame loop, stick + arrow-key control), with its high score
  store in `src/lib/arcade-best.ts`.
- `src/lib/site.ts` — business name, address, Maps links, opening hours, and
  the `NEXT_PUBLIC_SITE_URL` origin shared by metadata, sitemap, robots, and
  JSON-LD.
- Admin auth: bcryptjs + JWT (jose) in httpOnly cookie
  `evo_admin_session`; pages under `/admin/(protected)` and admin APIs use
  `requireAdmin()`.
- All DB pages export `dynamic = "force-dynamic"`.
- `next.config.ts` only wires Tailwind v4 through `turbopack.rules`
  (`@tailwindcss/turbopack`); no cacheComponents/prefetch flags are set.
- Next.js 16 specifics: `cookies()` is async; `next lint` was removed (use
  ESLint CLI); route params/searchParams are Promises. `middleware` is
  renamed `proxy` in Next 16, but this repo uses neither — `/admin` is gated
  by `admin/(protected)/layout.tsx` plus `requireAdmin()`.
- `Date.now()`/`new Date()` directly in rendered components trips
  `react-hooks/purity`. Use helpers in `src/lib/time.ts` (e.g.
  `hasTimeRemaining`).

## Scope status

Milestone 1 (walking skeleton) and Milestone 2 (F&B + reports) are
implemented and verified end-to-end:

- Milestone 1: home + unit status, availability API, booking form, QRIS
  mock payment, booking status page, public lookup, admin
  login/dashboard/bookings/walk-in.
- Milestone 2: public menu + cart + order status polling (`/menu`,
  `/order/[code]`), QRIS mock payment per F&B order, admin order queue with
  the full status flow, product & stock management (`/admin/menu`), and
  sales reports split rental vs F&B (`/admin/reports`). Stock is reserved
  at order creation under row locks and restored on cancel/timeout.
- Admin extras: full menu CRUD with photo URLs (`/admin/menu`) and editable
  package set/prices (`/admin/pricing`, `PUT /api/admin/packages`).
- UI pass: Chakra Petch + Plus Jakarta Sans self-hosted fonts, interactive
  white PS4 controller SVG (draggable sticks + pressable buttons), 3D
  raised/sunken buttons, and product photos from `public/menu/`.
- Every page gets a small floating **Beranda** button bottom-left
  (`src/components/back-to-home.tsx`, rendered by the root layout) that
  fades in after the page settles; it only hides on `/` itself.

Not yet built: real payment gateway, WhatsApp notifications, production
deploy config.
