# 🏥 SIATI — Sistem Informasi & Aduan Terpadu TI Rumah Sakit
### Platform Helpdesk & Ticketing Insiden Medis Berstandar SLA Rumah Sakit

[![Node.js](https://img.shields.io/badge/Node.js-20_%7C_22_%7C_24+-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.11+-003545?style=flat&logo=mariadb)](https://mariadb.org/)
[![Apache](https://img.shields.io/badge/Apache-HTTP_Server-D22128?style=flat&logo=apache)](https://httpd.apache.org/)
[![PM2](https://img.shields.io/badge/PM2-Process_Manager-2B037A?style=flat&logo=pm2)](https://pm2.keymetrics.io/)

---

## 📌 1. Apa Itu SIATI?

**SIATI** (*Sistem Informasi & Aduan Terpadu TI*) adalah platform terpadu penanganan insiden, perbaikan perangkat, dan kendala operasional fasilitas teknologi informasi yang dirancang khusus untuk lingkungan **Rumah Sakit (RSUD, RSUP, RS Swasta, maupun RS Khusus)**.

Sistem ini menjembatani komunikasi antara **Tenaga Kesehatan (Nakes)** yang membutuhkan bantuan cepat saat melayani pasien dengan **Tim IT / Teknisi** yang menangani perbaikan, serta menyajikan data performa obyektif untuk **Manajemen Rumah Sakit**.

```
┌─────────────────────────────────┐
│     Tenaga Kesehatan (Nakes)    │
│ "Lapor di grup WA sering teng-  │
│  gelam. Kapan teknisi datang?"  │
└────────────────┬────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│             SIATI (Satu Titik Kendali)                 │
│  • Lapor < 30 detik + Bukti Foto/Video Kamera          │
│  • Stopwatch Menit Respon & Pengerjaan (MTTA & MTTR)   │
│  • Dokumen Berita Acara Perbaikan Sah Bertanda QR Code │
│  • Dashboard Analitik, Peta Kerusakan, & Dokumen Cetak │
└───────▲────────────────────────────────────────▲───────┘
        │                                        │
┌───────┴────────────────────────┐       ┌───────┴────────────────────────┐
│         Staf Teknisi TI        │       │      Top Level Management      │
│ "Sering dituduh lambat, padahal│       │ "Tidak ada data riil berapa    │
│  laporan terlambat sampai.     │       │  lama perbaikan dan unit mana  │
│  Pekerjaan tidak tercatat."    │       │  yang sering rusak."           │
└────────────────────────────────┘       └────────────────────────────────┘
```

---

### 🎯 Masalah yang Diselesaikan (*Pain Points*)
1. **Laporan Sporadis di WhatsApp / Telepon**: Aduan sering tertumpuk di grup chat pribadi, tidak terdokumentasi, dan tidak jelas siapa teknisi yang bertanggung jawab.
2. **Ketiadaan Bukti Visual Kerusakan**: Staf medis kesulitan menjelaskan pesan error SIMRS atau kerusakan hardware tanpa bukti foto/video langsung dari lokasi.
3. **Akuntabilitas & SLA yang Kabur**: Tidak ada data riil berapa menit waktu respon teknisi (*MTTA*) dan berapa menit durasi pengerjaan (*MTTR*).
4. **Insiden Darurat Terabaikan**: Kendala fatal di ruangan kritis (seperti PC henti jantung di IGD, error bridging BPJS V-Claim, atau monitor Kamar Operasi) sering tercampur dengan permintaan kecil non-mendesak.
5. **Ketiadaan Berita Acara Resmi**: Setelah selesai perbaikan, tidak ada dokumen serah terima pekerjaan yang sah antara staf pelapor dan teknisi.

---

### ⭐ Fitur Unggulan Sistem

1. **Pelaporan Insiden Cepat (< 30 Detik)**:
   * Cukup pilih ruangan, kategori masalah, ketik deskripsi singkat, dan lampirkan foto/video kerusakan langsung dari kamera ponsel.
2. **Skala Prioritas Urgensi Medis (P1 - P4)**:
   * 🔴 **P1 - Darurat (EMERGENCY)**: Pelayanan terhenti di IGD, OK, ICU, Farmasi (Target SLA: < 15 Menit).
   * 🟠 **P2 - Tinggi (HIGH)**: Pelayanan rawat inap / poliklinik terganggu (Target SLA: < 30 Menit).
   * 🟡 **P3 - Sedang (MEDIUM)**: Kendala administratif umum (Target SLA: < 60 Menit).
   * 🟢 **P4 - Rendah (LOW)**: Permintaan instalasi software atau pemeliharaan rutin.
   * 🔒 *Kunci Integritas*: Urgensi terkunci permanen saat tiket selesai agar data audit kinerja tidak dapat dimanipulasi.
3. **Stopwatch Pengerjaan Akurat (SLA Tracking)**:
   * **Waktu Respon (MTTA)**: Menghitung menit dari tiket dibuat hingga teknisi mengambil penugasan (*Ambil Tugas*).
   * **Waktu Perbaikan (MTTR)**: Menghitung durasi perbaikan aktif di lokasi, dilengkapi tombol *Jeda* jika menunggu pengadaan suku cadang (*sparepart*).
4. **Dokumen Berita Acara & Laporan Perbaikan (PDF / Cetak)**:
   * Diterbitkan otomatis begitu tiket selesai dan nakes memberikan ulasan bintang kepuasan (CSAT).
   * Dilengkapi **Tanda Tangan Digital QR Code Sejajar** antara Pelapor dan Teknisi TI.
5. **Scorecard Eksekutif Manajemen**:
   * Dashboard 6 KPI utama, heatmap ruangan paling sering rusak, matriks produktivitas staf IT (SKP Grade A/B/C), ekspor data CSV/Excel, dan cetak laporan resmi berformat kop instansi dinamis.
6. **Pusat Diagnostik Jaringan & Server (Super Admin)**:
   * **Jaringan Server & LAN**: Cek kesehatan host (OS, Uptime, RAM/CPU), latensi database MariaDB, serta form uji ping & port TCP ke perangkat ruangan (PC, printer etiket, switch, router) dengan tombol trigger.
   * **Konektivitas API & Web**: Pantau ketersediaan bridging BPJS Kesehatan (V-Claim, Antrean, I-Care, Aplicares), Kemenkes SatuSehat, dan portal faskes secara terpisah.
7. **Ganti Kata Sandi Mandiri (Self-Service Password Management)**:
   * Seluruh role dapat memperbarui kata sandi mandiri dengan validasi visual 4 syarat keamanan secara real-time.
8. **Sinkronisasi Data Real-Time (Server-Sent Events / SSE)**:
   * Perubahan status tiket dan antrean terupdate otomatis di layar pengguna tanpa perlu me-reload peramban.

---

### 👥 Peran Pengguna & Hak Akses

| Peran (Role) | Sasaran Pengguna | Fitur & Akses Utama |
| :--- | :--- | :--- |
| **`STAFF_USER`** | Dokter, Perawat, Bidan, Apoteker, Kasir | Form pelaporan kendala cepat (< 30 detik), unggah foto/video bukti kerusakan, pemantauan status tiket aktif secara real-time, ulasan rating kepuasan (CSAT), unduh/cetak Dokumen Berita Acara tanda tangan QR Code, dan Ganti Kata Sandi Mandiri. |
| **`IT_STAFF`** | Teknisi Lapangan, Helpdesk SIMRS | Meja kerja terpadu (*Unified IT Workbench*), daftar antrean tiket seluruh RS, stopwatch pengerjaan (*Ambil Tugas*, *Menuju Lokasi*, *Mulai Pengerjaan*, *Jeda*, *Selesai*), penerbitan dokumen perbaikan QR Code, dan Ganti Kata Sandi Mandiri. |
| **`MANAGEMENT`** | Direksi & Manajemen Rumah Sakit | Scorecard 6 KPI eksekutif dengan filter tanggal mandiri, heatmap ruangan terpaginasi, matriks kinerja teknisi (SKP Grade A/B/C), audit stopwatch tiket, ekspor CSV UTF-8, cetak laporan berformat kop resmi instansi, dan Ganti Kata Sandi Mandiri. |
| **`SUPERADMIN`** | Administrator Sistem & Jaringan TI | Master data ruangan & zona gedung, kelola akun pegawai (aktif/nonaktif, reset password), pengaturan target SLA, audit log forensik, kendali tiket, profil instansi dinamis, **Diagnostik Jaringan Server & LAN**, **Konektivitas API & Web**, Dual-View ke Manajemen, dan Ganti Kata Sandi Mandiri. |

---

## 🚀 2. Panduan Lengkap Deployment ke Server

Panduan ini ditujukan untuk deployment di server Linux (**Ubuntu 22.04 / 24.04 LTS**, **Debian 12**, atau **Proxmox VE LXC / VM**).

### 📐 Arsitektur Deployment yang Didukung

* **Arsitektur 1 Server**: Apache (Port 80/443 + SSL) dan PM2 Next.js (Port 3000) berada dalam satu server fisik/VM yang sama.
* **Arsitektur 2 Server (Terpisah)**:
  * **Server A (Web Server / Gateway)**: Apache 2.4 menangani domain publik, sertifikat SSL HTTPS (Port 443), dan bertindak sebagai Reverse Proxy.
  * **Server B (Application Server)**: Menjalankan Node.js via PM2 (Port 3000) dan Database MariaDB pada jaringan internal LAN.

> 💡 **Lokasi Folder Proyek**: Anda **bebas meletakkan folder proyek di mana saja** pada Server B (misalnya di home user `/home/ubuntu/SIATI` atau `/opt/SIATI`). Tidak harus di `/var/www` karena Apache hanya meneruskan trafik jaringan (*reverse proxy*), bukan membaca berkas langsung dari harddisk.

---

### 📦 Langkah 1: Instalasi Node.js (v20 / v22 / v24+) & PM2

Aplikasi SIATI mendukung **Node.js v20.x, v22.x, hingga v24.x**. Jalankan perintah ini di server aplikasi:

```bash
# 1. Update paket sistem
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# 2. Pasang repositori resmi NodeSource (Gunakan 24.x atau 20.x / 22.x LTS)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
# (Jika ingin versi LTS lain seperti 20 atau 22, cukup ganti angka 24.x menjadi 20.x atau 22.x)

# 3. Pasang Node.js dan NPM
sudo apt install -y nodejs

# 4. Verifikasi versi
node -v    # Menampilkan v24.x.x (atau v20+ / v22+)
npm -v     # Menampilkan v10.x.x ke atas

# 5. Pasang PM2 secara global
sudo npm install -g pm2
```

---

### 🗄️ Langkah 2: Instalasi & Pengaturan Database MariaDB

Jika database diinstal di server yang sama:

```bash
# 1. Pasang MariaDB Server
sudo apt install -y mariadb-server

# 2. Aktifkan service MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

# 3. Amankan instalasi MariaDB
sudo mariadb-secure-installation
# Ikuti wizard: Buat password root baru, lalu jawab 'Y' untuk semua pertanyaan pengamanan.
```

Masuk ke console MariaDB untuk membuat database dan user khusus SIATI:

```bash
sudo mariadb
```

Jalankan perintah SQL berikut:

```sql
-- Buat database SIATI dengan dukungan UTF-8 penuh
CREATE DATABASE siati_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user khusus aplikasi (Ganti password dengan kata sandi kuat Anda)
CREATE USER 'siati_user'@'localhost' IDENTIFIED BY 'PasswordKuatRS2026!';

-- Berikan hak akses penuh ke database siati_db
GRANT ALL PRIVILEGES ON siati_db.* TO 'siati_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

---

### 📥 Langkah 3: Unduh Proyek & Konfigurasi Berkas `.env`

Masuk ke folder tempat Anda ingin menaruh proyek (misalnya di home direktori user):

```bash
# 1. Masuk ke direktori
cd /home/ubuntu   # Sesuaikan dengan user Anda, misal /home/administrator

# 2. Clone repository SIATI
git clone https://github.com/simonfredy/SIATI.git
cd SIATI

# 3. Pasang dependencies
npm install

# 4. Buat berkas environment (.env)
cp .env.example .env
nano .env
```

Sesuaikan nilai di dalam `.env`:

```env
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
# Jika password mengandung simbol unik: @ diganti %40, # diganti %23, * bisa langsung ditulis atau %2A
DATABASE_URL="mysql://siati_user:PasswordKuatRS2026!@localhost:3306/siati_db"

# JWT Secret (Gunakan random string minimal 32 karakter acak)
JWT_SECRET="siati_hospital_ticketing_super_secure_jwt_secret_2026_xyz"
JWT_EXPIRES_IN="1d"

# CAPTCHA Mode
CAPTCHA_MODE="offline"
CAPTCHA_SECRET_KEY="siati_hmac_captcha_secret_key_change_in_production"

# Direktori Penyimpanan Upload Media Bukti (Gunakan path absolut)
MEDIA_UPLOAD_DIR="/home/ubuntu/SIATI/uploads"
MAX_FILE_SIZE_MB=60

# Domain atau URL Publik Aplikasi
NEXT_PUBLIC_APP_URL="https://siati.rumahsakit.co.id"
```

---

### 🏗️ Langkah 4: Migrasi Database & Seeding Data Awal

Jalankan migrasi skema tabel Prisma dan pengisian master data rumah sakit:
```bash
# 1. Terapkan tabel ke MariaDB (Gunakan tag @6 agar mengunci ke Prisma 6)
npx prisma@6 db push
# (atau: npm run db:push)

# 2. Isi master data ruangan RS, kategori SLA, dan akun percontohan
npx tsx prisma/seed.ts
# (atau: npm run db:seed)
```

> **Akun Default Hasil Seeding**:
> * **Super Admin**: Username `admin` | Password `Password123!`
> * **Manajemen RS**: Username `manajemen` | Password `Password123!`
> * **Teknisi IT**: Username `rian` atau `operator` | Password `Password123!`
> * **Perawat IGD**: Username `siti` | Password `Password123!`

---

### ⚡ Langkah 5: Build & Jalankan Aplikasi dengan PM2

Pastikan aplikasi di-build untuk mode produksi:

```bash
# 1. Build Next.js untuk production
npm run build

# 2. Jalankan dengan konfigurasi PM2 bawaan
pm2 start deploy/ecosystem.config.js

# 3. Simpan state PM2 agar otomatis berjalan saat server reboot
pm2 save
pm2 startup
# (Salin dan jalankan perintah 'sudo env PATH=...' yang dimunculkan PM2 di terminal)
```

> **Catatan jika Server Apache & Server PM2 Terpisah**:  
> Pastikan di `deploy/ecosystem.config.js`, variabel `HOSTNAME: "0.0.0.0"` aktif, dan buka firewall port 3000 untuk IP Server Apache:  
> `sudo ufw allow from <IP_SERVER_APACHE> to any port 3000 proto tcp`

---

### 🌐 Langkah 6: Konfigurasi Apache Reverse Proxy & SSL

Jalankan perintah ini di server tempat Apache berada:

#### 1. Pasang Apache dan Aktifkan Modul
```bash
sudo apt update
sudo apt install -y apache2

# Aktifkan modul proxy, rewrite, headers, dan ssl
sudo a2enmod proxy proxy_http proxy_wstunnel ssl rewrite headers
sudo systemctl restart apache2
```

#### 2. Buat Konfigurasi VirtualHost Apache
Buat berkas `/etc/apache2/sites-available/siati.conf`:

```bash
sudo nano /etc/apache2/sites-available/siati.conf
```

Isi dengan template berikut:

```apache
# ==============================================================================
# 1. BLOK HTTP PORT 80 (Redirect Otomatis ke HTTPS)
# ==============================================================================
<VirtualHost *:80>
    ServerName siati.rumahsakit.co.id
    ServerAdmin it-support@rumahsakit.co.id

    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    ErrorLog ${APACHE_LOG_DIR}/siati_error.log
    CustomLog ${APACHE_LOG_DIR}/siati_access.log combined
</VirtualHost>

# ==============================================================================
# 2. BLOK HTTPS PORT 443 (Reverse Proxy ke PM2 Next.js)
# ==============================================================================
<VirtualHost *:443>
    ServerName siati.rumahsakit.co.id
    ServerAdmin it-support@rumahsakit.co.id

    # A. Sertifikat SSL
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/siati.rumahsakit.co.id/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/siati.rumahsakit.co.id/privkey.pem

    # B. Header Keamanan
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # C. Batas Ukuran Upload Foto & Video Bukti Medis (60 MB)
    LimitRequestBody 62914560

    # D. Reverse Proxy Settings
    ProxyPreserveHost On
    ProxyRequests Off
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # E. Penanganan Khusus Real-Time Server-Sent Events (SSE) /api/realtime
    # flushpackets=on & no-gzip WAJIB agar notifikasi tiket real-time tidak tertahan
    <Location "/api/realtime">
        # Jika beda server, ganti 127.0.0.1 dengan IP internal Server PM2 (misal: 192.168.1.50)
        ProxyPass http://127.0.0.1:3000/api/realtime flushpackets=on
        ProxyPassReverse http://127.0.0.1:3000/api/realtime
        SetEnv no-gzip 1
        SetEnv proxy-nokeepalive 1
        Header set Cache-Control "no-cache, no-transform"
        Header set X-Accel-Buffering "no"
    </Location>

    # F. Meneruskan Seluruh Halaman Web & API ke Next.js (Port 3000)
    # Jika beda server, ganti 127.0.0.1 dengan IP internal Server PM2
    ProxyPass / http://127.0.0.1:3000/ retry=1 acquire=3000 timeout=600 Keepalive=On
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog ${APACHE_LOG_DIR}/siati_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/siati_ssl_access.log combined
</VirtualHost>
```

#### 3. Pasang Sertifikat SSL
* **Opsi A: Domain Resmi / Publik (Certbot Let's Encrypt - Gratis)**:
  ```bash
  sudo apt install -y certbot python3-certbot-apache
  sudo certbot --apache -d siati.rumahsakit.co.id
  ```
* **Opsi B: Jaringan Internal LAN RS / IP Lokal (Self-Signed SSL)**:
  ```bash
  sudo mkdir -p /etc/ssl/siati
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/siati/siati.key \
    -out /etc/ssl/siati/siati.crt \
    -subj "/C=ID/ST=Indonesia/L=Jakarta/O=RumahSakit/CN=siati.local"
  # Lalu arahkan SSLCertificateFile dan SSLCertificateKeyFile ke folder /etc/ssl/siati/
  ```

#### 4. Aktifkan Situs & Restart Apache
```bash
sudo a2dissite 000-default.conf
sudo a2ensite siati.conf
sudo apache2ctl configtest    # Harus menghasilkan "Syntax OK"
sudo systemctl restart apache2
```

---

### 🔧 3. Perintah Pemeliharaan Harian (*Cheat Sheet*)

```bash
# Memeriksa status aplikasi PM2 (RAM & CPU)
pm2 status

# Melihat log aktivitas atau error secara real-time
pm2 logs siati-app

# Restart aplikasi setelah update kode atau berkas .env
pm2 restart siati-app --update-env

# Reload tanpa downtime (Zero-Downtime Reload)
pm2 reload siati-app

# Memeriksa status database MariaDB
sudo systemctl status mariadb

# Memeriksa status web server Apache
sudo systemctl status apache2

# Memantau penggunaan resource server interaktif
pm2 monit
```

---

## 📄 Lisensi
Hak Cipta © 2026 SIATI Team. Dikembangkan khusus untuk peningkatan mutu pelayanan fasilitas kesehatan dan rumah sakit.
