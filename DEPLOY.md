# Panduan Deploy — EVO Gaming (mode simulasi)

Project ini memang ditujukan sebagai demo/simulasi web booking PS4, jadi
`PAYMENT_MODE=mock` **sengaja dipertahankan**: QR tetap dummy dan tombol
**Simulasi Bayar Berhasil** akan terlihat publik. Tidak perlu integrasi gateway.

> **Tidak bisa di InfinityFree / shared hosting PHP.** InfinityFree hanya
> menyediakan PHP + MySQL, sedangkan project ini butuh Node.js, PostgreSQL,
> dan proses server yang jalan terus. Pakai salah satu alternatif di bawah.

## Opsi gratis: Render + Neon

Ini jalur Rp0. Keduanya punya batasan, tapi cukup untuk demo:

- **Render** web service gratis: 750 jam/bulan, **tidur setelah 15 menit**
  tanpa pengunjung lalu bangun lagi saat ada request (±30–60 detik).
- **Neon** Postgres gratis: 1 GB storage, 100 CU-jam/bulan, compute
  **auto-suspend setelah 5 menit**.

Itu tidak merusak fitur booking: hold 15 menit dan expiry-nya tersimpan di
database, bukan di memori proses.

### 1. Siapkan Neon

1. Daftar di <https://neon.tech> → **New Project**.
2. Region pilih **Singapore (apse1)** supaya dekat dari Indonesia.
3. Buka **Connection Details** → salin connection string **non-pooled**
   (bukan yang mengandung `-pooler`), biasanya sudah dengan `?sslmode=require`.
   Kode ini memakai advisory lock dan prepared statement lewat `pg`, jadi
   lebih aman langsung ke compute daripada lewat pooler.
4. Simpan dulu string itu untuk dipaste ke Render.

### 2. Push kode ke GitHub

`render.yaml` sudah disiapkan, jadi Render otomatis tahu build command, start
command, migrasi, dan seed. `.gitignore` mencegah `.env.local` dan
`node_modules/` ikut ter-upload.

> Git belum terpasang di laptop ini. Pasang Git for Windows (bisa portable),
> lalu jalankan:
>
> ```powershell
> git init
> git add .
> git commit -m "Deploy Render + Neon"
> git branch -M main
> git remote add origin https://github.com/USERNAME/evo-gaming.git
> git push -u origin main
> ```

### 3. Buat service di Render

1. Daftar di <https://render.com> → **New → Blueprint** → hubungkan GitHub →
   pilih repo `evo-gaming`. Render akan membaca `render.yaml`.
2. Saat diminta, isi:
   - `DATABASE_URL` → connection string Neon dari langkah 1
   - `ADMIN_PASSWORD` → password admin kamu
   - `NEXT_PUBLIC_SITE_URL` → `https://evo-gaming.onrender.com`
     (cek lagi dengan URL asli di dashboard, lihat catatan di bawah)
   - `MOCK_GATEWAY_SECRET` → secret buatanmu (dipakai juga smoke test)
    - `AUTH_SECRET` → **sudah otomatis** dibuat Render
3. Region **Singapore**, plan **Free**, lalu **Apply**.

#### Cek nama domain

- URL default Render: `https://<nama-service>.onrender.com`. Karena `render.yaml`
  memakai `name: evo-gaming`, URL-nya `https://evo-gaming.onrender.com`.
- Setelah deploy, buka tab **Settings** di dashboard Render dan salin URL aslinya.
  Kalau Render menambah suffix acak (mis. `evo-gaming-x7ka.onrender.com`), pakai
  URL itu sebagai `NEXT_PUBLIC_SITE_URL` lewat tab **Environment**.
- `NEXT_PUBLIC_SITE_URL` di-inline saat build. Setelah mengubahnya, lakukan
  **Manual Deploy → Clear build cache & deploy** supaya metadata, `sitemap.xml`,
  `robots.txt`, dan JSON-LD ikut memakai domain baru.
- Domain sendiri (opsional): tambahkan `domains: [domain-kamu.com]` di
  `render.yaml`, arahkan DNS sesuai instruksi Render, lalu set
  `NEXT_PUBLIC_SITE_URL=https://domain-kamu.com`.

Saat build Render menjalankan `npm run db:migrate`, lalu setelah deploy pertama
berhasil `npm run db:seed` jalan sekali untuk mengisi data awal.

### 4. Cek

Buka URL yang sudah kamu cek di atas (mis.
`https://evo-gaming.onrender.com`). Kalau data belum muncul, buka tab **Shell**
di dashboard Render lalu jalankan ulang:

```bash
npm run db:migrate
npm run db:seed
```

Setelah itu cek `/admin/login` dengan `ADMIN_EMAIL` / `ADMIN_PASSWORD` dan
`/booking`, `/menu`, `/sitemap.xml`.

Request pertama setelah idle bisa lambat atau sempat timeout karena Render
sedang bangun dan Neon sedang bangun dari suspend — coba ulang sekali.

### 5. Smoke test dari laptop

```powershell
$env:BASE_URL="https://evo-gaming.onrender.com"
$env:ADMIN_EMAIL="owner@evogaming.local"
$env:ADMIN_PASSWORD="password-produksi-kamu"
$env:MOCK_GATEWAY_SECRET="secret-yang-kamu-isi-di-Render"
npm run smoke
```

`scripts/smoke.mjs` membaca environment variable lebih dulu, baru `.env.local`.
Jadi password lokal `evoOwner123` tidak akan dipakai untuk menguji server Render.

## Opsi termudah (berbayar tipis): Railway

Kenapa Railway:

- App + PostgreSQL dalam satu tempat, jadi tidak perlu urus VPS/SSH/reverse proxy.
- HTTPS dan domain otomatis.
- Proses Node jalan terus — penting karena proyek ini memakai advisory lock,
  hold slot 15 menit, dan polling laporan (tidak cocok untuk serverless murni).
- Deploy otomatis setiap kali kamu push ke GitHub.

Kalau sudah punya VPS, pakai `Dockerfile` + `docker-compose.yml` yang sudah
disiapkan di bagian bawah. Untuk jalur gratis, pakai Render + Neon di atas.

> Railway tidak selalu punya tier gratis; cek harga saat mendaftar. Untuk demo,
> biayanya biasanya kecil.

## Yang perlu disiapkan

1. Akun **GitHub** dan **Railway** (<https://railway.app>).
2. Secret acak. Jalankan dua kali di PowerShell:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Nama domain Railway gratisan (mis. `evo-gaming.up.railway.app`) atau domain
   sendiri.

## Langkah 1 — Push kode ke GitHub

`.gitignore` sudah disiapkan supaya `.env.local`, `node_modules/`, dan `.next/`
tidak ikut ter-upload.

```powershell
git init
git add .
git commit -m "Deploy awal EVO Gaming"
git branch -M main
git remote add origin https://github.com/USERNAME/evo-gaming.git
git push -u origin main
```

Ganti `USERNAME` dengan akun GitHub kamu. Buat repository kosong di GitHub
dulu sebelum push.

> **Catatan mesin ini:** Git belum terpasang (perintah `git` tidak dikenal),
> jadi blok di atas belum bisa dijalankan dari laptop ini. Dua pilihan:
>
> 1. Pasang **Git for Windows** (bisa portable), lalu jalankan perintah di atas.
> 2. Lewati GitHub dan pakai Railway CLI: `railway login` → `railway init` →
>    `railway up`. Ini meng-upload isi folder project langsung, tanpa git.
>
> Kalau memakai cara ke-2, lanjut ke Langkah 3 untuk mengisi Variables.

## Langkah 2 — Buat project & database di Railway

1. Railway → **New Project** → **Deploy from GitHub repo** → pilih repo
   `evo-gaming`.
2. Di project yang sama: **New** → **Database** → **PostgreSQL**.
3. Railway otomatis menambahkan variabel `DATABASE_URL` ke service app.
   Pastikan app dan database berada di project yang sama.

## Langkah 3 — Isi environment variables

Di service app → tab **Variables**, tambahkan:

| Variable | Nilai |
| --- | --- |
| `DATABASE_URL` | sudah diisi otomatis oleh Railway |
| `AUTH_SECRET` | secret acak (hasil perintah di atas) |
| `MOCK_GATEWAY_SECRET` | secret acak yang **berbeda** |
| `ADMIN_EMAIL` | `owner@evogaming.local` (atau email kamu) |
| `ADMIN_PASSWORD` | password kuat — **jangan** `change-me` |
| `PAYMENT_MODE` | `mock` |
| `NEXT_PUBLIC_SITE_URL` | `https://<nama-app>.up.railway.app` |

Catatan: `NEXT_PUBLIC_SITE_URL` dipakai metadata, sitemap, robots, dan JSON-LD.
Isi dengan origin asli tanpa slash di akhir.

Railway akan build ulang setelah variabel disimpan. Tunggu sampai status
**Deployed**.

## Langkah 4 — Migrasi & seed (sekali saja)

Pasang Railway CLI, lalu jalankan dari folder project:

```powershell
npm i -g @railway/cli
railway login
railway link          # pilih project & service app
railway run npm run db:migrate
railway run npm run db:seed
```

- `db:migrate` aman diulang (mencatat nama file di tabel `_evo_migrations`).
- `db:seed` **jangan** diulang setiap restart: seed admin selalu menimpa
  `passwordHash` dari `ADMIN_PASSWORD`. Data booking/order tidak dihapus, tapi
  password admin akan kembali ke nilai env.

Kalau lebih nyaman, migrasi juga bisa dijalankan otomatis saat start dengan
mengganti start command menjadi:

```
npm run db:migrate && npm start
```

Itu aman karena migrasi idempoten. Seed tetap cukup sekali saja.

## Langkah 5 — Cek

Buka dan pastikan tidak ada error:

- `/` — hero, peta Lokasi, EVO Arena (mini game + stik hitam), harga paket
- `/booking` — pilih jadwal
- `/menu` — pesan F&B
- `/admin/login` — login dengan `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `/sitemap.xml`, `/robots.txt`
- `/halaman-ngawur` — harus muncul 404 bermerek EVO

Jalankan juga smoke test dari laptop kalau mau:

```powershell
$env:BASE_URL="https://<nama-app>.up.railway.app"
npm run smoke
```

## Catatan khusus mode simulasi

- Tombol **Simulasi Bayar Berhasil** bisa diklik siapa pun. Jangan terima
  pembayaran sungguhan.
- Cek booking/order masih cukup pakai nomor WhatsApp. Siapa pun yang tahu
  nomornya bisa melihat data tersebut. Untuk demo tidak apa-apa, tapi jangan
  isi data pelanggan asli.
- Jam operasional dan harga paket bisa diubah admin di `/admin/pricing`.

## Alternatif: VPS sendiri dengan Docker

`Dockerfile`, `.dockerignore`, dan `docker-compose.yml` sudah disiapkan. File
`.env` (tidak ikut ter-commit) berisi:

```env
POSTGRES_PASSWORD=ganti-dengan-password-kuat
AUTH_SECRET=<secret acak>
MOCK_GATEWAY_SECRET=<secret acak beda>
ADMIN_EMAIL=owner@evogaming.local
ADMIN_PASSWORD=<password admin>
NEXT_PUBLIC_SITE_URL=https://domain-kamu.com
```

Di VPS yang sudah punya Docker + Docker Compose:

```bash
docker compose up -d --build
docker compose exec app npm run db:migrate
docker compose exec app npm run db:seed
```

Aplikasi jalan di port `3000`. Taruh Caddy/Nginx di depannya untuk HTTPS,
misalnya Caddy otomatis:

```
domain-kamu.com {
    reverse_proxy localhost:3000
}
```

Data Postgres tersimpan di volume `pgdata`, jadi aman saat container di-restart.
Catatan: `NEXT_PUBLIC_SITE_URL` di-inline saat build, jadi isi dulu di `.env`
sebelum `docker compose up -d --build`. Build produksi sudah diuji lolos di
mesin ini.
