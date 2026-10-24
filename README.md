# 🏥 SIATI — Sistem Informasi & Aduan Terpadu TI Rumah Sakit
### Platform Helpdesk & Ticketing Insiden Medis Terpadu Berstandar SLA Rumah Sakit

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.11+-003545?style=flat&logo=mariadb)](https://mariadb.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=flat&logo=nginx)](https://nginx.org/)
[![Apache](https://img.shields.io/badge/Apache-HTTP_Server-D22128?style=flat&logo=apache)](https://httpd.apache.org/)
[![PM2](https://img.shields.io/badge/PM2-Process_Manager-2B037A?style=flat&logo=pm2)](https://pm2.keymetrics.io/)
[![Motion](https://img.shields.io/badge/Motion-v12-f43f5e?style=flat)](https://motion.dev/)

---

## 📌 1. Apa Itu SIATI?

**SIATI** *(Sistem Informasi & Aduan Terpadu TI)* adalah platform digital terpadu penanganan insiden dan kendala operasional fasilitas teknologi informasi yang dirancang secara universal untuk seluruh **Rumah Sakit (RSUD, RSUP, RS Swasta, maupun RS Khusus)**.

Sistem ini memastikan pelayanan medis di **Instalasi Gawat Darurat (IGD)**, **Kamar Operasi (OK)**, **Intensive Care Unit (ICU)**, **Rawat Inap/Bangsal**, **Rawat Jalan/Poliklinik**, **Farmasi**, **Laboratorium**, **Radiologi**, hingga **Kasir** berjalan tanpa hambatan akibat kendala SIMRS, komputer tindakan, printer etiket obat, maupun jaringan.

### 🎯 Permasalahan Utama yang Diselesaikan (*Pain Points*)
* **Pelaporan Sporadis & Informal**: Laporan sering masuk melalui telepon pribadi atau chat WhatsApp teknisi yang mudah tertimbun dan tidak terdokumentasi.
* **Ketiadaan Bukti Visual Kerusakan**: Staf medis kesulitan mendeskripsikan pesan kesalahan teknis SIMRS atau bunyi kerusakan hardware tanpa bukti foto/video dari lokasi.
* **Akuntabilitas & SLA Kabur**: Tidak adanya bukti pencatatan menit respon dan durasi perbaikan yang objektif, sering memicu silang pendapat antara nakes dan tim TI.
* **Insiden Darurat Tidak Terprioritaskan**: Kendala fatal di ruangan kritis (seperti PC henti jantung di IGD atau error bridging BPJS V-Claim) sering tercampur dengan permintaan pemasangan aplikasi non-mendesak.
* **Kerentanan Keamanan Siber**: RS pemerintah kerap menjadi target serangan siber (Ransomware, web shell lewat celah upload file, SQL Injection, dan brute force login).

### 💡 Solusi & Keunggulan Unggulan SIATI
1. **Prioritas & Skala Urgensi Medis (P1 - P4)**:
   * 🔴 **P1 - Darurat (EMERGENCY)**: Pelayanan pasien berhenti total di IGD, OK, ICU, Farmasi (Target SLA: < 5 Menit). Dilengkapi indikator visual detak merah berdenyut (*breathing pulse*).
   * 🟠 **P2 - Tinggi (HIGH)**: Layanan rawat inap & poliklinik ramai terganggu (Target SLA: < 15 Menit).
   * 🟡 **P3 - Sedang (MEDIUM)**: Gangguan administratif umum (Target SLA: < 30 Menit).
   * 🟢 **P4 - Rendah (LOW)**: Permintaan instalasi baru atau perawatan berkala (Target SLA: < 60 Menit).
2. **Stopwatch Pengerjaan Presisi Menit (SLA Tracking)**:
   * **MTTA** (*Mean Time to Acknowledge*): Stopwatch waktu respon dari tiket dibuat hingga teknisi mengambil tugas.
   * **MTTR** (*Mean Time to Repair*): Stopwatch pengerjaan aktif di lokasi (dilengkapi jeda jika menunggu pengadaan suku cadang/part).
3. **Analitik Eksekutif Manajemen Rumah Sakit**:
   * Scorecard 6 indikator utama dengan filter tanggal mandiri, peta konsentrasi kerusakan (*Heatmap Ruangan*), matriks produktivitas staf (SKP Pegawai), ekspor CSV UTF-8, dan cetak dokumen resmi berformat kop surat standar rumah sakit.
4. **Sinkronisasi Data Real-Time (Server-Sent Events / SSE)**:
   * Antarmuka terupdate instan secara dua arah tanpa perlu me-reload halaman peramban.
5. **Keamanan Standar Data Kesehatan (*Fortress Security*)**:
   * Enkripsi Bcrypt Cost Factor 12, pengamanan brute-force lockout, dual-mode CAPTCHA, toggle intip sandi, notifikasi login generik anti-user enumeration, serta proteksi media via `X-Accel-Redirect`.

---

## 👥 2. Peran Pengguna & Hak Akses (RBAC Model)

Seluruh staf dan nakes **wajib login** menggunakan Akun Pegawai (Username / NIP) sebelum mengakses sistem:

| Peran (Role) | Sasaran Pengguna | Fitur & Akses Utama |
| :--- | :--- | :--- |
| **`STAFF_USER`** | Dokter, Perawat, Bidan, Apoteker, Kasir | Form pelaporan kendala cepat (< 30 detik), unggah foto/video bukti kerusakan langsung dari kamera ponsel, pemantauan status tiket aktif secara real-time, ulasan rating bintang kepuasan layanan (CSAT). |
| **`IT_STAFF`** | Teknisi Lapangan, Helpdesk SIMRS | Meja kerja terpadu (*Unified IT Workbench*), daftar antrean tiket seluruh RS, tombol respon stopwatch menit pengerjaan (*Ambil Tugas*, *Menuju Lokasi*, *Mulai Pengerjaan*, *Jeda Sparepart*, *Selesai*), penyesuaian tingkat urgensi. |
| **`SUPERADMIN`** | Administrator Sistem & Infrastruktur TI | Master data ruangan/bangsal & zona gedung, **registrasi pengguna pegawai baru lengkap dengan upload foto profil & avatar placeholder cerdas**, kontrol status aktif/nonaktif akun instan (*Optimistic UI tanpa reload*), reset kata sandi, pengaturan target SLA menit kategori, pantauan log audit forensik, kendali antrean tiket (filter belum selesai vs selesai), **pengaturan identitas profil RS dinamis**, dan **Dual-View Switcher** ke Portal Manajemen. |
| **`MANAGEMENT`** | Direksi & Manajemen Rumah Sakit | Scorecard 6 KPI eksekutif (Total Tiket, Kepatuhan SLA %, MTTA, MTTR, Skor CSAT, Insiden P1) dengan filter rentang tanggal mandiri, heatmap beban kendala ruangan terpaginasi, matriks produktivitas teknisi (SKP Grade A/B/C), audit stopwatch tiket, ekspor CSV, dan **cetak dokumen laporan resmi berformat kop instansi dinamis, glosarium singkatan teknis, serta lembar pengesahan tertanda STAFF IT di posisi kanan**. |

---

## 🛠️ 3. Arsitektur & Spesifikasi Teknologi

```
[ Klien: Smartphone Nakes / Tablet Bangsal / PC Poliklinik ]
                          │ HTTPS (Port 443) / WSS
                          ▼
[ Reverse Proxy Web Server (Nginx / Apache / Multi-Tier) ]
  ├─ Terminasi SSL TLS 1.3 & HTTP/2
  ├─ Anti-DDoS, Rate Limiting (5 req/min pada login & upload)
  ├─ Server-Sent Events (SSE) Buffering Bypass (/api/realtime)
  └─ X-Accel-Redirect Protected Storage (/var/siati/media)
                          │ Proxy HTTP (Port 3000)
                          ▼
[ Node.js Engine terkelola via PM2 Process Manager ]
  ├─ Next.js 16 (App Router + Turbopack)
  ├─ React 19 + TypeScript + Motion v12
  ├─ Server Actions + Zod Validation Gate
  ├─ JWT Session Cookie (HttpOnly, Secure, SameSite=Strict)
  └─ Prisma ORM 6.x Client
                          │ SQL Connection (Port 3306)
                          ▼
[ MariaDB 10.11+ LTS / MySQL Database Engine ]
```

---

## 💻 4. Panduan Menjalankan di Lingkungan Lokal (Development)

### Prasyarat Sistem
* **Node.js**: Versi `20.x` LTS atau lebih baru.
* **Database**: MariaDB 10.11+ atau MySQL 8.0+ (tersedia melalui **Laragon** atau **XAMPP**).
* **Git**: Versi terbaru.

### Langkah-langkah Instalasi Lokal

1. **Clone Repository & Masuk ke Folder Proyek**:
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
   Pastikan service MySQL di Laragon/XAMPP telah berjalan, lalu eksekusi:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Akses aplikasi melalui peramban web di [http://localhost:3000](http://localhost:3000).

### 🔑 Akun Percontohan Default (Hasil Seeding)
* **Super Admin**: Username `admin` | Password `Password123!`
* **Manajemen RS**: Username `manajemen` | Password `Password123!`
* **Staf TI**: Username `rian` atau `operator` | Password `Password123!`
* **Staf Medis / Nakes**: Username `siti` | Password `Password123!`

---

## 🚀 5. Panduan Konfigurasi & Deployment Produksi (5 Skenario)

Sebelum menerapkan salah satu dari 5 skenario di bawah ini, lakukan persiapan awal di server Linux (Ubuntu/Debian/Rocky Linux):

```bash
# 1. Masuk ke direktori aplikasi
cd /var/www/siati

# 2. Pasang dependensi produksi & build
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build
```

---

### 🔹 Skenario 1: Menggunakan PM2 Saja (Direct Node.js / Standalone Intranet)

Skenario ini menjalankan aplikasi SIATI langsung menggunakan **PM2** pada port yang ditentukan (misalnya port `3000` atau port `80` untuk intranet RS mandiri).

```
[ Klien Intranet RS ] ─── HTTP:3000 ───> [ PM2: Next.js Server (Port 3000) ]
```

#### Langkah-langkah Konfigurasi:
1. Pastikan PM2 telah terpasang global:
   ```bash
   sudo npm install -g pm2
   ```

2. Berkas konfigurasi PM2 telah tersedia di [`deploy/ecosystem.config.js`](file:///c:/laragon/www/SIATI/deploy/ecosystem.config.js):
   ```javascript
   module.exports = {
     apps: [
       {
         name: "siati-app",
         script: "node_modules/next/dist/bin/next",
         args: "start",
         cwd: "/var/www/siati",
         instances: "max",       // Cluster mode otomatis sesuai jumlah CPU core
         exec_mode: "cluster",
         autorestart: true,
         watch: false,
         max_memory_restart: "1G",
         env: {
           PORT: 3000,
           NODE_ENV: "production",
         },
       },
     ],
   };
   ```

3. Jalankan aplikasi dan aktifkan persistensi boot server:
   ```bash
   pm2 start deploy/ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. Periksa status proses:
   ```bash
   pm2 status
   pm2 logs siati-app
   ```

---

### 🔹 Skenario 2: Menggunakan PM2 dan Nginx (Standar Produksi Rumah Sakit)

Arsitektur rekomendasi resmi PRD. PM2 bertindak sebagai application runner Next.js di background (port `3000`), dan **Nginx** berada di garis terdepan sebagai Reverse Proxy performa tinggi, terminasi SSL Let's Encrypt, bypass buffering untuk Server-Sent Events (SSE), dan pengaman penyimpanan berkas internal (`X-Accel-Redirect`).

```
[ Klien / Smartphone ]
          │ HTTPS (Port 443) / WSS
          ▼
[ Nginx Reverse Proxy (SSL, Rate-Limit, X-Accel-Redirect) ]
          │ HTTP (Port 3000)
          ▼
[ PM2 Process Manager: Next.js (127.0.0.1:3000) ]
```

#### Langkah-langkah Konfigurasi:
1. Jalankan aplikasi Next.js via PM2:
   ```bash
   cd /var/www/siati
   pm2 start deploy/ecosystem.config.js
   pm2 save
   ```

2. Pasang Nginx dan Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. Gunakan konfigurasi Nginx siap pakai dari repositori:
   ```bash
   sudo cp /var/www/siati/deploy/nginx/siati.conf /etc/nginx/sites-available/siati.conf
   sudo ln -s /etc/nginx/sites-available/siati.conf /etc/nginx/sites-enabled/
   ```

4. Pastikan blok streaming SSE pada konfigurasi Nginx aktif:
   ```nginx
   # Penanganan Khusus Real-Time SSE Stream (/api/realtime)
   location /api/realtime {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Connection '';
       proxy_buffering off;
       proxy_cache off;
       chunked_transfer_encoding off;
       proxy_read_timeout 24h;
   }
   ```

5. Uji konfigurasi dan reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. Pasang SSL gratis Let's Encrypt:
   ```bash
   sudo certbot --nginx -d siati.rumahsakit.co.id
   ```

---

### 🔹 Skenario 3: Menggunakan PM2 dan Apache (VirtualHost & `mod_proxy`)

Skenario ini ideal jika rumah sakit telah memiliki server berbasis Apache HTTP Server (LAMP Stack, cPanel, atau RedHat/AlmaLinux) dan ingin mengintegrasikan SIATI ke dalam VirtualHost Apache.

```
[ Klien / Browser ]
          │ HTTPS (Port 443)
          ▼
[ Apache HTTP Server (mod_proxy, mod_ssl, mod_headers) ]
          │ HTTP (Port 3000)
          ▼
[ PM2 Process Manager: Next.js (127.0.0.1:3000) ]
```

#### Langkah-langkah Konfigurasi:
1. Aktifkan modul-modul proxy dan SSL yang diwajibkan di Apache:
   ```bash
   sudo a2enmod proxy proxy_http proxy_wstunnel ssl rewrite headers
   sudo systemctl restart apache2
   ```

2. Gunakan berkas konfigurasi Apache yang telah disediakan di [`deploy/apache/siati.conf`](file:///c:/laragon/www/SIATI/deploy/apache/siati.conf):
   ```bash
   sudo cp /var/www/siati/deploy/apache/siati.conf /etc/apache2/sites-available/siati.conf
   sudo a2ensite siati.conf
   ```

3. Cuplikan VirtualHost Apache (`/etc/apache2/sites-available/siati.conf`):
   ```apache
   <VirtualHost *:443>
       ServerName siati.rumahsakit.co.id

       SSLEngine on
       SSLCertificateFile /etc/letsencrypt/live/siati.rumahsakit.co.id/fullchain.pem
       SSLCertificateKeyFile /etc/letsencrypt/live/siati.rumahsakit.co.id/privkey.pem

       ProxyPreserveHost On
       ProxyRequests Off
       RequestHeader set X-Forwarded-Proto "https"

       # Server-Sent Events (SSE) Real-Time Stream (/api/realtime)
       <Location "/api/realtime">
           ProxyPass http://127.0.0.1:3000/api/realtime flushpackets=on
           ProxyPassReverse http://127.0.0.1:3000/api/realtime
           SetEnv no-gzip 1
           SetEnv proxy-nokeepalive 1
           Header set Cache-Control "no-cache, no-transform"
       </Location>

       # Proxy Pass Utama ke Next.js PM2
       ProxyPass / http://127.0.0.1:3000/ timeout=600 Keepalive=On
       ProxyPassReverse / http://127.0.0.1:3000/
   </VirtualHost>
   ```

4. Uji sintaks Apache dan muat ulang:
   ```bash
   sudo apache2ctl configtest
   sudo systemctl reload apache2
   ```

---

### 🔹 Skenario 4: Menggunakan PM2, Nginx lalu Apache (Nginx Front-End Edge -> Apache Core -> PM2)

Arsitektur enterprise di mana **Nginx berada di baris paling depan (Port 80/443)** bertindak sebagai Reverse Proxy Edge Accelerator (menangani SSL Offloading, mitigasi DoS, caching static, dan rate-limiting), lalu mem-forward request ke **Apache (Port 8080)**, dan Apache meneruskannya ke **PM2 Next.js (Port 3000)**. Sangat populer pada sistem cPanel/WHM atau server multi-aplikasi rumah sakit.

```
[ Klien Publik / Nakes ]
          │ HTTPS: 443 / HTTP: 80
          ▼
[ NGINX Front-End Edge (Port 80 & 443) ]
  ├─ Terminasi SSL / TLS
  ├─ Anti-DDoS & Rate Limiting
  └─ Proxy Pass ke 127.0.0.1:8080
          │ HTTP (Port 8080)
          ▼
[ APACHE Web Core (Port 8080) ]
  ├─ VirtualHost Internal
  └─ Proxy Pass ke 127.0.0.1:3000
          │ HTTP (Port 3000)
          ▼
[ PM2 Process Manager: Next.js (127.0.0.1:3000) ]
```

#### Langkah-langkah Konfigurasi:
1. **Ubah Port Apache ke 8080**:
   Edit berkas `/etc/apache2/ports.conf`:
   ```apache
   Listen 127.0.0.1:8080
   ```
   Sesuaikan VirtualHost di `/etc/apache2/sites-available/siati-internal.conf`:
   ```apache
   <VirtualHost 127.0.0.1:8080>
       ServerName siati.rumahsakit.co.id
       ProxyPreserveHost On
       ProxyPass / http://127.0.0.1:3000/
       ProxyPassReverse / http://127.0.0.1:3000/
   </VirtualHost>
   ```
   Aktifkan site dan restart Apache:
   ```bash
   sudo a2ensite siati-internal.conf
   sudo systemctl restart apache2
   ```

2. **Konfigurasi Nginx di Port 80 & 443**:
   Buat konfigurasi di `/etc/nginx/sites-available/siati-edge.conf`:
   ```nginx
   server {
       listen 80;
       server_name siati.rumahsakit.co.id;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name siati.rumahsakit.co.id;

       ssl_certificate /etc/letsencrypt/live/siati.rumahsakit.co.id/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/siati.rumahsakit.co.id/privkey.pem;

       client_max_body_size 60M;

       # Forward seluruh request ke Apache Port 8080
       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Khusus Real-Time SSE Stream, bypass langsung ke Next.js atau via Apache tanpa buffering
       location /api/realtime {
           proxy_pass http://127.0.0.1:8080/api/realtime;
           proxy_buffering off;
           proxy_cache off;
           proxy_read_timeout 24h;
       }
   }
   ```
   Aktifkan dan muat ulang Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/siati-edge.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **Pastikan PM2 berjalan**:
   ```bash
   pm2 restart siati-app
   ```

---

### 🔹 Skenario 5: Menggunakan PM2, Apache lalu Nginx (Apache Front-End Edge -> Nginx Shield -> PM2)

Arsitektur di mana **Apache menduduki gerbang luar (Port 80/443)** (misalnya karena server rumah sakit telah memiliki firewall aplikasi **ModSecurity / OWASP Core Rule Set** di Apache), lalu Apache mem-forward request ke **Nginx di Port 8080** yang berfungsi sebagai reverse proxy internal berkecepatan tinggi serta mengamankan streaming SSE dan media storage, sebelum akhirnya diteruskan ke **PM2 Next.js (Port 3000)**.

```
[ Klien Publik / Nakes ]
          │ HTTPS: 443 / HTTP: 80
          ▼
[ APACHE Front-End Edge (Port 80 & 443) ]
  ├─ Terminasi SSL & Web Application Firewall (ModSecurity)
  └─ Proxy Pass ke 127.0.0.1:8080
          │ HTTP (Port 8080)
          ▼
[ NGINX Internal Shield (Port 8080) ]
  ├─ Penanganan SSE Streaming Tanpa Buffering
  ├─ X-Accel-Redirect Protected Media Storage
  └─ Proxy Pass ke 127.0.0.1:3000
          │ HTTP (Port 3000)
          ▼
[ PM2 Process Manager: Next.js (127.0.0.1:3000) ]
```

#### Langkah-langkah Konfigurasi:
1. **Konfigurasi Nginx Internal di Port 8080**:
   Buat berkas `/etc/nginx/sites-available/siati-internal.conf`:
   ```nginx
   server {
       listen 127.0.0.1:8080;
       server_name siati.rumahsakit.co.id;

       client_max_body_size 60M;

       # Storage Terlindungi X-Accel-Redirect untuk Foto/Video Medis
       location /protected-media/ {
           internal;
           alias /var/siati/media/;
       }

       # Real-Time SSE Stream
       location /api/realtime {
           proxy_pass http://127.0.0.1:3000/api/realtime;
           proxy_http_version 1.1;
           proxy_buffering off;
           proxy_cache off;
           proxy_read_timeout 24h;
       }

       # Forwarding Utama ke PM2 Next.js
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
       }
   }
   ```
   Aktifkan dan restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/siati-internal.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl restart nginx
   ```

2. **Konfigurasi Apache Front-End di Port 80 & 443**:
   Edit berkas `/etc/apache2/sites-available/siati-frontend.conf`:
   ```apache
   <VirtualHost *:80>
       ServerName siati.rumahsakit.co.id
       Redirect permanent / https://siati.rumahsakit.co.id/
   </VirtualHost>

   <VirtualHost *:443>
       ServerName siati.rumahsakit.co.id

       SSLEngine on
       SSLCertificateFile /etc/letsencrypt/live/siati.rumahsakit.co.id/fullchain.pem
       SSLCertificateKeyFile /etc/letsencrypt/live/siati.rumahsakit.co.id/privkey.pem

       ProxyPreserveHost On
       ProxyRequests Off
       RequestHeader set X-Forwarded-Proto "https"

       # Stream SSE tanpa buffering
       <Location "/api/realtime">
           ProxyPass http://127.0.0.1:8080/api/realtime flushpackets=on
           ProxyPassReverse http://127.0.0.1:8080/api/realtime
           SetEnv no-gzip 1
       </Location>

       # Meneruskan seluruh request ke Nginx Internal di Port 8080
       ProxyPass / http://127.0.0.1:8080/
       ProxyPassReverse / http://127.0.0.1:8080/
   </VirtualHost>
   ```
   Aktifkan dan muat ulang Apache:
   ```bash
   sudo a2ensite siati-frontend.conf
   sudo apache2ctl configtest
   sudo systemctl reload apache2
   ```

3. **Pastikan PM2 berjalan**:
   ```bash
   pm2 restart siati-app
   ```

---

## 🛡️ 6. Matriks Pertahanan Siber (*Fortress Security Blueprint*)

| Vektor Serangan | Metode Serangan Peretas | Pertahanan Berlapis di SIATI |
| :--- | :--- | :--- |
| **Malicious File Upload (Webshell/RCE)** | Mengunggah script PHP backdoor (`shell.php.jpg`) untuk mengambil alih server RS. | 1. Direct file execution dinonaktifkan di web server.<br/>2. Pemeriksaan Magic Bytes biner asli (hanya JPEG/PNG/WebP/MP4 valid).<br/>3. Rename seluruh file ke UUIDv4 acak tanpa ekstensi ganda.<br/>4. EXIF GPS stripping via Sharp dan transcode FFmpeg.<br/>5. Berkas hanya dapat diakses melalui internal `X-Accel-Redirect`. |
| **SQL Injection (SQLi)** | Menyuntikkan `' OR 1=1 --` pada form login atau pencarian tiket. | 1. Prisma ORM menggunakan **100% Parameterized Prepared Statements**.<br/>2. Validasi skema input ketat dengan pustaka **Zod** di seluruh API.<br/>3. Hak akses user database dibatasi (*Least Privilege*). |
| **Cross-Site Scripting (XSS)** | Menyisipkan script pencuri cookie di deskripsi kendala tiket. | 1. Next.js melakukan sanitasi context-aware escaping secara native.<br/>2. Sanitasi HTML deskripsi via **DOMPurify**.<br/>3. Header `Content-Security-Policy (CSP)` ketat.<br/>4. Sesi disimpan di cookie `HttpOnly`, `Secure`, `SameSite=Strict`. |
| **Brute Force & Credential Stuffing** | Menebak password NIP staf medis menggunakan wordlist otomatis. | 1. Pembatasan laju (*Rate Limiting*) maksimal 5 req/menit per IP.<br/>2. **Dual-Mode CAPTCHA Gate** (Ketik kode gambar offline atau Turnstile).<br/>3. Penguncian akun (*Account Lockout*) 15 menit setelah 5x gagal login berturut-turut.<br/>4. Pesan error login generik tanpa membocorkan eksistensi username (*Anti-User Enumeration*).<br/>5. Hashing password aman menggunakan **Bcrypt Cost Factor 12** / Argon2id. |
| **Broken Object Level Auth (BOLA / IDOR)** | Mengubah parameter ID di URL (`/tiket/101` -> `/tiket/102`) untuk mengintip data unit lain. | 1. ID tiket publik menggunakan **UUID v7** terenkripsi.<br/>2. Middleware verifikasi hak akses tiket: Pelapor hanya dapat melihat tiket unit kerjanya sendiri, teknisi hanya dapat melihat tiket yang ditugaskan. |
| **Audit Log Tampering** | Oknum menghapus atau memanipulasi riwayat penanganan aduan. | 1. Tabel `system_audit_logs` dan `ticket_timeline_logs` bersifat **Append-Only** (hanya hak `INSERT`, tidak ada `UPDATE` maupun `DELETE` untuk role non-DBA). |

---

## 📋 7. Pemeliharaan & Operasional Berkala

### 🔄 Alur Pembaruan Kode (Deploy Update Versi Baru)
Jika terdapat pembaruan kode dari repositori Git:
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
Pasang cron job harian untuk mencadangkan database secara otomatis setiap pukul 02:00 dini hari:
```bash
crontab -e
```
Tambahkan baris berikut:
```cron
0 2 * * * mysqldump -u siati_user -p'PasswordSangatKuatDanRahasia2026!' siati_db | gzip > /var/backups/siati_db_$(date +\%F).sql.gz
```

---

## 📄 Lisensi

Hak Cipta © 2026 **SIATI - Sistem Informasi & Aduan Terpadu TI Rumah Sakit**. Dilindungi undang-undang.  
Dikembangkan untuk meningkatkan efisiensi, akuntabilitas mutu, dan keandalan operasional fasilitas teknologi informasi pelayanan kesehatan rumah sakit.
