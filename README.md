# 🏐 Akademi Bola Voly Smart  - Sistem Manajemen & Smart Reminder

Aplikasi Web Manajemen Akademi Bola Voli modern dan responsif berbasis **Next.js 16 (App Router)**, **TypeScript**, dan **Tailwind CSS**. Dirancang khusus untuk mempermudah operasional pengurus akademi voli, pelatih lapangan, atlet, dan wali murid.

---

## 🌟 Fitur Utama

### 1. 👥 Pencatatan Anggota & Atlet
- Data lengkap atlet bola voli: No Registrasi (NIS), Nama Lengkap, Posisi Spesialisasi (*Setter/Tosser*, *Outside Hitter/Open Spiker*, *Opposite Hitter*, *Middle Blocker/Quicker*, *Libero*, *All-Round*).
- Kelompok umur: **U-12** (Dini), **U-15** (Pemula), **U-18** (Remaja/Taruna), dan **Senior**.
- Data fisik: Nomor Jersey, Tinggi Badan (cm), Berat Badan (kg), Status Keaktifan (Aktif, Cedera, Non-Aktif).
- Kontak WhatsApp Atlet dan Nomor WhatsApp Orang Tua / Wali Murid dengan tombol langsung *Click-to-Chat*.

### 2. 📝 Absensi Kehadiran Latihan
- Pemilihan sesi latihan dari jadwal yang tersedia.
- Status kehadiran per atlet: **Hadir**, **Izin**, **Sakit**, dan **Alpa**.
- Fitur **"Tandai Cepat Semua Hadir"** untuk mempercepat input pelatih saat di lapangan.
- Kolom catatan evaluasi teknis lapangan (contoh: *"Passing bawah stabil"*, *"Servis mengambang tajam"*).
- Rekapitulasi visual jumlah atlet hadir, izin, sakit, dan tanpa keterangan.

### 3. 💳 Pembayaran Kas Bulanan & Kuitansi Digital
- Matriks pembayaran 12 bulan (**Januari - Desember**) per atlet dengan indikator warna visual status lunas.
- Pencatatan pembayaran: Nominal (default Rp 75.000 / fleksibel), metode bayar (**Tunai**, **Transfer Bank**, **QRIS**), tanggal bayar, dan catatan.
- **Kuitansi Digital Otomatis**: Generator kuitansi resmi siap cetak (*Print*) serta tombol **"Kirim Kuitansi ke WA"** langsung ke WhatsApp atlet/wali.
- Pembayaran otomatis sinkron dan tercatat ke pembukuan kas masuk.

### 4. 💰 Laporan Keuangan Kas (Arus Kas Masuk & Keluar)
- Rekapitulasi keuangan real-time: **Total Saldo Kas Terkini**, **Total Pemasukan**, dan **Total Pengeluaran**.
- Pencatatan mutasi kas:
  - *Pemasukan*: Iuran kas bulanan, pendaftaran anggota baru, sponsor, hadiah kejuaraan, penjualan merchandise.
  - *Pengeluaran*: Sewa lapangan/GOR, pengadaan bola voli (Mikasa/Molten), net, honor pelatih, konsumsi, dan medis P3K (kinesio tape, spray dingin).
- Filter transaksi berdasarkan bulan dan jenis kas (Pemasukan/Pengeluaran).
- Tombol **Cetak Laporan Keuangan** untuk pertanggungjawaban kepada pengurus dan wali murid.

### 5. 📢 Berita, Agenda & Pengumuman
- Publikasi agenda kejuaraan/turnamen antar klub, seleksi porda/kejurda, dan jadwal libur.
- Tag kategori: **AGENDA**, **PENGUMUMAN**, **PRESTASI**, dan **BERITA**.
- Fitur *Pinned Post* (sematkan di posisi teratas).

### 6. ⏰ Smart WhatsApp Reminder (Otomatis 4 Jam Sebelum Latihan)
- **Deteksi Waktu Otomatis**: Background service mendeteksi jadwal latihan yang akan dimulai dalam rentang **&le; 4 jam** dari waktu sekarang.
- **Pesan Personal**: Template otomatis mengisi nama atlet, kategori kelompok umur, hari/tanggal, jam latihan, lokasi GOR, nama pelatih, dan materi latihan.
- **Multi-Penyedia Gateway**:
  - `SIMULATOR`: Mode uji coba langsung jalan tanpa token API (aman untuk demo/development).
  - `FONNTE`: Integrasi resmi WhatsApp Gateway Fonnte API Indonesia.
  - `WAHA`: Integrasi WhatsApp HTTP API mandiri.
- **Direct Web Click-to-Chat**: Tombol kirim manual via link `https://wa.me/...` langsung membuka WhatsApp Web atau aplikasi WhatsApp di HP.
- **Riwayat Pengiriman**: Log status terkirim secara transparan.

### 7. 👑 Multi-Role Persona Switcher
Pengguna dapat beralih peran dengan 1 klik pada header navigasi:
- **Admin / Pengurus**: Akses menyeluruh (anggota, kas, keuangan, jadwal, berita, setting gateway).
- **Pelatih (Coach)**: Fokus pada absensi latihan, jadwal lapangan, evaluasi atlet, dan pengumuman.
- **Anggota / Atlet / Wali**: Portal khusus atlet untuk melihat jadwal latihan terdekat, status absensi diri, riwayat iuran kas bulanan pribadi, dan berita akademi.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi saat ini telah aktif berjalan di komputer Anda pada:
```bash
http://localhost:3002
```

Jika server dimatikan, Anda dapat menjalankannya kembali kapan saja dengan perintah:
```bash
npm.cmd run dev
```

---

## 📁 Struktur Direktori Utama

- `src/app/` : Halaman rute Next.js App Router
  - `/` : Dashboard ringkasan & alert reminder
  - `/anggota` : Manajemen data atlet bola voli
  - `/jadwal` : Jadwal latihan & countdown waktu latihan
  - `/absensi` : Absensi kehadiran & evaluasi lapangan
  - `/kas` : Matriks kas bulanan & kuitansi pembayaran
  - `/keuangan` : Laporan arus kas & mutasi keuangan
  - `/berita` : Publikasi berita & agenda turnamen
  - `/reminder` : Pengaturan WhatsApp Gateway & tester
- `src/lib/storage.ts` : Database persisten lokal (`data/volleyball_db.json`)
- `src/lib/whatsapp.ts` & `src/lib/whatsapp-utils.ts` : Mesin pengingat WhatsApp & generator pesan
- `src/context/RoleContext.tsx` : Sistem switching multi-role (Admin, Pelatih, Anggota)
