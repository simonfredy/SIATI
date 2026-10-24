# 🏥 SIATI — Sistem Informasi & Aduan Terpadu TI Rumah Sakit
### Platform Helpdesk & Ticketing Insiden Medis Terpadu

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.11+-003545?style=flat&logo=mariadb)](https://mariadb.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=flat&logo=nginx)](https://nginx.org/)
[![Motion](https://img.shields.io/badge/Motion-v12-f43f5e?style=flat)](https://motion.dev/)

---

## 📌 1. Apa Itu SIATI?

**SIATI** *(Sistem Informasi & Aduan Terpadu TI)* adalah platform helpdesk dan penanganan insiden digital operasional medis yang dirancang secara universal untuk seluruh **Rumah Sakit (RSUD, RSUP, RS Swasta, maupun RS Pemerintah)**.

### 🎯 Latar Belakang Masalah
Sebelum adanya SIATI, pelaporan gangguan SIMRS, printer label resep, PC unit poliklinik, dan jaringan internet dilakukan secara sporadis melalui grup WhatsApp atau panggilan telepon. Akibatnya:
* Aduan sering tertumpuk, terlewat, atau lambat ditindaklanjuti.
* Waktu respon dan waktu penyelesaian teknisi tidak tercatat secara objektif.
* Tidak ada riwayat data kerusakan perangkat keras untuk bahan evaluasi belanja aset.
* Gangguan kritis di ruangan darurat (seperti **IGD** atau **Kamar Operasi / OK**) tidak terbedakan prioritasnya dari keluhan non-kritis.

### 💡 Solusi yang Dihadirkan
SIATI mentransformasi alur kerja bantuan TI rumah sakit menjadi sistem terpusat, transparan, dan akuntabel berbasis web responsif (*Mobile-First*) dengan fitur unggulan:
1. **Prioritas & Skala Urgensi Medis**:
   * **P1 - Darurat (EMERGENCY)**: Khusus insiden kritis penyelamatan pasien di IGD, OK, ICU, dan Farmasi dengan indikator visual *breathing pulse* merah.
   * **P2 - Tinggi (HIGH)**: Layanan rawat inap & poliklinik ramai.
   * **P3 - Sedang (MEDIUM)**: Masalah operasional umum.
   * **P4 - Rendah (LOW)**: Permintaan penunjang non-mendesak.
2. **Stopwatch Pengerjaan Presisi Menit (SLA Tracking)**:
   * **MTTA** (*Mean Time to Acknowledge*): Stopwatch waktu respon dari tiket dibuat hingga teknisi mengambil tiket.
   * **MTTR** (*Mean Time to Repair*): Stopwatch waktu pengerjaan fisik di lokasi (dilengkapi jeda jika menunggu suku cadang/part).
3. **Analitik Eksekutif Manajemen**:
   * Dashboard scorecard 6 indikator utama, peta konsentrasi kerusakan (*Heatmap Ruangan*), matriks evaluasi kinerja staf TI (SKP), dan ekspor rekapitulasi ke format Excel & PDF Resmi.
4. **Sinkronisasi Data Real-Time (Server-Sent Events / SSE)**:
   * Pembaruan data tiket secara instan tanpa perlu memuat ulang (*reload*) halaman peramban.
5. **Animasi Modern Berbasis Motion (`motion/react`)**:
   * Angka indikator bergulir dinamis (*rolling number counters*), transisi tab mulus, dialog pop-up pegas (*spring*), dan interaksi sentuh responsif.
6. **Keamanan Data Kesehatan Standar Rumah Sakit**:
   * Enkripsi sandi Bcrypt Cost Factor 12, pembatasan serangan brute-force (*Rate Limiting*), proteksi bot (*Dual-Mode CAPTCHA*), dan pengamanan berkas bukti foto/video via Nginx `X-Accel-Redirect`.

---

## 👥 2. Peran Pengguna & Hak Akses (RBAC)

| Peran (Role) | Target Pengguna | Fitur & Akses Utama |
| :--- | :--- | :--- |
| **`STAFF_USER`** | Dokter, Perawat, Bidan, Apoteker, Kasir | Form laporan kendala cepat, unggah foto/video bukti kerusakan, pemantauan status tiket aktif, ulasan bintang kepuasan layanan (CSAT). |
| **`IT_STAFF`** | Teknisi Lapangan, Helpdesk SIMRS | Meja kerja terpadu (*Unified IT Workbench*), ambil tiket antrean seluruh RS, stopwatch pengerjaan, kontrol jeda sparepart, penentuan tingkat urgensi. |
| **`SUPERADMIN`** | Administrator Sistem & Infrastruktur TI | Master data ruangan/bangsal, manajemen akun NIP & reset sandi, pengaturan target SLA menit, pantauan log audit forensik, kendali tiket, dan **Dual-View Switcher** ke Portal Manajemen. |
| **`MANAGEMENT`** | Manajemen Rumah Sakit | Scorecard 6 KPI eksekutif, heatmap kendala ruangan, matriks produktivitas staf (SKP), audit forensik tiket, filter tanggal mandiri, dan ekspor laporan cetak/CSV. |

---

## 🛠️ 3. Arsitektur & Teknologi (Tech Stack)

```
[ Klien (Ponsel Nakes / Tablet / Laptop Staf) ]
                     │ HTTPS (Port 443) / WSS
                     ▼
[ Nginx Reverse Proxy + SSL Let's Encrypt ]
  ├─ Anti-DDoS & Rate Limiting Zones
  ├─ Server-Sent Events (SSE) Buffering Bypass
  └─ X-Accel-Redirect Protected Storage (/var/siati/media)
                     │ Proxy HTTP (Port 3000)
                     ▼
[ Node.js + Next.js 16 App Router (Turbopack) ]
  ├─ React 19 + TypeScript + Motion v12
  ├─ Server Actions + Zod Validation
  ├─ JWT Auth via HTTP-Only Secure Cookies
  └─ Prisma ORM Client
                     │ SQL Connection (Port 3306)
                     ▼
[ MariaDB 10.11+ / MySQL Database Server ]
```

---

## 💻 4. Panduan Menjalankan di Lingkungan Lokal (Development)

### Prasyarat Sistem
* **Node.js**: Versi `20.x` LTS atau lebih baru.
* **Database**: MariaDB 10.11+ atau MySQL 8.0+ (tersedia melalui **Laragon** atau **XAMPP**).
* **Git**: Versi terbaru.

### Langkah-langkah Instalasi Lokal

1. **Clone Repository & Buka Folder Proyek**:
   ```bash
   git clone https://github.com/simonfredy/SIATI.git
   cd SIATI
   ```

2. **Instalasi Dependensi Node.js**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable (`.env`)**:
   Salin berkas contoh konfigurasi:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan parameter database lokal pada `.env`:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/siati_db"
   JWT_SECRET="siati_hospital_ticketing_super_secure_jwt_secret_2026_xyz"
   JWT_EXPIRES_IN="1d"
   CAPTCHA_MODE="offline"
   MEDIA_UPLOAD_DIR="C:/laragon/www/SIATI/uploads"
   MAX_FILE_SIZE_MB=60
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Migrasi Database & Seeding Data Awal**:
   Pastikan service MySQL di Laragon/XAMPP sudah berjalan, lalu jalankan:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

### 🔑 Akun Percontohan Default (Hasil Seeding)
* **Super Admin**: Username `admin` | Password `Password123!` (atau `admin` jika menggunakan bypass dev)
* **Manajemen**: Username `manajemen` (atau `direksi`) | Password `Password123!`
* **Staf TI**: Username `operator` atau `rian` | Password `Password123!`
* **Staf Medis / Nakes**: Username `siti` | Password `Password123!`

---

## 🚀 5. Panduan Lengkap Deployment ke Server Produksi (Linux Server)

Panduan berikut mengasumsikan deployment pada **Ubuntu Server 22.04 LTS / 24.04 LTS** menggunakan **Nginx**, **Node.js 20**, **PM2**, dan **MariaDB**.

### Langkah 1: Persiapan Server & Paket Pendukung
Perbarui repository server dan pasang perkakas yang dibutuhkan:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx mariadb-server certbot python3-certbot-nginx
```

Pasang Node.js 20 LTS melalui NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

### Langkah 2: Konfigurasi Database MariaDB
Jalankan wizard pengamanan MariaDB:
```bash
sudo mysql_secure_installation
```

Masuk ke konsol MariaDB dan buat database beserta user khusus SIATI:
```sql
sudo mysql -u root -p
```
Jalankan query berikut:
```sql
CREATE DATABASE siati_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'siati_user'@'localhost' IDENTIFIED BY 'PasswordSangatKuatDanRahasia2026!';
GRANT ALL PRIVILEGES ON siati_db.* TO 'siati_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Langkah 3: Setup Direktori Aplikasi & Media Storage
Buat folder penyimpanan media yang aman dan folder aplikasi:
```bash
# Folder media terisolasi (diluar web root)
sudo mkdir -p /var/siati/media
sudo chown -y www-data:www-data /var/siati/media
sudo chmod 750 /var/siati/media

# Folder aplikasi di /var/www/siati
sudo mkdir -p /var/www/siati
sudo chown -R $USER:$USER /var/www/siati
```

Clone source code ke direktori produksi:
```bash
git clone https://github.com/simonfredy/SIATI.git /var/www/siati
cd /var/www/siati
npm install --omit=dev
```

---

### Langkah 4: Konfigurasi `.env` Lingkungan Produksi
Buat berkas `.env` di `/var/www/siati/.env`:
```bash
nano /var/www/siati/.env
```
Isi konfigurasi produksi:
```env
# Koneksi Database MariaDB Lokal Server
DATABASE_URL="mysql://siati_user:PasswordSangatKuatDanRahasia2026!@localhost:3306/siati_db"

# JWT Token Secret (Wajib String Acak Minimal 32 Karakter)
JWT_SECRET="ganti_dengan_kunci_acak_64_karakter_openssl_rand_base64_32"
JWT_EXPIRES_IN="1d"

# CAPTCHA Protection
CAPTCHA_MODE="offline"
CAPTCHA_SECRET_KEY="kunci_rahasia_hmac_captcha_produksi_rumah_sakit"

# Lokasi Storage Media Terlindung (Nginx X-Accel-Redirect)
MEDIA_UPLOAD_DIR="/var/siati/media"
MAX_FILE_SIZE_MB=60

# Domain Resmi Aplikasi
NEXT_PUBLIC_APP_URL="https://siati.rumahsakit.co.id"
NODE_ENV="production"
```

---

### Langkah 5: Sinkronisasi Skema Database & Build Produksi
Generate client Prisma, terapkan skema tabel, dan lakukan build bundle produksi:
```bash
cd /var/www/siati
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build
```

---

### Langkah 6: Menjalankan Aplikasi dengan PM2 Process Manager
Jalankan instance aplikasi Next.js di background menggunakan PM2:
```bash
cd /var/www/siati
pm2 start npm --name "siati-app" -- start

# Simpan konfigurasi PM2 agar auto-start saat server reboot
pm2 save
pm2 startup
```
*(Jalankan perintah startup yang dihasilkan oleh terminal).*

Periksa status proses:
```bash
pm2 status
```

---

### Langkah 7: Konfigurasi Nginx Reverse Proxy & Server Hardening
Salin berkas konfigurasi Nginx yang telah disiapkan di repositori:
```bash
sudo cp /var/www/siati/deploy/nginx/siati.conf /etc/nginx/sites-available/siati.conf
```

Aktifkan konfigurasi Nginx via symlink:
```bash
sudo ln -s /etc/nginx/sites-available/siati.conf /etc/nginx/sites-enabled/
```

*Catatan: Pastikan nama domain pada blok `server_name` di `/etc/nginx/sites-available/siati.conf` sesuai dengan domain server rumah sakit (misal: `siati.rumahsakit.co.id`).*

Uji sintaks Nginx dan muat ulang:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Langkah 8: Pasang Sertifikat SSL Gratis (Let's Encrypt HTTPS)
Amankan sambungan domain dengan sertifikat SSL TLS otomatis:
```bash
sudo certbot --nginx -d siati.rumahsakit.co.id
```
Pilih opsi **Redirect HTTP to HTTPS (otomatis)**. Certbot akan memperbarui sertifikat secara berkala via cron job.

---

### Langkah 9: Konfigurasi Firewall Server (UFW)
Buka hanya port yang diperlukan:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🛡️ 6. Fitur Keamanan Terpasang (Enterprise Security)

1. **Proteksi Akses Media (`X-Accel-Redirect`)**:
   * File foto dan video bukti kerusakan di `/var/siati/media` **tidak dapat diakses langsung oleh publik**. Setiap request wajib melalui otentikasi route handler Next.js yang memverifikasi sesi aktif sebelum Nginx melayani file.
2. **Mitigasi Serangan DoS & Brute Force**:
   * Rate limiting pada Nginx membatasi percobaan login maksimal **5 request/menit per alamat IP** untuk mencegah pembobolan akun nakes.
3. **Anti-Bot Gate (Dual-Mode)**:
   * Mendukung mode **Offline Math Challenge (SVG)** saat jaringan intranet rumah sakit terisolasi tanpa internet, maupun **Cloudflare Turnstile** saat terhubung online.
4. **Header Keamanan Ketat**:
   * Dilengkapi `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan `Strict-Transport-Security` (HSTS).

---

## 📋 7. Pemeliharaan & Operasional Berkala

### 🔄 Alur Pembaruan Kode (Deploy Update Versi Baru)
Jika terdapat pembaruan kode dari git:
```bash
cd /var/www/siati
git pull origin main
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build
pm2 reload siati-app
```

### 💾 Backup Otomatis Database Harian
Buat cron job harian untuk mencadangkan database:
```bash
crontab -e
```
Tambahkan baris berikut (backup setiap pukul 02:00 dini hari):
```cron
0 2 * * * mysqldump -u siati_user -p'PasswordSangatKuatDanRahasia2026!' siati_db | gzip > /var/backups/siati_db_$(date +\%F).sql.gz
```

---

## 📄 Lisensi
Hak Cipta © 2026 **SIATI - Sistem Informasi Aduan TI Rumah Sakit**. Dilindungi undang-undang.
Dikembangkan untuk efisiensi mutu pelayanan dan keandalan operasional fasilitas teknologi informasi rumah sakit.
