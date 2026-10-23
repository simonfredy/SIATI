# PRODUCT REQUIREMENT DOCUMENT (PRD)
## SIATI: Sistem Informasi Aduan & Ticketing IT Rumah Sakit Pemerintah

---

| Metadata Dokumen | Spesifikasi Teknis Produk |
| :--- | :--- |
| **Nama Produk** | **SIATI RSBM** (Sistem Informasi Aduan & Ticketing IT) |
| **Instansi Sasaran** | Rumah Sakit Bhayangkara Medan (RSBM) |
| **Versi Dokumen** | **1.3.0** *(Updated with Executive Management & Karumkit Portal, SLA Scorecard, SKP Matrix, & Official Report Export)* |
| **Status** | **Approved & Production-Ready** |
| **Pola Arsitektur** | **Fullstack TypeScript (Next.js 16+ Turbopack App Router + PWA)** |
| **Database & ORM** | **MariaDB 10.11+ LTS** dengan **Prisma ORM 6.x** |
| **Server & Reverse Proxy** | **Nginx** (SSL TLS 1.3, Rate Limiting, Protected Storage via `X-Accel`) |
| **Otentikasi & Akses** | **Wajib Login Pegawai** (NIP/Username, Role-Based Access Control / RBAC) |
| **Notifikasi Gateway** | **Self-Hosted WhatsApp (Baileys Engine)** & **Telegram Bot API** |

---

## 1. Executive Summary & Problem Statement

### 1.1 Latar Belakang
Rumah Sakit Pemerintah beroperasi selama **24 jam sehari, 7 hari seminggu (24/7)** dengan dinamika pelayanan kritis tinggi di Instalasi Gawat Darurat (IGD), Rawat Inap/Bangsal, Rawat Jalan/Poliklinik, Farmasi, Laboratorium, Radiologi, hingga Kasir. Kelancaran pelayanan medis sangat bergantung pada keandalan infrastruktur IT:
1. **SIMRS (Sistem Informasi Manajemen Rumah Sakit)** yang tidak boleh terputus saat bridging BPJS (V-Claim), resep elektronik, dan rekam medis digital (RME).
2. **Perangkat Keras (Hardware)** seperti PC poliklinik, monitor ICU, printer label resep obat, printer barcode gelang pasien, dan scanner barcode.
3. **Jaringan (Network)** LAN, access point WiFi medis, dan koneksi internet antar-gedung.

### 1.2 Masalah yang Diselesaikan (*Pain Points*)
* **Pelaporan Manual & Berserakan**: Aduan sering masuk melalui telepon pribadi teknisi IT, obrolan WhatsApp informal yang sering tenggelam, atau teriakan langsung ke ruang IT.
* **Kurangnya Bukti Visual Kerusakan**: Nakes kesulitan menjelaskan gejala kerusakan teknis secara teks tanpa lampiran foto atau rekaman video langsung dari lokasi (misal: bunyi beep hardware, pesan pop-up error SIMRS).
* **Akuntabilitas & SLA Kabur**: Pihak manajemen RS tidak memiliki rekapitulasi data riil berapa menit tim IT merespon dan menyelesaikan masalah. Sering terjadi silang pendapat antara nakes dan tim IT mengenai kecepatan penanganan.
* **Ketiadaan Notifikasi Real-time Lapangan**: Teknisi yang sedang berada di bangsal/lapangan sering terlambat mengetahui tiket baru yang masuk di helpdesk.
* **Kerentanan Keamanan Siber**: Rumah Sakit pemerintah menjadi sasaran empuk serangan siber (Ransomware, defacement, eksploitasi web shell dari celah upload file, SQL Injection, brute force login).

### 1.3 Sasaran Produk (*Product Goals*)
1. **Penyederhanaan Pelaporan (< 30 Detik)**: Antarmuka *Mobile-First* yang memungkinkan nakes melapor dengan cepat langsung dari smartphone ruangan, terotentikasi resmi via NIP/Akun Pegawai.
2. **Notifikasi Otomatis Dua Arah**: Integrasi mandiri WhatsApp (Self-Hosted Baileys) & Telegram Bot langsung ke grup siaga IT dan ponsel teknisi.
3. **Pelacakan SLA Menit per Kasus (MTTR Tracking)**: Pencatatan presisi stopwatch durasi penanganan (Response Time, On-Site Time, Execution Time dalam menit) sebagai dasar KPI dan transparansi kinerja.
4. **Keamanan Siber Berlapis (*Zero-Trust Media & Hardened Infrastructure*)**: Proteksi upload video/foto bebas dari malware/webshell, proteksi SQLi, XSS, rate-limiting Nginx, dan pencatatan audit log tak terhapus.

---

## 2. Aktor Sistem & Hak Akses (RBAC Model)

Seluruh staf dan nakes **wajib login** sebelum dapat menggunakan sistem.

```mermaid
flowchart TD
    subgraph LoginAuth ["Gerbang Otentikasi Terpusat"]
        Login[Login NIP / Password Pegawai] --> JWT[Session Cookie: HttpOnly + Secure]
    end

    JWT -->|Role: STAFF_USER| P1[Nakes / Pegawai RSBM]
    JWT -->|Role: IT_STAFF| P2[Staf TI RSBM - Helpdesk & Lapangan]
    JWT -->|Role: MANAGEMENT| P3[Karumkit / Direksi RSBM]
    JWT -->|Role: SUPERADMIN| P4[Administrator Sistem & Keamanan]

    P1 -->|Fitur| F1[Buat Tiket + Upload Media, Riwayat Tiket Saya, Rating Layanan]
    P2 -->|Fitur| F2[Pusat Kendali: Antrean & Urgensi RS, Ambil & Kerjakan Sendiri, Stopwatch Menit Kerja]
    P3 -->|Fitur| F3[Laporan Rekapitulasi Menit SLA, Heatmap Kerusakan, KPI Layanan]
    P4 -->|Fitur| F4[Audit Logs, Master Lokasi, Konfigurasi WA/Telegram, Security Rules]
```

---

## 3. Tech Stack & Arsitektur Sistem

* **Framework Inti**: **Next.js 14+ (App Router)** Fullstack TypeScript
  * Server Actions & Route Handlers untuk backend API
  * React Server Components (RSC) + Client Components Mobile-First
  * Manifest PWA (Progressive Web App) dapat di-install di layar utama smartphone nakes
* **Database & ORM**: **MariaDB 10.11+ LTS** dengan **Prisma ORM**
  * Tipe data strongly typed
  * Prepared statements otomatis anti-SQLi
  * Connection pooling terkelola
* **Web Server & Reverse Proxy**: **Nginx**
  * SSL/TLS 1.3 modern profile
  * HTTP/2
  * Rate Limiting per IP (`limit_req`)
  * Serving file upload terlindungi via `X-Accel-Redirect` (Direct access diblokir)
* **Media Processing Engine**:
  * Gambar: `Sharp` (WebP conversion, resize, pembersihan EXIF metadata)
  * Video: `FFmpeg` (Kompresi H.264/AAC, scaling 720p, durasi maks 60 detik)
* **Pemberitahuan Otomatis (Notification Engine)**:
  * **WhatsApp**: Self-Hosted Gateway berbasis **Baileys (Node.js/TypeScript microservice)** running lokal di server RS (Hemat biaya, tanpa ketergantungan pihak ketiga, nomor resmi RS).
  * **Telegram**: Telegram Bot API via Webhook SSL untuk broadcast grup IT & tombol respon interaktif.

---

## 4. Spesifikasi Fungsional Detail

### 4.1 Modul Pelaporan Tiket (Mobile-First)
1. **Otentikasi Pegawai & Proteksi Login**:
   - Login menggunakan **Username (Nama Depan Pengguna)** (contoh: `siti`, `rian`, `operator`, `admin`) atau NIP resmi pegawai dan Password.
   - **Verifikasi CAPTCHA Anti-Bot (Ketik Sesuai Gambar)**:
     - Menggunakan gambar *Alphanumeric Distorted Code* (5 karakter huruf/angka acak tanpa karakter ambigu seperti 0, O, 1, I).
     - Pengguna cukup mengetik 5 karakter yang tampak pada gambar (bersifat *case-insensitive* / huruf besar-kecil sama saja).
     - Bekerja 100% offline pada jaringan intranet RS dengan proteksi HMAC SHA-256 berkedaluwarsa 120 detik.
     - **Pre-Auth Gate**: Validasi token CAPTCHA dieksekusi sebelum proses verifikasi hash password untuk mencegah *CPU Resource Exhaustion DoS*.
   - Opsi *Remember Me* dengan secure encrypted refresh token.
   - Profil pelapor (Nama Lengkap, Unit Kerja, No. HP/WA) otomatis terisi dari basis data pegawai.
2. **Form Pelaporan Cepat**:
   - **Pemilihan Lokasi Dinamis**: Gedung -> Lantai -> Ruangan/Poli/Bangsal (Tersedia fitur Scan QR Code ruangan untuk auto-select).
   - **Kategori Masalah**:
     - *SIMRS*: Error bridging BPJS/V-Claim, error input RME, resep e-prescribing gagal cetak, akun terkunci.
     - *Hardware*: PC mati, monitor bergaris/blank, scanner barcode tidak membaca, UPS bunyi, keyboard macet.
     - *Printer*: Kertas macet (paper jam), hasil cetak bergaris, tinta habis, printer label resep tidak respon.
     - *Jaringan*: WiFi poli putus, kabel LAN terlepas, internet lambat.
     - *Fasilitas Pendukung*: Telepon internal PABX mati, bel perawat bermasalah.
   - **Skala Prioritas**:
     - 🔴 **Emergency (P1)**: Pelayanan pasien berhenti total (IGD, Kamar Operasi, Farmasi Antrean Macet). Target Respon: < 5 Menit.
     - 🟠 **High (P2)**: Layanan terhambat, unit belum punya backup. Target Respon: < 15 Menit.
     - 🟡 **Medium (P3)**: Gangguan minor, pekerjaan administratif masih bisa berjalan. Target Respon: < 30 Menit.
     - 🟢 **Low (P4)**: Permintaan instalasi baru atau perawatan berkala. Target Respon: < 60 Menit.
3. **Lampiran Foto & Video (Mobile Native-Feel)**:
   - Tombol kamera langsung: `input type="file" accept="image/*" capture="environment"`
   - Tombol video langsung: `input type="file" accept="video/*" capture="environment"`
   - Durasi video maksimal: **60 detik** (dengan kompresi preview di sisi ponsel sebelum upload).
   - Maksimal ukuran per file: Foto 10MB, Video 50MB.

---

### 4.2 Pipeline Upload Media & Pertahanan Siber Anti-Hacker

```mermaid
sequenceDiagram
    autonumber
    actor Nakes as Nakes (PWA Mobile)
    participant Nginx as Nginx Web Server
    participant App as Next.js API (TypeScript)
    participant Sharp as Sharp / FFmpeg Worker
    participant Disk as /var/siati/media (noexec mount)

    Nakes->>Nginx: POST /api/tickets/upload (Multipart/form-data)
    Note over Nginx: 1. Cek Client Max Body Size (60M)<br/>2. Cek Rate Limit (Max 5 req/min)<br/>3. Verifikasi SSL/TLS
    Nginx->>App: Forward Request
    Note over App: 1. Validasi Sesi JWT User (Wajib Login)<br/>2. Baca Magic Bytes (File Signature Hex)<br/>3. Tolak jika MIME-type terlarang (.php, .exe, .sh, .svg, dll)<br/>4. Generate UUIDv4 untuk nama file acak
    App->>Sharp: Kirim Stream Buffer Berkas
    Note over Sharp: Strip seluruh metadata EXIF (GPS, Camera)<br/>Transcode Video ke MP4 (H.264)<br/>Re-encode Gambar ke WebP 80% Quality
    Sharp->>Disk: Simpan file teroptimasi di partisi aman
    App-->>Nakes: Return Attachment ID & Preview URL
```

#### Aturan Keamanan Berkas:
* **Larangan Eksekusi Langsung**: Direktori penyimpanan `/var/siati/media` diletakkan di luar web root publik dan dimount dengan parameter sistem `noexec,nosuid,nodev`.
* **X-Accel-Redirect**: Pengguna tidak dapat menembak URL file secara langsung. Akses file media hanya dilayani oleh Nginx melalui internal redirection setelah backend Next.js memvalidasi hak akses tiket terkait.
* **Pembersihan Metadata (EXIF Stripping)**: Seluruh data lokasi GPS dan identifier perangkat kamera dihapus demi menjaga kerahasiaan data fasilitas kesehatan.

---

### 4.3 Integrasi Notifikasi Dua Arah: WhatsApp & Telegram

#### A. WhatsApp Gateway (Self-Hosted Baileys)
* Microservice Node.js mandiri yang terhubung ke nomor WhatsApp resmi Tim IT RS.
* **Format Notifikasi ke Teknisi**:
```text
🔔 [SIATI RSUD] TIKET MASUK BARU!
No. Tiket  : #TKT-20261023-0012
Unit       : IGD - Ruang Tindakan Bedah
Prioritas  : 🔴 EMERGENCY (P1)
Kendala    : PC Resusitasi Hang, RME Tidak Bisa Simpan
Pelapor    : dr. Hendra, Sp.B (NIP: 19850214xxxx)
Media      : 1 Foto & 1 Video Terlampir

👉 Buka & Ambil Tiket:
https://siati.rsud.go.id/teknisi/tiket/TKT-20261023-0012
```
* **Format Notifikasi ke Pelapor**:
  - Saat tiket dibuat: Konfirmasi no. tiket dan estimasi waktu penanganan.
  - Saat teknisi mengambil: *"Teknisi [Nama] sedang menuju ke [Ruangan Anda]."*
  - Saat selesai: *"Aduan telah selesai ditangani. Mohon berikan penilaian bintang 1-5 di link berikut."*

#### B. Telegram Bot (Grup Siaga IT)
* Bot mengirimkan card notifikasi ke grup Telegram "Tim IT & SIMRS".
* Dilengkapi tombol interaktif (*Inline Keyboard*):
  * `[ 🛠️ Ambil Tiket Ini ]`
  * `[ 📄 Detail & Lampiran ]`
* Saat tombol ditekan, status tiket otomatis berubah menjadi `ASSIGNED`, timer respon berhenti, dan pesan Telegram ter-update secara real-time.

---

### 4.4 Modul Portal Eksekutif Direksi & Manajemen RSBM (Executive Governance & SLA Scorecard)
Sebagai modul kendali bagi pimpinan rumah sakit (**Karumkit, Wakil Kepala Rumah Sakit, Direksi Medis & Penunjang, serta Kepala Bagian Tata Usaha**), antarmuka dengan peran `MANAGEMENT` menyajikan visualisasi data analitik tingkat tinggi, evaluasi kepatuhan SLA, serta audit kinerja staf TI yang dapat dipertanggungjawabkan dalam akreditasi rumah sakit (KARS/STARKES):

#### 1. Executive Scorecard & Filter Rentang Waktu Per Tanggal:
- **Rentang Waktu Per Tanggal Khusus 6 Kartu KPI**:
  - Dilengkapi *Date Range Picker* mandiri (`Dari Tanggal` s/d `Sampai Tanggal`) berbasis input kalender lokal (`YYYY-MM-DD`).
  - Didukung tombol pintas instan (*Quick Presets*): **Hari Ini**, **7 Hari Terakhir**, **Bulan Ini**, dan **Semua Waktu**.
  - Mengkalkulasi 6 indikator kinerja utama secara real-time berdasarkan tanggal yang ditentukan:
    1. **Total Aduan Masuk**: Menghitung volume kumulatif aduan dalam rentang tanggal terpilih beserta rincian status (*Selesai*, *Dikerjakan*, *Menunggu Suku Cadang*, *Antrean Baru*).
    2. **Tingkat Kepatuhan SLA (%)**:
       $$\text{Persentase Kepatuhan SLA} = \left(\frac{\text{Jumlah Tiket Selesai Sesuai Target SLA Kategori}}{\text{Total Tiket Diselesaikan}}\right) \times 100\%$$
       - Standar Mutu Rumah Sakit Bhayangkara Medan: $\ge 90.0\%$ (Lengkap dengan visual progress bar & status kelayakan akreditasi).
    3. **MTTA (Mean Time to Acknowledge / Kecepatan Respon Awal)**:
       $$\text{MTTA} = \frac{\sum (\text{Waktu Tiket Direspons} - \text{Waktu Tiket Dilaporkan})}{\text{Jumlah Tiket Terrespons}}$$
       - Mengukur kecepatan helpdesk dan teknisi siaga dalam merespons aduan nakes (Target RSBM: $< 15$ menit).
    4. **MTTR (Mean Time to Repair / Stopwatch Pengerjaan Bersih)**:
       $$\text{MTTR} = \frac{\sum (\text{Waktu Tiket Selesai} - \text{Waktu Mulai Kerja} - \text{Waktu Jeda Suku Cadang})}{\text{Jumlah Tiket Selesai}}$$
       - Mengukur efisiensi teknis penanganan masalah hingga perangkat normal kembali.
    5. **Indeks Kepuasan Pengguna / CSAT (Customer Satisfaction Score)**:
       - Rata-rata bintang penilaian langsung (skala 1.0 - 5.0) dari staf medis/nakes pelapor setelah aduan dinyatakan selesai.
    6. **Insiden Kritis Darurat (P1 Emergency)**:
       - Pemantauan khusus terhadap gangguan pada titik vital pelayanan pasien (IGD, Kamar Operasi, Farmasi Antrean Macet).

#### 2. Heatmap & Pemetaan Beban Kendala Unit / Bangsal Rumah Sakit:
- Dilengkapi bilah filter rentang waktu per tanggal mandiri untuk menganalisis insiden ruangan pada periode tertentu.
- Visualisasi peringkat ruangan dan bangsal berdasarkan intensitas gangguan fasilitas TI untuk mendeteksi *hotspot* kerusakan berulang.
- **Pagination Terintegrasi**: Tabel daftar ruangan dibatasi 6 baris per halaman dilengkapi tombol navigasi halaman (*Next*, *Previous*, *Page Number*) untuk menjaga keterbacaan pada layar desktop dan tablet.

#### 3. Distribusi 5 Pilar Kategori Masalah TI:
- Analisis proporsi masalah dan rata-rata waktu perbaikan pada 5 pilar utama:
  1. **SIMRS & RME**: Kendala Khanza/Web RME, bridging BPJS V-Claim, e-prescribing resep obat.
  2. **Software Lainnya**: Sistem pemanggil antrean loket, sistem PACS radiologi, OS & antivirus.
  3. **Hardware & PC**: Komputer tindakan medis, monitor ICU, scanner barcode, printer label etiket.
  4. **Jaringan**: Kabel LAN medis, access point WiFi visit dokter di bangsal rawat inap, koneksi internet.
  5. **Fasilitas Penunjang TI**: PABX telepon interkom nakes, sound system poliklinik, CCTV keamanan.

#### 4. Matriks Kinerja Staf & Teknisi TI (Scorecard SKP & Remunerasi):
- Dilengkapi filter rentang tanggal mandiri untuk evaluasi kinerja bulanan, triwulanan, maupun semesteran.
- **Tabel Kinerja & Pagination**: Memuat penilaian objektif per personel Staf TI (`IT_STAFF`):
  - **Identitas**: Nama Lengkap Petugas, NIP, Akun Sistem.
  - **Volume Kerja**: Total tiket ditugaskan dan total tiket diselesaikan.
  - **Kecepatan**: Rata-rata waktu respon (MTTA menit) dan rata-rata pengerjaan (MTTR menit).
  - **Kepatuhan SLA**: Persentase tiket diselesaikan di bawah target waktu kategori (%).
  - **Kualitas**: Rata-rata rating kepuasan bintang (1 - 5) dan jumlah responden nakes.
  - **Grade Evaluasi**:
    - 🌟 **Grade A (Sangat Memuaskan)**: Kepatuhan SLA $\ge 90\%$ dan Skor Rating $\ge 4.5$.
    - ✅ **Grade B (Memuaskan)**: Kepatuhan SLA $\ge 80\%$ dan Skor Rating $\ge 4.0$.
    - ⚠️ **Grade C (Perlu Peningkatan)**: Kepatuhan SLA $< 80\%$.
  - **Navigasi Halaman**: Mendukung paginasi 6 staf per halaman dengan tombol navigasi numerik.
- Menjadi dokumen rujukan sah bagi pimpinan rumah sakit untuk evaluasi Sasaran Kinerja Pegawai (SKP) dan penetapan Tambahan Penghasilan Pegawai (TPP) / insentif bulanan.

#### 5. Audit Rekapitulasi Tiket Presisi Menit & Pagination Fleksibel:
- **Filter Multi-Dimensi Lengkap**:
  - Filter rentang waktu per tanggal (`Dari Tanggal` s/d `Sampai Tanggal`) dengan tombol pintas Hari Ini, 7 Hari, Bulan Ini, dan Semua.
  - Pencarian bebas (No. Tiket, Kendala, Ruangan, Teknisi, atau Nakes).
  - Filter unit kerja/ruangan, filter kategori masalah, filter tingkat urgensi (P1-P4), dan filter status pengerjaan.
- **Sistem Paginasi Fleksibel (Configurable Pagination)**:
  - Pilihan jumlah baris data per halaman: **10 / 25 / 50 data**.
  - Indikator posisi data: *Menampilkan X - Y dari Z data*.
  - Tombol navigasi: Halaman Sebelumnya, Tombol Angka Halaman, dan Halaman Berikutnya.
  - Reset otomatis ke halaman 1 saat filter pencarian diubah.
- **Drill-Down Modal Audit**: Melihat rekam jejak tiket secara menyeluruh: kronologi stopwatch (submitted, assigned, resolved), catatan perbaikan teknisi, foto kendala, serta feedback rating nakes.

#### 6. Wawasan Strategis & Rekomendasi Manajerial Aset TI:
- Dilengkapi filter rentang tanggal mandiri untuk mengevaluasi rekomendasi peremajaan perangkat keras, penambahan access point jaringan bangsal, pemeliharaan integrasi BPJS V-Claim, dan evaluasi kecukupan shift teknisi pada kurun waktu terkait.

#### 7. Ekspor Data Excel (CSV UTF-8) & Format Cetak Resmi Kop RS Bhayangkara Medan:
- **Export CSV/Excel**: Ekspor seluruh rekaman tiket yang sedang difilter beserta presisi waktu respon dan waktu pengerjaan dalam menit dengan format UTF-8 BOM untuk pengolahan spreadsheet SKP.
- **Cetak Laporan Eksekutif Resmi**:
  - Menggunakan format kop surat resmi:
    *Kepolisian Negara Republik Indonesia Daerah Sumatera Utara Bidang Kedokteran dan Kesehatan Rumah Sakit Bhayangkara Tk II Medan*.
  - Dilengkapi stempel tanggal cetak, identitas pemeriksa, dan kolom tanda tangan pengesahan Kepala Rumah Sakit Bhayangkara Medan.
  - Otomatis menyembunyikan tombol navigasi saat diprint melalui peramban (`@media print`).

---

### 4.5 Modul Super Admin TI & Manajemen Keamanan Sistem
Sebagai administrator pengendali tertinggi, akun dengan peran `SUPERADMIN` dibekali dasbor khusus untuk tata kelola seluruh entitas dan keamanan sistem rumah sakit:
1. **Pusat Manajemen Pengguna Pegawai (User Management Portal)**:
   - **Registrasi Pegawai Baru**: Mendaftarkan akun nakes/staf TI/manajemen dengan Username (nama depan), Nama Lengkap, NIP, Nomor WhatsApp, Role RBAC, Unit Penempatan, dan Kata Sandi default (`Password123!`).
   - **Kontrol Status Akun Real-Time**: Fitur tombol saklar (*Toggle Status*) untuk mengaktifkan atau menonaktifkan akses akun pegawai seketika jika terjadi mutasi atau pemutusan tugas.
   - **Mitigasi Lockout Serangan Brute-Force**: Membuka blokir akun dan mereset penghitung kegagalan login (`failedLoginCount: 0`, `lockedUntil: null`).
   - **One-Click Password Reset**: Kemudahan mereset kata sandi pegawai yang lupa kata sandi kembali ke standar aman rumah sakit secara instan.
2. **Manajemen Master Lokasi Ruangan & Bangsal (`DepartmentUnit`)**:
   - Pendaftaran dan pembaruan data seluruh unit rumah sakit (IGD, ICU, Kamar Operasi, Poliklinik, Bangsal Rawat Inap, Farmasi, Laboratorium, Radiologi, Kasir).
   - Pemetaan zona gedung dan lantai gedung untuk pemanduan teknisi lapangan secara presisi.
   - Pemantauan metrik keterkaitan: Jumlah staf aktif penempatan dan total riwayat tiket aduan per unit.
3. **Manajemen Master Kategori Masalah & Target SLA Menit (`Category`)**:
   - Pengaturan 5 pilar kategori masalah (*SIMRS & RME*, *Software Lainnya*, *Hardware & PC*, *Jaringan*, *Fasilitas Penunjang TI*).
   - Penyesuaian target batas waktu respon SLA dalam menit secara dinamis langsung dari antarmuka web.
4. **Pusat Jejak Forensik Siber & Log Audit (`SystemAuditLog`)**:
   - Pencatatan otomatis tak terhapus (*Append-Only Audit Trail*) untuk seluruh aktivitas penting: `LOGIN`, `FAILED_LOGIN`, `CREATE_TICKET`, `SUPERADMIN_CREATE_USER`, `SUPERADMIN_RESET_PASSWORD`, `SUPERADMIN_ACTIVATE_USER`, dsb.
   - Menyajikan informasi forensik lengkap: Stempel Waktu (Timestamp), Pelaku (User & Role), Event Aksi, IP Address penyerang/pengguna, User Agent, dan Payload JSON data.
5. **Akses Meja Kendali Tiket Langsung (Omni-Channel Control)**:
   - Superadmin memiliki tab langsung ke *IT Staff Unified Workbench* untuk memantau antrean rumah sakit, menentukan tingkat urgensi, maupun mengambil tindakan langsung dalam kondisi darurat tanpa harus berganti peran akun.

---

## 5. Pertahanan Keamanan Siber (*Fortress Security Blueprint*)

| Vektor Serangan | Metode Peretas | Proteksi Ketat di SIATI |
| :--- | :--- | :--- |
| **Malicious File Upload (Webshell/RCE)** | Mengunggah script PHP backdoor (`c99.php.jpg`) untuk mengeksekusi shell server. | 1. Direct file execution dimatikan di Nginx.<br/>2. Magic Bytes checking (hanya biner JPEG/PNG/WebP/MP4 valid).<br/>3. Seluruh file direname ke UUIDv4 acak tanpa ekstensi ganda.<br/>4. File gambar di-re-encode ulang via Sharp dan video via FFmpeg.<br/>5. File hanya diakses via internal `X-Accel-Redirect`. |
| **SQL Injection (SQLi)** | Menyuntikkan `' OR 1=1 --` pada form login atau pencarian tiket. | 1. Prisma ORM menggunakan **100% Parameterized Queries**.<br/>2. Validasi input ketat dengan pustaka **Zod** di seluruh Server Actions dan Route Handlers.<br/>3. Database user MariaDB hanya diberi hak akses tabel yang dibutuhkan (*Least Privilege Principle*). |
| **Cross-Site Scripting (XSS)** | Menyisipkan `<script>stealCookie()</script>` pada deskripsi tiket. | 1. Next.js secara native melakukan sanitasi context-aware encoding.<br/>2. Sanitasi HTML deskripsi via **DOMPurify**.<br/>3. Header **Content Security Policy (CSP)** ketat di Nginx.<br/>4. Sesi disimpan di cookie `HttpOnly`, `Secure`, `SameSite=Strict`. |
| **Brute Force & Credential Stuffing** | Menebak NIP dan password staf/teknisi dengan wordlist otomatis. | 1. Rate limiting ketat di Nginx pada rute login: **5 request per menit per IP**.<br/>2. **Verifikasi CAPTCHA Wajib** (Dual Mode: Turnstile / Self-Hosted SVG Math) untuk memutus skrip otomasi/bot peretas.<br/>3. Lockout akun otomatis selama 15 menit setelah 5x gagal login berturut-turut.<br/>4. Hashing password menggunakan **Argon2id** / **Bcrypt (cost 12)**.<br/>5. Integrasi **Fail2ban** untuk memblokir IP penyerang di firewall OS. |
| **BOLA / IDOR** | Mengubah ID tiket di URL (`/tiket/101` -> `/tiket/102`) untuk mengintip data unit lain. | 1. ID tiket publik menggunakan **UUID v7** (bukan integer berurutan).<br/>2. Middleware verifikasi kepemilikan tiket: Pelapor hanya bisa melihat tiket unitnya sendiri, teknisi hanya bisa mengedit tiket yang ditugaskan. |
| **Audit Manipulation** | Oknum menghapus atau memanipulasi log riwayat penanganan tiket. | 1. Tabel `system_audit_logs` dan `ticket_timeline_logs` bersifat **Append-Only** (hanya ada hak `INSERT`, tidak ada `UPDATE` atau `DELETE` untuk role non-DBA). |

---

## 6. Desain Skema MariaDB & Relasi Data (Prisma)

```prisma
// Cuplikan Skema Prisma untuk SIATI
datasource db {
  provider = "mysql" // MariaDB 10.11+
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPERADMIN
  MANAGEMENT
  IT_STAFF
  STAFF_USER
}

enum TicketUrgency {
  EMERGENCY // P1 (< 5 min)
  HIGH      // P2 (< 15 min)
  MEDIUM    // P3 (< 30 min)
  LOW       // P4 (< 60 min)
}

enum TicketStatus {
  SUBMITTED
  ASSIGNED
  IN_PROGRESS
  PENDING_PARTS
  RESOLVED
  CLOSED
  REJECTED
}

enum AttachmentType {
  IMAGE
  VIDEO
}

model User {
  id              String        @id @default(uuid())
  nip             String        @unique
  fullName        String
  phoneNumber     String
  telegramChatId  String?
  role            Role          @default(STAFF_USER)
  passwordHash    String
  departmentUnitId Int
  departmentUnit  DepartmentUnit @relation(fields: [departmentUnitId], references: [id])
  assignedTickets Ticket[]      @relation("TechnicianAssigned")
  createdTickets  Ticket[]      @relation("ReporterUser")
  auditLogs       SystemAuditLog[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([nip])
  @@index([role])
}

model DepartmentUnit {
  id              Int      @id @autoincrement()
  name            String   // Contoh: IGD, Poliklinik Penyakit Dalam, Rawat Inap Melati
  buildingZone    String   // Contoh: Gedung Teratai Lt. 2
  qrIdentifier    String   @unique @default(uuid())
  users           User[]
  tickets         Ticket[]
}

model Category {
  id                 Int      @id @autoincrement()
  name               String   // Hardware, Jaringan, SIMRS, Printer
  description        String?
  targetSlaMinutes   Int      @default(30)
  tickets            Ticket[]
}

model Ticket {
  id                       String               @id @default(uuid())
  ticketNumber             String               @unique // TKT-YYYYMMDD-XXXX
  reporterId               String
  reporter                 User                 @relation("ReporterUser", fields: [reporterId], references: [id])
  unitId                   Int
  unit                     DepartmentUnit       @relation(fields: [unitId], references: [id])
  categoryId               Int
  category                 Category             @relation(fields: [categoryId], references: [id])
  urgency                  TicketUrgency        @default(MEDIUM)
  status                   TicketStatus         @default(SUBMITTED)
  description              String               @db.Text
  assignedTechnicianId     String?
  assignedTechnician       User?                @relation("TechnicianAssigned", fields: [assignedTechnicianId], references: [id])
  
  // Metrik Waktu SLA (Dalam Menit)
  submittedAt              DateTime             @default(now())
  firstAssignedAt          DateTime?
  workStartedAt            DateTime?
  workResolvedAt           DateTime?
  totalPendingMinutes      Int                  @default(0)
  responseMinutes          Int?                 // submittedAt -> firstAssignedAt
  repairMinutes            Int?                 // workStartedAt -> workResolvedAt (dikurangi pending)
  totalLeadMinutes         Int?                 // submittedAt -> workResolvedAt

  attachments              TicketAttachment[]
  timelineLogs             TicketTimelineLog[]
  rating                   TicketRating?

  @@index([status])
  @@index([urgency])
  @@index([submittedAt])
}

model TicketAttachment {
  id             String         @id @default(uuid())
  ticketId       String
  ticket         Ticket         @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  fileType       AttachmentType
  originalName   String
  storedFilename String         // UUIDv4.ext
  filePath       String
  fileSizeBytes  Int
  mimeType       String
  sha256Hash     String
  durationSeconds Int?          // Khusus video
  createdAt      DateTime       @default(now())
}

model TicketTimelineLog {
  id             BigInt         @id @default(autoincrement())
  ticketId       String
  ticket         Ticket         @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actorUserId    String
  actorName      String
  previousStatus TicketStatus?
  newStatus      TicketStatus
  notes          String?        @db.Text
  createdAt      DateTime       @default(now())
}

model TicketRating {
  id             String         @id @default(uuid())
  ticketId       String         @unique
  ticket         Ticket         @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  ratingScore    Int            // 1 to 5
  feedback       String?        @db.Text
  createdAt      DateTime       @default(now())
}

model SystemAuditLog {
  id             BigInt         @id @default(autoincrement())
  userId         String?
  user           User?          @relation(fields: [userId], references: [id])
  action         String
  ipAddress      String
  userAgent      String
  payload        Json?
  createdAt      DateTime       @default(now())

  @@index([createdAt])
  @@index([action])
}
```

---

## 7. Desain Antarmuka Mobile-First (User Interface Flow)

### 7.1 Alur Layar Pelapor (Staf Medis / Nakes di Ruangan)
1. **Layar Login Cepat & Aman**:
   - Field Input: NIP Pegawai & Password.
   - **Widget CAPTCHA Interaktif**:
     - *Online*: Cloudflare Turnstile box "Verify you are human" (1-klik instan).
     - *Offline/Intranet*: Gambar SVG Soal Matematika Dinamis (misal: `7 + 5 = [ ? ]`) dengan tombol refresh soal.
   - Tombol "Ingat Saya di Perangkat Ini" + Tombol Utama `[ 🔐 Masuk Akun Pegawai ]`.
2. **Beranda / Quick Action**:
   - Header: Identitas Nakes (e.g., *Ns. Siti Rahma - Bangsal Mawar*).
   - Tombol Cepat: `[ 📷 Scan QR Ruangan / Buat Laporan Baru ]` (Aksen warna kontras tinggi).
   - Kartu Status Aduan Aktif: Status real-time (*Menunggu IT*, *Teknisi Sedang Menuju Lokasi*, dll).
3. **Layar Form Lapor (Single-Page Form Optimized)**:
   - *Lokasi & Unit Kerja*: Terisi otomatis dari akun atau scan QR code di meja poli.
   - *Pilihan Kategori*: Tombol ikon besar (SIMRS, Printer, PC/Hardware, Jaringan).
   - *Tingkat Urgensi*: Chip interaktif (Darurat, Tinggi, Sedang, Rendah).
   - *Area Upload Lampiran*:
     - Tombol 1: `[ 📸 Jepret Foto Bukti ]`
     - Tombol 2: `[ 🎥 Rekam Video Masalah (Max 60d) ]`
     - Thumbnail preview dengan tombol hapus/ganti.
   - *Deskripsi Masalah*: Text area dengan opsi voice-to-text bawaan smartphone.
   - *Tombol Submit Sticky*: Selalu terlihat di bagian bawah layar (*thumb zone*).

### 7.2 Alur Layar Teknisi IT Lapangan
1. **Daftar Tugas Aktif (Work Orders)**:
   - Filter tab: `Tiket Baru (Belum Diambil)`, `Sedang Saya Tangani`, `Selesai Hari Ini`.
   - Kartu tiket mencantumkan: Urgensi (P1/P2/P3), Nama Ruangan, Menit Berjalan (Stopwatch aktif).
2. **Halaman Penanganan Tiket**:
   - Tampilan foto & video error langsung dapat diputar di browser.
   - Tombol Aksi 1-Klik:
     - `[ 🏃 Mulai Menuju Lokasi ]`
     - `[ ⚙️ Mulai Pengerjaan ]`
     - `[ ⏸️ Jeda (Tunggu Sparepart) ]`
     - `[ ✅ Selesai Diperbaiki ]` (Disertai input catatan tindakan teknisi).

---

## 8. Jadwal Rencana Kerja & Roadmap Pengembangan

```mermaid
gantt
    title Roadmap Pengembangan SIATI RSUD
    dateFormat  YYYY-MM-DD
    section Fase 1: Setup & Database
    Inisialisasi Next.js TS + MariaDB Prisma     :2026-10-24, 7d
    Konfigurasi Hardening Nginx & Firewall       :2026-10-28, 5d
    section Fase 2: Auth & Media Security
    Modul Login NIP & RBAC                       :2026-11-01, 6d
    Pipeline Upload Media + Sharp/FFmpeg + Anti-Webshell :2026-11-05, 8d
    section Fase 3: Mobile UI & Integrasi Bot
    Frontend PWA Mobile-First Pelaporan          :2026-11-12, 9d
    Self-Hosted Baileys WA & Telegram Bot API    :2026-11-18, 8d
    section Fase 4: Stopwatch SLA & Laporan
    Engine Stopwatch Menit & Rekapitulasi Excel  :2026-11-25, 7d
    Dashboard Pimpinan & Heatmap Masalah         :2026-11-29, 6d
    section Fase 5: Security Test & Deployment
    Penetration Testing (OWASP ZAP / SQLMap)     :2026-12-05, 6d
    UAT & Go-Live di RS                          :2026-12-11, 7d
```

---

## 9. Kesimpulan & Langkah Selanjutnya

Dokumen PRD ini telah disesuaikan sepenuhnya dengan kebutuhan operasional Rumah Sakit Pemerintah:
* **Kecepatan**: UI Mobile-First yang efisien bagi nakes di tengah padatnya pelayanan pasien.
* **Transparansi**: Penghitungan waktu respon dan resolusi otomatis dalam hitungan menit untuk KPI objektif tim IT.
* **Keamanan Maksimal**: Standar keamanan data kesehatan, anti-malware upload pipeline, dan server hardening Nginx anti-hacker.
* **Efisiensi Anggaran**: Memanfaatkan stack open-source TypeScript, MariaDB, dan Self-Hosted WhatsApp Baileys tanpa biaya langganan gateway bulanan.
