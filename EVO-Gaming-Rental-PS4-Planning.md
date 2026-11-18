# EVO Gaming Rental PS 4 Banjarmasin

## Dokumen Perencanaan Website

**Versi:** 1.0\
**Tanggal:** 14 November 2026\
**Nama usaha:** EVO Gaming Rental PS 4 Banjarmasin

------------------------------------------------------------------------

## 1. Ringkasan Proyek

Website EVO Gaming Rental PS 4 Banjarmasin adalah platform pemesanan
rental PlayStation 4 yang mengutamakan pengalaman mobile-first, tampilan
modern, dan interaksi yang responsif. Website melayani dua jenis
pengguna:

1.  **Pelanggan**, yang dapat melihat ketersediaan unit PS secara
    real-time, melakukan booking online, memesan makanan/minuman, serta
    membayar melalui QRIS atau tunai di tempat.
2.  **Pemilik/admin**, yang dapat mengelola unit PS, jadwal booking,
    menu, stok, pesanan, pembayaran, dan laporan operasional.

Usaha memiliki 8 unit PS4. Setiap unit dilengkapi 2 kursi dan 1 meja.
Jam operasional setiap hari adalah pukul 10.00 sampai 00.00.

### Keputusan bisnis yang sudah ditetapkan

  -----------------------------------------------------------------------
  Aspek                               Keputusan
  ----------------------------------- -----------------------------------
  Jumlah unit                         8 unit PS4

  Fasilitas per unit                  2 kursi dan 1 meja

  Harga                               Rp10.000/1 jam; Rp25.000/3 jam;
                                      Rp35.000/4 jam

  Pembayaran                          QRIS otomatis melalui payment
                                      gateway

  Booking online                      Pelanggan memilih unit, tanggal,
                                      jam mulai, dan durasi; booking
                                      dikonfirmasi otomatis setelah
                                      pembayaran berhasil

  Booking langsung                    Admin dapat membuat booking dari
                                      dashboard untuk pelanggan yang
                                      datang langsung

  Akun pelanggan                      Tidak wajib; pelanggan mengisi nama
                                      dan nomor WhatsApp saat booking

  Jam operasional                     Setiap hari, 10.00--00.00

  Pesanan makanan                     Diantar ke meja pelanggan sesuai
                                      nomor meja
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Tujuan Website

-   Memudahkan pelanggan memesan PS tanpa harus datang atau menghubungi
    admin terlebih dahulu.
-   Menampilkan ketersediaan 8 unit PS secara real-time.
-   Menghindari dua pelanggan memesan unit dan waktu yang sama.
-   Mempermudah pelanggan memesan makanan dan minuman selama bermain.
-   Mempermudah pemilik mengelola operasional dari HP maupun komputer.
-   Mencatat transaksi rental, makanan/minuman, pembayaran, dan
    pendapatan.

### Indikator keberhasilan

-   Pelanggan dapat menyelesaikan booking dari HP dengan alur yang
    sederhana.
-   Status unit dan jadwal selalu konsisten antara halaman pelanggan dan
    dashboard admin.
-   Tidak terjadi double booking.
-   Pembayaran QRIS dapat diverifikasi otomatis melalui notifikasi
    server payment gateway.
-   Pesanan makanan/minuman memiliki nomor meja dan status pengantaran
    yang jelas.

------------------------------------------------------------------------

## 3. Jenis Pengguna dan Hak Akses

### 3.1 Pelanggan

Pelanggan tidak perlu membuat akun. Untuk melakukan booking, pelanggan
mengisi:

-   Nama pelanggan.
-   Nomor WhatsApp aktif.
-   Tanggal bermain.
-   Unit PS yang dipilih, atau opsi memilih unit yang tersedia.
-   Jam mulai.
-   Durasi bermain.
-   Metode pembayaran.

Pelanggan dapat:

-   Melihat daftar 8 unit PS dan status ketersediaannya.
-   Memilih jadwal yang tersedia.
-   Melihat rincian harga sebelum membayar.
-   Membayar dengan QRIS melalui payment gateway.
-   Memilih pembayaran tunai di tempat jika tersedia sebagai pilihan
    saat booking.
-   Melihat kode booking dan status booking.
-   Memesan makanan/minuman ketika berada di lokasi.
-   Melihat status pesanan makanan/minuman.

Akses status booking dapat menggunakan kode booking dan verifikasi nomor
WhatsApp/tautan aman. Jangan menampilkan data pribadi pelanggan kepada
pengguna lain.

### 3.2 Pemilik/Admin

Pemilik masuk melalui halaman login khusus. Fitur admin:

-   Dashboard ringkasan operasional.
-   Mengelola unit PS 1 sampai PS 8.
-   Melihat jadwal booking seluruh unit.
-   Membuat booking langsung untuk pelanggan di tempat.
-   Mengubah atau membatalkan booking sesuai kebijakan.
-   Mengelola daftar menu dan harga makanan/minuman.
-   Mengelola stok barang.
-   Melihat pesanan masuk dan memperbarui statusnya.
-   Memverifikasi pembayaran tunai.
-   Melihat transaksi dan laporan pendapatan.
-   Mengatur jam operasional, harga, dan konfigurasi payment gateway.

**Catatan keamanan:** akun admin wajib dilindungi password yang kuat.
Jika nantinya ada beberapa staf, buat peran terpisah seperti kasir dan
petugas pesanan dengan hak akses terbatas.

------------------------------------------------------------------------

## 4. Struktur Halaman Website

### 4.1 Halaman Pelanggan

  -----------------------------------------------------------------------
  Halaman                             Isi dan fungsi
  ----------------------------------- -----------------------------------
  Beranda                             Branding EVO Gaming, jam
                                      operasional, tombol booking,
                                      ringkasan fasilitas

  Pilih PS                            Kartu 8 unit PS, status
                                      tersedia/dipesan/sedang
                                      digunakan/perawatan

  Jadwal                              Kalender atau pemilih tanggal, jam
                                      mulai, durasi, dan slot yang
                                      tersedia

  Detail Booking                      Ringkasan unit, tanggal, jam,
                                      durasi, harga, data pelanggan

  Pembayaran                          QRIS payment gateway atau tunai di
                                      tempat

  Booking Berhasil                    Kode booking, rincian pesanan,
                                      status pembayaran, petunjuk
                                      kedatangan

  Menu                                Daftar makanan dan minuman, harga,
                                      stok, dan tombol tambah ke
                                      keranjang

  Keranjang                           Daftar item, jumlah, subtotal, dan
                                      konfirmasi pesanan

  Status Pesanan                      Status diterima, diproses, siap
                                      diantar, dan selesai

  Cek Booking                         Pelacakan booking menggunakan kode
                                      booking dan verifikasi yang aman
  -----------------------------------------------------------------------

### 4.2 Dashboard Admin

  -----------------------------------------------------------------------
  Halaman                             Isi dan fungsi
  ----------------------------------- -----------------------------------
  Login Admin                         Autentikasi pemilik/staf

  Dashboard                           Unit aktif, booking hari ini,
                                      pesanan makanan, dan pendapatan

  Manajemen PS                        Status, kondisi, dan pengaturan
                                      unit

  Kalender Booking                    Jadwal per unit dan pembuatan
                                      booking langsung

  Detail Booking                      Data pelanggan, durasi, biaya,
                                      status, dan riwayat

  Pesanan                             Daftar pesanan makanan/minuman dan
                                      nomor meja

  Menu & Stok                         Tambah/edit menu, harga, foto, dan
                                      stok

  Pembayaran                          Status pembayaran QRIS/tunai dan
                                      rekonsiliasi

  Laporan                             Pendapatan rental, penjualan menu,
                                      transaksi, dan periode laporan

  Pengaturan                          Jam operasional, tarif, meja,
                                      payment gateway, dan kebijakan
                                      booking
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 5. Rancangan UI/UX

### 5.1 Arah Visual

Gunakan tema gaming modern dengan kesan premium:

-   Latar dominan gelap, misalnya charcoal atau navy gelap.
-   Aksen neon biru, ungu, atau cyan.
-   Kartu unit PS dengan sudut membulat dan bayangan halus.
-   Ikon sederhana dan ilustrasi gaming yang konsisten.
-   Tipografi tegas untuk judul dan mudah dibaca untuk informasi.
-   Animasi mikro saat tombol disentuh, kartu dipilih, atau status
    berubah.

Hindari efek berlebihan yang memperlambat website atau mengganggu
keterbacaan.

### 5.2 Prinsip Mobile-First

Website harus nyaman digunakan pada layar HP:

-   Layout satu kolom untuk layar kecil.
-   Tombol utama cukup besar dan mudah disentuh.
-   Navigasi ringkas dan konsisten.
-   Harga dan status unit terlihat tanpa perlu membuka banyak halaman.
-   Form booking dibagi menjadi langkah-langkah singkat.
-   Keranjang makanan mudah diakses.
-   Dashboard admin tetap responsif, dengan tabel yang berubah menjadi
    kartu pada layar sempit.

### 5.3 Interaksi

-   Kartu PS memiliki animasi ringan ketika disentuh/dipilih.
-   Slot waktu yang tersedia dapat dipilih; slot yang bentrok
    dinonaktifkan.
-   Perubahan ketersediaan muncul tanpa perlu refresh halaman.
-   Tombol tambah makanan memberi umpan balik visual dan memperbarui
    jumlah keranjang.
-   Tampilkan indikator loading, sukses, dan gagal untuk setiap proses.
-   Hormati pengaturan reduced motion pada perangkat pengguna.

### 5.4 Contoh Status Unit

  -----------------------------------------------------------------------
  Status                  Makna                   Tampilan yang
                                                  disarankan
  ----------------------- ----------------------- -----------------------
  Tersedia                Belum dipesan dan bisa  Hijau
                          dipilih                 

  Menunggu pembayaran     Booking sedang menunggu Kuning
                          pembayaran QRIS         

  Dipesan                 Sudah dibooking untuk   Biru
                          jadwal mendatang        

  Sedang digunakan        Pelanggan sedang        Ungu
                          bermain                 

  Perawatan               Unit tidak dapat        Abu-abu/merah
                          dipesan                 
  -----------------------------------------------------------------------

Status harus disertai teks, bukan warna saja, agar mudah dipahami semua
pengguna.

------------------------------------------------------------------------

## 6. Sistem Unit PS dan Meja

Buat data awal untuk 8 unit:

-   PS 01 --- 2 kursi --- Meja 01
-   PS 02 --- 2 kursi --- Meja 02
-   PS 03 --- 2 kursi --- Meja 03
-   PS 04 --- 2 kursi --- Meja 04
-   PS 05 --- 2 kursi --- Meja 05
-   PS 06 --- 2 kursi --- Meja 06
-   PS 07 --- 2 kursi --- Meja 07
-   PS 08 --- 2 kursi --- Meja 08

Nomor meja di atas adalah rancangan awal satu meja untuk setiap unit.
Jika penomoran meja di lokasi berbeda, admin dapat mengubah relasinya
melalui pengaturan.

### 6.1 Ketersediaan Real-Time

-   Pelanggan memilih tanggal dan durasi.
-   Server memeriksa jadwal semua unit.
-   Unit yang tidak bentrok ditampilkan sebagai tersedia.
-   Ketika pelanggan memulai checkout, sistem membuat reservasi
    sementara dengan batas waktu pembayaran.
-   Setelah pembayaran QRIS sukses, reservasi dikonfirmasi.
-   Jika pembayaran gagal atau kedaluwarsa, reservasi sementara dilepas.
-   Perubahan status dikirim ke halaman pelanggan dan dashboard admin
    secara real-time.

**Penting:** tampilan real-time tidak boleh menjadi satu-satunya
pengaman. Pemeriksaan bentrok harus dilakukan kembali di server saat
membuat reservasi dan saat mengonfirmasi pembayaran. Gunakan transaksi
database dan mekanisme penguncian/constraint yang sesuai agar dua
permintaan bersamaan tidak dapat memesan unit yang sama.

### 6.2 Booking Langsung di Lokasi

Admin/kasir membuka kalender booking, memilih unit yang tersedia,
memasukkan nama dan nomor WhatsApp pelanggan (jika diberikan), memilih
durasi, lalu menyimpan booking. Sistem harus memeriksa bentrok yang sama
seperti booking online.

------------------------------------------------------------------------

## 7. Harga dan Perhitungan Rental

  Paket        Harga
  ------- ----------
  1 jam     Rp10.000
  3 jam     Rp25.000
  4 jam     Rp35.000

Aturan harga yang disarankan:

-   Harga paket yang dipilih menjadi harga dasar transaksi.
-   Jangan otomatis menganggap harga 2 jam, 5 jam, atau durasi lainnya
    sebelum pemilik menetapkannya.
-   Jika pelanggan memilih durasi yang belum memiliki tarif, tampilkan
    pilihan paket yang tersedia saja.
-   Jam selesai dihitung dari jam mulai ditambah durasi.
-   Sistem menolak booking yang melewati jam operasional, kecuali
    pemilik kelak mengaktifkan aturan khusus.
-   Kebijakan keterlambatan, perpanjangan waktu, pembatalan, dan refund
    perlu ditetapkan sebelum peluncuran.

### 7.1 Jam Operasional

-   Buka: 10.00.
-   Tutup: 00.00 (tengah malam).
-   Hari operasional: setiap hari.

Untuk perhitungan jadwal, perlakukan jam tutup sebagai batas akhir hari
operasional. Booking harus selesai paling lambat pukul 00.00. Zona waktu
aplikasi: **Asia/Makassar (WITA)** untuk Banjarmasin? **Perlu
dikonfirmasi saat implementasi:** Banjarmasin menggunakan WITA (UTC+8).
Simpan timestamp secara konsisten di server/database dan tampilkan
sesuai zona waktu tersebut.

------------------------------------------------------------------------

## 8. Sistem Pembayaran

### 8.1 QRIS Otomatis melalui Payment Gateway

Alur yang disarankan:

1.  Pelanggan memilih paket rental dan mengisi data.
2.  Server membuat booking sementara dan order pembayaran.
3.  Payment gateway mengembalikan QRIS dinamis atau instruksi
    pembayaran.
4.  Website menampilkan QRIS dan batas waktu pembayaran.
5.  Payment gateway mengirim webhook/callback ke server setelah
    pembayaran.
6.  Server memvalidasi tanda tangan/keaslian webhook dan mencocokkan ID
    transaksi, nominal, serta status.
7.  Jika valid dan sukses, booking otomatis dikonfirmasi.
8.  Website memperbarui status tanpa pelanggan perlu refresh.

Ketentuan keamanan:

-   Jangan menganggap pembayaran berhasil hanya karena pelanggan kembali
    ke halaman sukses.
-   Status final harus berasal dari webhook terverifikasi atau
    pengecekan status resmi ke payment gateway.
-   Simpan ID transaksi gateway dan catatan perubahan status.
-   Proses webhook secara idempoten agar notifikasi berulang tidak
    menggandakan transaksi.
-   Jangan menyimpan secret key payment gateway di frontend.

### 8.2 Tunai di Tempat

-   Pelanggan memilih tunai di tempat jika opsi ini diaktifkan.
-   Booking dicatat dengan status pembayaran **menunggu pembayaran
    tunai**.
-   Admin/kasir mengonfirmasi pembayaran setelah uang diterima.
-   Booking memiliki status reservasi yang jelas dan tidak boleh
    dianggap lunas sebelum diverifikasi.
-   Tetapkan batas waktu kedatangan dan kebijakan no-show agar unit
    tidak tertahan tanpa kepastian.

### 8.3 Status Pembayaran

-   Menunggu pembayaran.
-   Dibayar.
-   Gagal.
-   Kedaluwarsa.
-   Dibatalkan.
-   Refund (jika payment gateway dan kebijakan usaha mendukung).

------------------------------------------------------------------------

## 9. Sistem Makanan dan Minuman

### 9.1 Fitur Menu

Contoh kategori:

**Minuman** - Kopi botolan. - Air mineral. - Minuman kemasan lainnya.

**Makanan** - Mi instan. - Mi instan dengan tambahan telur (jika
tersedia). - Camilan.

Admin dapat mengelola nama produk, kategori, deskripsi, foto, harga,
stok, dan status tersedia/habis.

### 9.2 Alur Pemesanan

1.  Pelanggan membuka menu dari halaman website.
2.  Pelanggan memilih produk dan jumlah.
3.  Pelanggan mengonfirmasi nomor meja yang terhubung dengan unit PS
    atau memasukkan kode sesi/booking.
4.  Sistem memeriksa stok.
5.  Pesanan masuk ke dashboard admin.
6.  Petugas mengubah status menjadi diproses.
7.  Setelah siap, status menjadi siap diantar.
8.  Petugas mengantarkan pesanan ke nomor meja pelanggan.
9.  Pesanan ditandai selesai.

### 9.3 Status Pesanan

-   Baru masuk.
-   Dikonfirmasi.
-   Diproses.
-   Siap diantar.
-   Sedang diantar.
-   Selesai.
-   Dibatalkan.

### 9.4 Stok

-   Stok berkurang ketika pesanan dikonfirmasi sesuai kebijakan yang
    dipilih.
-   Jika stok habis, produk tidak dapat ditambahkan ke keranjang.
-   Admin dapat memperbarui stok dan melihat riwayat perubahan.
-   Validasi stok dilakukan di server untuk mencegah overselling.

### 9.5 Pembayaran Makanan

Rekomendasi tahap awal: pesanan makanan/minuman dicatat sebagai tagihan
terpisah dan dibayar tunai di kasir/meja, atau digabung ke tagihan akhir
sesi. Pemilik perlu menetapkan kebijakan final. Jika ingin pembayaran
QRIS untuk makanan juga, payment gateway dapat digunakan untuk membuat
transaksi tambahan.

------------------------------------------------------------------------

## 10. Alur Penggunaan Utama

### 10.1 Booking Online dengan QRIS

1.  Pelanggan membuka website.
2.  Memilih tanggal bermain.
3.  Memilih jam mulai dan paket durasi.
4.  Website menampilkan unit yang tersedia secara real-time.
5.  Pelanggan memilih unit.
6.  Pelanggan mengisi nama dan nomor WhatsApp.
7.  Sistem menampilkan ringkasan dan total harga.
8.  Pelanggan memilih QRIS.
9.  Sistem membuat reservasi sementara dan menampilkan QRIS.
10. Payment gateway mengirim konfirmasi pembayaran.
11. Sistem mengubah booking menjadi terkonfirmasi.
12. Pelanggan melihat kode booking dan nomor meja.

### 10.2 Booking Online dengan Tunai di Tempat

1.  Pelanggan memilih tanggal, waktu, durasi, dan unit.
2.  Pelanggan mengisi nama dan nomor WhatsApp.
3.  Pelanggan memilih tunai di tempat.
4.  Sistem membuat booking sesuai aturan konfirmasi tunai.
5.  Pelanggan menerima kode booking dan instruksi kedatangan.
6.  Admin mengonfirmasi pembayaran saat pelanggan membayar.

**Keputusan implementasi yang perlu dibuat:** apakah booking tunai
langsung dikonfirmasi, atau ditahan sementara sambil menunggu
persetujuan admin. Rekomendasi awal: booking tunai dapat langsung
dicatat sebagai booking terkonfirmasi dengan status pembayaran belum
lunas, disertai batas waktu kedatangan/no-show yang ditentukan pemilik.

### 10.3 Booking Langsung

1.  Pelanggan datang ke lokasi.
2.  Admin memeriksa unit yang tersedia.
3.  Admin membuat booking pada dashboard.
4.  Sistem menyimpan jam mulai, durasi, dan harga.
5.  Pelanggan membayar tunai atau metode lain yang tersedia.
6.  Unit berubah menjadi sedang digunakan.

### 10.4 Pemesanan Makanan Saat Bermain

1.  Pelanggan membuka menu.
2.  Memilih makanan/minuman dan jumlah.
3.  Mengirim pesanan dengan nomor meja yang benar.
4.  Petugas menerima pesanan.
5.  Petugas memproses dan mengantarkan ke meja.
6.  Status pesanan diperbarui sampai selesai.

------------------------------------------------------------------------

## 11. Rancangan Database

Rekomendasi menggunakan database relasional seperti PostgreSQL.

### 11.1 Tabel `admins`

  Kolom            Keterangan
  ---------------- -----------------------------
  id               Primary key
  name             Nama admin
  email/username   Identitas login
  password_hash    Password yang sudah di-hash
  role             owner, cashier, atau staff
  created_at       Waktu dibuat

### 11.2 Tabel `customers`

  Kolom        Keterangan
  ------------ ------------------------
  id           Primary key
  name         Nama pelanggan
  whatsapp     Nomor WhatsApp
  created_at   Waktu pertama tercatat

Pelanggan tidak perlu akun. Data pelanggan dapat dibuat atau digunakan
kembali berdasarkan nomor WhatsApp, dengan perlindungan privasi yang
sesuai.

### 11.3 Tabel `ps_units`

  Kolom         Keterangan
  ------------- ---------------------
  id            Primary key
  unit_code     PS01 sampai PS08
  name          Nama tampilan unit
  chair_count   Default 2
  table_id      Relasi ke meja
  status        active, maintenance
  created_at    Waktu dibuat

### 11.4 Tabel `tables`

  Kolom          Keterangan
  -------------- -------------
  id             Primary key
  table_number   Nomor meja
  is_active      Status meja

### 11.5 Tabel `bookings`

  -----------------------------------------------------------------------
  Kolom                               Keterangan
  ----------------------------------- -----------------------------------
  id                                  Primary key

  booking_code                        Kode unik untuk pelanggan

  customer_id                         Relasi pelanggan

  ps_unit_id                          Unit yang dipesan

  start_at                            Waktu mulai

  end_at                              Waktu selesai

  duration_hours                      Durasi

  package_code                        Paket harga

  rental_price                        Harga saat booking dibuat

  booking_source                      online atau walk_in

  booking_status                      pending, confirmed, in_use,
                                      completed, cancelled, expired

  payment_status                      unpaid, pending, paid, failed,
                                      expired, refunded

  created_at                          Waktu dibuat
  -----------------------------------------------------------------------

Simpan harga transaksi sebagai snapshot agar perubahan harga di masa
depan tidak mengubah transaksi lama.

### 11.6 Tabel `payments`

  Kolom                       Keterangan
  --------------------------- ---------------------------------------------------
  id                          Primary key
  booking_id                  Relasi booking, boleh null untuk tagihan terpisah
  payment_reference           Referensi internal
  gateway_transaction_id      ID transaksi gateway
  method                      qris atau cash
  amount                      Nominal
  status                      Status pembayaran
  paid_at                     Waktu pembayaran
  gateway_payload_reference   Referensi data callback yang aman

Jangan menyimpan data sensitif yang tidak diperlukan dari payment
gateway.

### 11.7 Tabel `products`

  Kolom            Keterangan
  ---------------- -------------------------
  id               Primary key
  name             Nama produk
  category         food atau drink
  description      Deskripsi
  price            Harga jual
  stock_quantity   Stok
  image_url        Foto produk
  is_available     Bisa dipesan atau tidak

### 11.8 Tabel `food_orders`

  Kolom            Keterangan
  ---------------- -------------------------
  id               Primary key
  order_code       Kode pesanan
  booking_id       Relasi booking/sesi
  table_id         Meja tujuan
  customer_name    Snapshot nama pelanggan
  status           Status pesanan
  subtotal         Total pesanan
  payment_status   Status pembayaran
  created_at       Waktu dibuat

### 11.9 Tabel `food_order_items`

  Kolom           Keterangan
  --------------- ----------------------
  id              Primary key
  food_order_id   Relasi pesanan
  product_id      Relasi produk
  product_name    Snapshot nama produk
  unit_price      Snapshot harga
  quantity        Jumlah
  line_total      Total item

### 11.10 Tabel `business_settings`

Menyimpan jam operasional, zona waktu, konfigurasi paket harga, batas
waktu pembayaran, kebijakan booking tunai, dan pengaturan operasional
lainnya.

### 11.11 Relasi Utama

-   Satu pelanggan dapat memiliki banyak booking.
-   Satu unit PS dapat memiliki banyak booking pada waktu berbeda.
-   Satu unit terhubung dengan satu meja.
-   Satu booking dapat memiliki satu atau lebih catatan pembayaran jika
    mendukung pembayaran terpisah.
-   Satu sesi booking dapat memiliki banyak pesanan makanan.
-   Satu pesanan makanan memiliki banyak item.
-   Satu produk dapat muncul pada banyak item pesanan.

------------------------------------------------------------------------

## 12. Teknologi yang Direkomendasikan

Rekomendasi stack yang cocok untuk website responsif dan pembaruan
real-time:

  -----------------------------------------------------------------------
  Bagian                  Teknologi               Kegunaan
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js + React +       Website pelanggan dan
                          TypeScript              dashboard admin

  Styling                 Tailwind CSS            Desain responsif dan
                                                  konsisten

  Komponen UI             shadcn/ui atau komponen Komponen interaktif
                          custom                  

  Backend                 Next.js server routes   Logika booking,
                          atau API backend        pembayaran, dan menu
                          terpisah                

  Database                PostgreSQL              Data transaksi dan
                                                  jadwal

  Realtime                Supabase Realtime atau  Pembaruan status unit
                          WebSocket               dan pesanan

  Authentication admin    Supabase Auth atau      Login pemilik/staf
                          solusi setara           

  Payment gateway         Penyedia payment        Pembayaran QRIS
                          gateway Indonesia yang  otomatis
                          mendukung QRIS dinamis  

  Hosting                 Platform hosting        Menjalankan website
                          aplikasi + database     
                          terkelola               

  Penyimpanan gambar      Object storage          Foto menu dan aset
                                                  website
  -----------------------------------------------------------------------

Pemilihan payment gateway harus mempertimbangkan biaya transaksi, proses
pendaftaran merchant, dukungan QRIS dinamis, webhook, dokumentasi, dan
proses pencairan dana. Jangan mengunci arsitektur pada satu penyedia
sebelum pemilik menyetujui akun merchant.

------------------------------------------------------------------------

## 13. API/Proses Backend yang Dibutuhkan

Contoh endpoint konseptual:

  ---------------------------------------------------------------------------
  Endpoint                                Fungsi
  --------------------------------------- -----------------------------------
  `GET /api/availability`                 Memeriksa unit yang tersedia untuk
                                          tanggal dan rentang waktu

  `POST /api/bookings`                    Membuat reservasi sementara/booking

  `GET /api/bookings/:code`               Melihat status booking dengan
                                          verifikasi

  `POST /api/payments/qris`               Membuat transaksi QRIS

  `POST /api/webhooks/payment`            Menerima notifikasi pembayaran
                                          gateway

  `POST /api/admin/bookings`              Membuat booking langsung

  `PATCH /api/admin/bookings/:id`         Memperbarui status booking

  `GET /api/products`                     Mengambil daftar menu tersedia

  `POST /api/orders`                      Membuat pesanan makanan/minuman

  `GET /api/admin/orders`                 Melihat pesanan masuk

  `PATCH /api/admin/orders/:id`           Memperbarui status pesanan

  `PATCH /api/admin/products/:id/stock`   Memperbarui stok
  ---------------------------------------------------------------------------

Semua endpoint admin harus memerlukan autentikasi dan otorisasi.
Endpoint publik tetap perlu validasi input, pembatasan percobaan, dan
perlindungan spam.

------------------------------------------------------------------------

## 14. Keamanan dan Keandalan

-   Gunakan HTTPS untuk seluruh website.
-   Hash password admin menggunakan algoritma password hashing modern.
-   Terapkan role-based access control.
-   Validasi semua input di server.
-   Gunakan prepared queries/ORM untuk mencegah SQL injection.
-   Lindungi endpoint dari spam dan percobaan booking berulang.
-   Verifikasi webhook payment gateway.
-   Gunakan transaksi database untuk proses booking dan pengurangan
    stok.
-   Cegah double booking dengan validasi bentrok di server dan
    constraint database yang sesuai.
-   Buat audit log untuk perubahan booking, harga, stok, dan status
    pembayaran.
-   Batasi akses data pelanggan hanya kepada pihak yang berwenang.
-   Siapkan backup database dan prosedur pemulihan.
-   Jangan menyimpan nomor kartu atau kredensial pembayaran pelanggan.

------------------------------------------------------------------------

## 15. Laporan dan Dashboard

Informasi ringkasan yang disarankan:

-   Jumlah unit tersedia, dipesan, sedang digunakan, dan perawatan.
-   Booking hari ini.
-   Pesanan makanan/minuman yang belum selesai.
-   Total pendapatan rental hari ini.
-   Total penjualan makanan/minuman.
-   Pembayaran yang belum lunas.
-   Produk dengan stok menipis.

Laporan dapat difilter berdasarkan hari, minggu, bulan, dan rentang
tanggal. Pisahkan pendapatan rental dan penjualan makanan agar pemilik
dapat membaca performa usaha dengan jelas.

------------------------------------------------------------------------

## 16. Tahapan Pengerjaan

### Tahap 1 --- Finalisasi kebutuhan

-   Konfirmasi kebijakan booking tunai.
-   Konfirmasi aturan pembatalan, keterlambatan, dan no-show.
-   Menentukan daftar menu, harga, dan stok awal.
-   Menentukan payment gateway dan menyiapkan akun merchant.
-   Memastikan pemetaan nomor meja dan unit PS.

### Tahap 2 --- Desain UI/UX

-   Membuat wireframe mobile dan desktop.
-   Mendesain halaman beranda dan pemilihan PS.
-   Mendesain alur booking dan pembayaran.
-   Mendesain menu, keranjang, dan status pesanan.
-   Mendesain dashboard admin.

### Tahap 3 --- Fondasi aplikasi

-   Menyiapkan proyek frontend dan backend.
-   Membuat database dan migrasi.
-   Menyiapkan autentikasi admin.
-   Menyiapkan konfigurasi lingkungan dan deployment awal.

### Tahap 4 --- Booking dan ketersediaan

-   Memasukkan 8 unit PS dan 8 meja.
-   Membuat kalender dan pemeriksaan ketersediaan.
-   Membuat reservasi sementara.
-   Membuat booking online dan booking langsung.
-   Menguji skenario bentrok dan permintaan bersamaan.

### Tahap 5 --- Pembayaran QRIS

-   Integrasi payment gateway di lingkungan sandbox.
-   Membuat QRIS dinamis.
-   Memvalidasi webhook.
-   Menguji pembayaran sukses, gagal, kedaluwarsa, dan notifikasi
    berulang.
-   Mengaktifkan transaksi produksi setelah lolos pengujian.

### Tahap 6 --- Menu dan pesanan

-   Membuat manajemen produk dan stok.
-   Membuat keranjang pelanggan.
-   Membuat pesanan berdasarkan sesi dan nomor meja.
-   Membuat dashboard antrean pesanan.
-   Menguji alur pengantaran sampai selesai.

### Tahap 7 --- Pengujian dan peluncuran

-   Menguji berbagai ukuran layar HP dan desktop.
-   Menguji booking pada jam buka dan batas tutup.
-   Menguji seluruh status pembayaran.
-   Menguji stok habis dan pesanan bersamaan.
-   Menguji keamanan dan hak akses admin.
-   Menyiapkan domain, HTTPS, backup, dan monitoring.
-   Melakukan simulasi operasional sebelum website diumumkan.

------------------------------------------------------------------------

## 17. Skenario Pengujian Wajib

1.  Dua pelanggan mencoba memesan PS yang sama pada waktu yang sama:
    hanya satu booking yang boleh berhasil.
2.  Dua pelanggan memesan PS berbeda pada waktu yang sama: keduanya
    boleh berhasil.
3.  QRIS belum dibayar sampai batas waktu: reservasi sementara
    kedaluwarsa dan slot tersedia kembali.
4.  Webhook pembayaran dikirim dua kali: transaksi tidak boleh tercatat
    dua kali.
5.  Pelanggan memilih jadwal yang melewati pukul 00.00: sistem menolak
    atau meminta jadwal yang valid.
6.  Admin membuat booking langsung pada slot yang sudah terisi: sistem
    menolak.
7.  Produk stok nol: pelanggan tidak dapat memesan.
8.  Dua pesanan mengambil stok terakhir bersamaan: stok tidak boleh
    menjadi negatif.
9.  Pesanan makanan terhubung ke meja yang benar.
10. Pelanggan tanpa akun dapat melakukan booking dan mengecek status
    dengan aman.
11. Website tetap mudah digunakan pada layar HP kecil.
12. Admin yang tidak memiliki izin tidak dapat mengubah pembayaran atau
    konfigurasi pemilik.

------------------------------------------------------------------------

## 18. Hal yang Masih Perlu Diputuskan Sebelum Implementasi

Keputusan berikut belum ditentukan dan sebaiknya dikonfirmasi oleh
pemilik:

1.  **Booking tunai:** apakah langsung terkonfirmasi atau menunggu
    persetujuan admin? Berapa lama unit ditahan jika pelanggan belum
    datang?
2.  **Pembatalan dan refund:** apakah pelanggan boleh membatalkan,
    sampai kapan, dan bagaimana pengembalian dana QRIS?
3.  **Keterlambatan:** apakah waktu bermain tetap berakhir sesuai jadwal
    atau bergeser jika pelanggan terlambat?
4.  **Perpanjangan durasi:** apakah pelanggan dapat memperpanjang sesi
    jika unit berikutnya belum dipesan?
5.  **Durasi selain paket:** apakah hanya tersedia 1, 3, dan 4 jam, atau
    ada tarif untuk 2 jam dan durasi lainnya?
6.  **Pesanan makanan:** diputuskan dibayar langsung lewat QRIS (mode
    simulasi tersedia), bukan digabung ke tagihan akhir.
7.  **Identitas meja:** apakah nomor meja memang 01--08 sesuai
    PS01--PS08?
8.  **Akun staf:** apakah hanya pemilik yang mengakses dashboard, atau
    ada kasir/petugas yang memerlukan akun terpisah?
9.  **Kontak usaha:** nomor WhatsApp, alamat lengkap, tautan Google
    Maps, dan akun media sosial untuk ditampilkan di website.
10. **Branding:** logo EVO Gaming, foto tempat, foto unit PS, dan foto
    produk menu.

------------------------------------------------------------------------

## 19. Rekomendasi Prioritas Versi Pertama (MVP)

Agar website dapat segera digunakan, prioritaskan:

1.  Beranda dan katalog 8 unit PS.
2.  Ketersediaan unit berdasarkan tanggal, jam, dan durasi.
3.  Booking online tanpa akun pelanggan.
4.  QRIS otomatis melalui payment gateway.
5.  Booking langsung melalui dashboard admin.
6.  Dashboard pengelolaan status PS dan booking.
7.  Menu makanan/minuman, stok, dan pesanan berdasarkan nomor meja.
8.  Pembaruan real-time untuk ketersediaan dan status pesanan.
9.  Laporan transaksi dasar.

Fitur tambahan seperti program loyalitas, voucher, ulasan pelanggan,
notifikasi WhatsApp otomatis, dan analitik lanjutan dapat masuk versi
berikutnya.

------------------------------------------------------------------------

## 20. Kesimpulan

Website EVO Gaming Rental PS 4 Banjarmasin direncanakan sebagai sistem
operasional terpadu untuk rental PS, booking, pembayaran QRIS, serta
pemesanan makanan dan minuman. Fokus utama pengembangan adalah
pengalaman pelanggan yang cepat di HP, ketersediaan unit yang akurat
secara real-time, transaksi yang aman, dan dashboard yang mudah
digunakan pemilik.

**Prinsip paling penting:** status ketersediaan, konfirmasi pembayaran,
dan pencegahan double booking harus ditangani di sisi server. Tampilan
real-time membantu pelanggan melihat kondisi terbaru, tetapi database
dan aturan transaksi server tetap menjadi sumber kebenaran.

------------------------------------------------------------------------

## 21. Catatan Implementasi (Milestone 1 — Walking Skeleton)

Bagian ini mencatat keputusan teknis saat implementasi, tanpa mengubah
kebutuhan bisnis di atas.

### Stack terpasang

- **Next.js 16.4.6** (App Router, TypeScript, React 19) + Tailwind CSS v4.
- **PostgreSQL 18.1** + **Drizzle ORM** (`pg`). Drizzle dipilih agar
  locking dan constraint eksplisit bisa ditulis sebagai SQL.
- Karena mesin tidak memiliki hak admin, Node dan PostgreSQL dipasang
  portabel di `%LOCALAPPDATA%\evo-gaming-tools`. Cluster lokal berjalan
  di **127.0.0.1:5433**, database `evo_gaming`.

### Aturan bisnis yang sudah dikodekan

- 8 unit PS01–PS08, masing-masing 1 meja + 2 kursi.
- Jam operasional 10.00–24.00 **WITA**; booking harus selesai paling
  lambat 00.00 dan hanya untuk hari yang sama.
- Harga hanya paket: 1 jam Rp10.000, 3 jam Rp25.000, 4 jam Rp35.000.
  Harga disalin ke `bookings.rental_price` saat booking dibuat.
- Tanpa akun pelanggan. Cek booking memerlukan kode booking **dan**
  nomor WhatsApp.
- Booking online hanya **QRIS**. Tunai hanya melalui admin (walk-in),
  dicatat `confirmed` + `unpaid` tanpa masa tahan.
- Pencegahan double booking di server: `pg_advisory_xact_lock(ps_unit_id)`
  + query overlap dalam satu transaksi, ditambah exclusion constraint
  `bookings_no_overlap_confirmed` untuk status `confirmed`/`in_use`.
- Slot QRIS ditahan 15 menit (`hold_expires_at`). Hold kedaluwarsa
  dilepas otomatis saat endpoint ketersediaan/booking dipanggil.

### Pembayaran

- Mode pembayaran diatur lewat `PAYMENT_MODE`:
  - **`mock`** — QRIS disimulasikan. Halaman booking menampilkan **QR
    dummy** dan tombol **Simulasi Bayar Berhasil**. Tombol memanggil
    `POST /api/payments/[reference]/mock`, yang menjalankan
    `handlePaymentEvent` seperti webhook sungguhan sehingga transaksi
    menjadi `paid` dan booking otomatis `confirmed`.
  - **`gateway`** (atau kosong) — jalur simulasi ditutup; halaman booking
    menampilkan bahwa gateway QRIS belum dikonfigurasi. Ini default aman
    sebelum akun merchant tersedia.
- Webhook HMAC (`x-mock-signature`) tetap tersedia untuk menguji callback:
  idempotensi memakai `payment_events.event_id` yang unik dan nominal
  diverifikasi terhadap `payments.amount`.
- Integrasi gateway nyata (Midtrans/Xendit) belum dilakukan; struktur
  webhook sudah disiapkan agar tinggal mengganti verifikasi signature
  dan payload, lalu set `PAYMENT_MODE=gateway`.

### Admin

- Login bcrypt + JWT (jose) dalam cookie httpOnly `evo_admin_session`.
- Halaman: dashboard, daftar booking, booking langsung (walk-in).
- Akun awal dari seed: `owner@evogaming.local` / `evoOwner123`.
  **Wajib diganti sebelum produksi** lewat `ADMIN_PASSWORD` + `npm run db:seed`.

### Operasional database

- `npm run db:start | db:stop | db:status` mengelola cluster portabel.
  Start dijalankan lewat `Start-Process -WindowStyle Hidden` supaya postgres
  hidup tanpa jendela terminal yang terlihat (Windows Terminal adalah
  console host default di mesin ini).
- Migrasi: `npm run db:generate` lalu `npm run db:migrate`
  (`drizzle-kit push` tidak andal di lingkungan ini).
- Seed: `npm run db:seed` (idempoten untuk unit, meja, admin, setting,
  produk, dan exclusion constraint).

### Verifikasi

- `npm run check` (ESLint + TypeScript) dan `npm run build` lulus.
- `npm run smoke` menguji ketersediaan, race booking bersamaan,
  batas tengah malam, pembayaran mock, idempotensi webhook, dan auth
  admin terhadap server yang berjalan.

------------------------------------------------------------------------

## 22. Catatan Implementasi (Milestone 2 — Menu, Pesanan, Laporan)

Modul F&B mengikuti §9, §13, dan §15. Tidak ada perubahan pada aturan
booking/rental di Milestone 1.

### Alur pesanan

- Pelanggan membuka `/menu`, memilih produk, lalu memilih **nomor meja**
  atau memasukkan **kode booking** yang sudah aktif (`confirmed`/`in_use`).
  Bila kode booking dipakai, meja diambil dari unit yang terhubung agar
  pesanan tidak salah antar.
- Pesanan disimpan dengan kode `ORD-XXXXXX`; pelanggan dapat memantau
  status di `/order/[kode]` (polling 10 detik).
- Status mengikuti §9.3: `new → confirmed → processing → ready →
  delivering → completed`, ditambah `cancelled`. Pesanan final tidak bisa
  diubah statusnya lagi (status pembayaran masih bisa).
- Pembayaran F&B memakai jalur QRIS yang sama dengan booking: pesanan
  dibuat dengan `payment_status = 'pending'` dan satu baris `payments`
  (`food_order_id`, metode `qris`). Halaman `/order/[kode]` menampilkan QR
  dummy dan tombol **Simulasi Bayar Berhasil** saat `PAYMENT_MODE=mock`;
  klik tombol menjalankan `handlePaymentEvent` sehingga pembayaran lunas
  dan `food_orders.payment_status = 'paid'`.
- Pesanan yang belum dibayar dibatalkan otomatis setelah 15 menit
  (`FOOD_PAYMENT_HOLD_MINUTES`), stok dikembalikan, dan baris pembayaran
  menjadi `expired`. Admin tetap bisa menandai lunas untuk pembayaran tunai
  di kasir; status pembayaran terkait ikut disinkronkan.

### Tampilan

- Font self-hosted di `public/fonts/`: **Chakra Petch** untuk judul dan
  **Plus Jakarta Sans** untuk teks, dimuat lewat `@font-face` di
  `src/app/globals.css`.
- Ilustrasi stik PS4 dibuat sebagai komponen SVG interaktif
  (`src/components/gamepad-art.tsx`): stik analog bisa digeser dan kembali
  ke tengah, tombol wajah/D-pad/PS menyala saat ditekan.
- Tombol 3D: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, dan `.nav-btn`
  punya bayangan bawah (timbul), turun saat `:active` (tenggelam), plus
  `filter: hue-rotate()` supaya warnanya ikut berubah ketika ditekan.
- Setiap halaman (publik maupun admin) menampilkan tombol kecil
  **Beranda** di kiri bawah (`src/components/back-to-home.tsx` dari root
  layout); tombol muncul bertahap setelah halaman selesai dimuat dan
  hanya disembunyikan di `/`.
- Foto menu ada di `public/menu/` dan dikaitkan lewat
  `products.image_url`; `npm run db:seed` memetakan foto ke menu mie dan
  minuman.

### Stok

- Stok **dikurangi saat pesanan dibuat** di dalam transaksi dengan
  `SELECT ... FOR UPDATE` pada baris produk (diurutkan berdasarkan id agar
  tidak deadlock). Ini mencegah overselling saat banyak pesanan bersamaan.
- Pembatalan pesanan mengembalikan stok item terkait. Perubahan stok manual
  oleh admin dicatat di `audit_logs`.
- Produk bisa ditandai tidak tersedia tanpa menghapus data historis.
- Admin dapat **menambah, mengedit, dan menghapus** produk dari
  `/admin/menu`, termasuk mengisi/mengganti foto (`products.image_url`).
  Menghapus produk mengosongkan `food_order_items.product_id`; baris
  pesanan lama tetap menyimpan nama dan harga saat dipesan.

### Harga paket yang bisa diubah

- Paket harga disimpan di `business_settings` dengan key `packages`.
  Admin dapat **menambah, menghapus, dan mengubah** durasi (1–14 jam) serta
  nominal harga; kode paket diturunkan dari durasi (`PKG1`, `PKG2`, …).
- Halaman `/admin/pricing` (`GET/PUT /api/admin/packages`) memakai
  `DEFAULT_PACKAGES` sebagai nilai awal bila setting belum ada. Setiap
  perubahan dicatat di `audit_logs` (`settings.packages`).
- Booking baru memakai daftar dan harga terbaru; booking lama tetap memakai
  `rental_price` yang tersimpan saat dibuat.

### Halaman dan API

- Publik: `/menu`, `/order` (pencarian kode), `/order/[kode]`,
  `GET /api/products`, `POST /api/orders`, `GET /api/orders/[kode]`.
- Admin: `/admin/orders` (antrean live), `/admin/menu` (produk & stok),
  `/admin/pricing` (harga paket), `/admin/reports` (rental vs F&B),
  `GET/PATCH /api/admin/orders`, `GET/POST /api/admin/products`,
  `PATCH/DELETE /api/admin/products/[id]`, `GET/PUT /api/admin/packages`.
- Dashboard admin menampilkan pesanan aktif, pendapatan F&B hari ini, dan
  produk dengan stok menipis.

### Laporan

- Rentang tanggal memakai batas hari **WITA** (`+08:00`), inklusif pada
  tanggal akhir, maksimal 366 hari.
- Pendapatan dipisah antara rental dan F&B; hanya transaksi `paid` yang
  dihitung sebagai pendapatan, sedangkan nilai belum lunas ditampilkan
  terpisah. Pesanan `cancelled` tidak dihitung.
- Panel **real-time**: total pendapatan, split sumber (PS online, PS
  walk-in, F&B), dan daftar pembayaran terbaru disegarkan lewat
  `GET /api/admin/reports/live` setiap 10 detik tanpa reload halaman.
- **Histori** di halaman yang sama menampilkan seluruh booking PS dan
  pesanan F&B dalam rentang tanggal (maksimal 300 baris per tabel).

### Jam real-time dan kode tersimpan

- `/booking` dan `/menu` menampilkan jam WITA yang berdetak tiap detik
  (`src/components/live-clock.tsx`); halaman status menampilkan stempel
  "Dibuat" sampai detik.
- Setiap kode yang dibuka pelanggan (`/booking/[kode]`, `/order/[kode]`,
  atau hasil cek booking yang valid) disimpan di `localStorage`
  (`evo.savedCodes.v1`, maksimal 8, terbaru di depan).
- Pada `/cek` dan `/order`, kode tersimpan tampil sebagai chip berkilau di
  atas tombol **Beranda**; klik chip membuka statusnya
  (`/cek?code=…` atau `/order/…`) dan tombol × menghapusnya.

### Verifikasi

- `npm run check` dan `npm run build` lulus.
- `npm run smoke` diperluas: daftar produk publik, pembuatan pesanan,
  subtotal dari harga server, pengurangan stok, penolakan stok kurang,
  antrean admin, konfirmasi/pembayaran, pembatalan, dan pengembalian stok.
