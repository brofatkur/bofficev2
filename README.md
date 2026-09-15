# bofficev2 - Office Lease CRM & Smart Meeting Room Suite

Aplikasi web manajemen penyewaan kantor fisik (bulanan & tahunan), virtual office (tahunan), CRM sales lead, invoicing, manajemen kontrak dengan reminder perpanjangan via WhatsApp (KirimDev API), serta portal publik daftar hadir dan live stopwatch meeting room booking.

## 🚀 Fitur Utama

- **Dashboard Real-time**: Statistik kontrak aktif, closing rate sales, total pendapatan lunas, dan alert masa sewa berakhir.
- **CRM Sales Pipeline**: Manajemen lead, status closing (`Prospek`, `Contacted`, `Negotiation`, `Closing (Won)`, `Belum Closing`), dan 1-click konversi lead menjadi customer aktif.
- **Katalog Kantor & Virtual Office**: Ruang kantor fisik (bulanan & tahunan) dan paket Virtual Office tahunan dengan kuota meeting room 8 jam/bulan gratis.
- **Meeting Room Booking & Quota Tracker**:
  - Kuota gratis 8 jam/bulan per penyewa.
  - Perhitungan overage otomatis (Rp 90.000 / jam jika melebihi kuota).
  - 1-click penerbitan invoice biaya overage.
- **Portal Publik Daftar Hadir (`/attendance`)**:
  - Auto-fill data nama & lembaga berdasarkan nomor HP pengunjung lama.
  - Input manual untuk pengunjung baru.
  - Tombol **Masuk Ruangan (Check In)** & live stopwatch waktu berjalan.
  - Tombol **Keluar Ruangan (Check Out)** yang otomatis menghitung durasi dan mengirimkan ringkasan pemakaian ke WhatsApp pengunjung via KirimDev.
  - Generator & cetak QR Code Check-In untuk dipasang di pintu meeting room.
- **Invoicing & Pembayaran**: Penerbitan invoice sewa & overage, filter status pembayaran, modal cetak/print PDF faktur, dan kirim tagihan via WhatsApp.
- **WhatsApp Integration (KirimDev API)**: Pengingat perpanjangan kontrak otomatis (batch & manual), pengiriman invoice, notifikasi check-out meeting room, dan audit log riwayat pesan.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, React, TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **WhatsApp Cloud API**: KirimDev REST API (`https://api.kirimdev.com/v1/...`)
- **Data Engine**: JSON-backed SQLite/File Data Store

## 📦 Menjalankan Proyek Secara Lokal

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan server development**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

3. **Build untuk produksi**:
   ```bash
   npm run build
   npm run start
   ```
