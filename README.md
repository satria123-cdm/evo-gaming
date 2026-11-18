# EVO Gaming Rental PS4 Banjarmasin

Website booking rental PS4: cek ketersediaan unit, booking tanpa akun, bayar
QRIS, dan dashboard admin. Kebutuhan lengkap ada di
[`EVO-Gaming-Rental-PS4-Planning.md`](./EVO-Gaming-Rental-PS4-Planning.md).

## Status

Milestone 1 (walking skeleton) dan Milestone 2 (menu/pesanan F&B + laporan
dasar) selesai dan teruji end-to-end dengan mode simulasi QRIS
(`PAYMENT_MODE=mock`). Belum termasuk: gateway QRIS nyata, notifikasi
WhatsApp, dan konfigurasi deploy produksi.

Untuk menaruh demo ini online dengan QRIS simulasi tetap aktif, ikuti
[`DEPLOY.md`](./DEPLOY.md) (gratis: Render + Neon; atau Railway / VPS + Docker).

## Menjalankan

Prasyarat di mesin ini: Node dan PostgreSQL portabel di
`%LOCALAPPDATA%\evo-gaming-tools` (lihat `AGENTS.md`).

```powershell
copy .env.example .env.local   # lalu isi secret
npm run db:start
npm run db:migrate
npm run db:seed
npm run dev                    # http://localhost:3000
```

Admin lokal: `owner@evogaming.local` / `evoOwner123` — ganti sebelum
produksi.

Untuk produksi, isi `NEXT_PUBLIC_SITE_URL` dengan URL asli, misalnya
`https://evo-gaming.onrender.com` (Render) atau domain sendiri. Nilainya
dipakai metadata Open Graph, `sitemap.xml`, `robots.txt`, dan JSON-LD
LocalBusiness di beranda.

## Perintah penting

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | pastikan DB hidup, lalu jalankan dev server |
| `npm run build` / `start` | build dan jalankan produksi |
| `npm run check` | ESLint + TypeScript |
| `npm run smoke` | uji end-to-end (server harus berjalan) |
| `npm run db:start` / `db:stop` / `db:status` | kelola PostgreSQL lokal (start tanpa jendela terlihat) |
| `npm run db:generate` / `db:migrate` | buat & terapkan migrasi |
| `npm run db:seed` | seed 8 unit, meja, admin, setting, produk |

`npm run smoke` default menguji `http://127.0.0.1:3100`; jalankan produksi
lokal dengan `npx next start -p 3100` atau set `BASE_URL`.

## Aturan bisnis

- 8 unit PS01–PS08 (2 kursi + 1 meja per unit), buka 10.00–00.00 WITA.
- Paket default 1 jam Rp10.000, 3 jam Rp25.000, 4 jam Rp35.000. Admin
  dapat menambah/menghapus durasi (1–14 jam) dan mengubah harga di
  `/admin/pricing`; booking lama tetap memakai harga saat dibuat.
- Booking online hanya QRIS; tunai lewat admin (walk-in).
- `PAYMENT_MODE=mock` (default di `.env.example`) menjalankan QRIS
  simulasi: QR dummy + tombol **Simulasi Bayar Berhasil** yang langsung
  menandai transaksi lunas. Mode `gateway`/kosong menutup simulasi dan
  menampilkan bahwa gateway belum dikonfigurasi.
- Slot QRIS ditahan 15 menit; double booking dicegah di server
  (advisory lock + exclusion constraint).
- Cek booking cukup dengan nomor WhatsApp: semua booking dari nomor itu
  langsung ditampilkan. Cek pesanan F&B juga cukup nomor WhatsApp.
  (Konsekuensinya siapa pun yang tahu nomornya bisa melihat booking/order
  tersebut — catat sebagai celah privasi sebelum produksi.)
- Pesanan F&B: pelanggan wajib mengisi nama, nomor WhatsApp, dan nomor meja;
  kode booking hanya opsional untuk menautkan ke sesi. Pesanan masuk antrean
  admin. Stok dicek dan dikurangi dalam transaksi (row lock), dan
  dikembalikan saat pesanan dibatalkan.
- Admin dapat menambah, mengedit, menghapus, dan memberi foto produk di
  `/admin/menu`. Riwayat pesanan tetap utuh karena item pesanan menyimpan
  nama dan harga saat dipesan.
- Pembayaran F&B memakai QRIS yang sama dengan booking: pesanan dibuat
  berstatus `pending`, halaman `/order/[code]` menampilkan QR dummy +
  tombol **Simulasi Bayar Berhasil** saat `PAYMENT_MODE=mock`. Bila tidak
  dibayar dalam 15 menit, pesanan otomatis dibatalkan dan stok
  dikembalikan. Admin tetap bisa menandai lunas untuk pembayaran tunai di
  kasir.
- Tampilan: font Chakra Petch (judul) + Plus Jakarta Sans (teks), stik PS4
  SVG hitam interaktif di beranda (stik analog bisa digeser, tombol bisa
  ditekan, tanpa tombol bahu L1/L2/R1/R2), tombol 3D timbul/tenggelam,
  tombol **Beranda** kecil di kiri bawah pada setiap halaman (termasuk
  admin), dan foto menu di `public/menu/` untuk mie maupun minuman.
- Mini game **EVO Catch** dan stik PS4 berada dalam **satu kotak EVO Arena**
  yang sama: papan game di atas, stik tepat di bawahnya, supaya pemain bisa
  melihat keduanya sekaligus. Tangkap disc, hindari bom. Stik kiri menggeser
  paddle (tombol panah juga bisa), tombol ✕/PS memulai atau mengulang, 40
  detik dengan 3 nyawa, dan rekor terbaik disimpan di `localStorage`
  peramban.
- SEO: metadata Open Graph/Twitter, `sitemap.xml`, `robots.txt`, dan JSON-LD
  `LocalBusiness` (alamat, jam buka, QRIS, tautan Google Maps) supaya usaha
  ini mudah ditemukan lewat pencarian lokal. Halaman 404 memakai tampilan
  EVO, bukan halaman bawaan Next.js.
- Halaman `/booking` dan `/menu` menampilkan jam WITA berjalan; stempel
  "Dibuat" pada halaman status ikut menampilkan detik.
- Beranda memakai foto arena sebagai latar hero dengan gradasi cerah ke
  pudar (`public/hero-beranda.jpg`). Di pojok kanan atas hero, tepat di
  atas kotak **EVO Arena**, ada kartu **Lokasi** ringkas (setengah tinggi
  kotak arena) berisi cuplikan peta Google Maps dan alamat singkat; seluruh
  kartu membuka `https://maps.app.goo.gl/YezvMzoxgDScEiyg7` di tab baru.
  Kotak **EVO Arena** yang sama memuat mini game, stik PS4, dan harga paket
  rental di bawahnya—satu frame untuk semua.
- Laporan admin `/admin/reports` tampil sebagai buku laporan: sampul yang
  bisa dibuka, dua halaman per bentang, tombol putar halaman, dan tombol
  tutup. Isinya ringkasan pendapatan yang menyegarkan sendiri setiap 10
  detik, rincian asal pendapatan, pembayaran terbaru, paket rental, produk
  F&B, stok menipis, serta riwayat booking PS dan pesanan F&B.
