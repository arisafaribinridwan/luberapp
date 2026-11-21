# PRD.md - Product Requirement Document

# Project: Luber (Lunas Bersama)

**Version:** 2.0.0

**Status:** Approved Technical Specification

**Last Updated:** 20 November 2026

**Stack Baseline:** Nuxt 4, Nuxt UI, TypeScript, Zod, Drizzle ORM, SQLite (Dev) / Turso LibSQL (Prod), Cloudflare Pages, Nuxt PWA (`@vite-pwa/nuxt`), `@nuxtjs/better-auth`, Google Drive API

**Constants & Types:** Semua enum menggunakan pola `as const` dan diimpor oleh schema serta validation untuk menjaga type safety.

**Type Scope:** File TypeScript `types` dipisahkan ke `app/types` untuk client, `server/types` untuk backend, dan `shared/types` untuk kode yang dipakai bersama. Tipe server tidak boleh bocor ke client.

---

## 1. Executive Summary & Vision

**Luber (Lunas Bersama)** adalah aplikasi pencatatan keuangan simpan pinjam berbasis web yang mengusung prinsip **ta'awun (saling tolong-menolong)** dan Murni tanpa riba. Aplikasi ini dirancang untuk komunitas atau organisasi non-profit yang membutuhkan platform pengelolaan keuangan transparan, akuntabel, dan bebas dari bunga, denda keterlambatan, pinalti, maupun biaya administrasi tersembunyi.

Aplikasi dibangun dengan standar modern *Full-Stack SSR/Edge Application* menggunakan **Nuxt**, **Nuxt UI**, dan **Drizzle ORM** dengan dukungan basis data **Turso (SQLite)** di lingkungan produksi Cloudflare Pages, serta integrasi **Google Drive FOLDER** sebagai media penyimpanan bukti transaksi yang aman dan terpusat.

---

## 2. Core Operating Principles

1. **Strictly Nir-Riba & No Penalty**: Tidak ada bunga, denda keterlambatan, biaya penanganan, maupun pinalti pada transaksi pinjaman anggota. Keterlambatan diselesaikan secara kekeluargaan.
2. **Unified Grant Intake (Penerimaan Hibah Disatukan)**: Seluruh penerimaan hibah/donasi, termasuk hibah anggota, disatukan ke Kas Utama (`1-1001`) dan Modal Hibah (`3-1001`). Jika masih ada defisit kas, alokasi untuk menutup defisit diprioritaskan sesuai keputusan rapat; sisa dana dapat dialokasikan sebagai modal putar atau operasional dengan tetap memegang prinsip amanah pemberi dana.
3. **Receipt Enforcement (Wajib Bukti Fisik)**: Setiap transaksi kas masuk, kas keluar, atau transfer antar rekening wajib menyertakan lampiran bukti transfer/struk yang diunggah secara otomatis ke Google Drive.
4. **SAK EMKM & Double-Entry Bookkeeping**: Pencatatan transaksi secara berpasangan (*Debit* dan *Kredit*) sesuai Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah.
5. **Authenticated Transparency**: Semua transaksi dan posisi kas dapat diakses secara *read-only* oleh pengguna yang sudah login. Tidak ada halaman atau endpoint aplikasi yang dapat digunakan tanpa autentikasi.
6. **Enhanced Admin Experience**: Fitur auto-complete pencarian anggota berdasarkan keyword nama/ID serta format otomatis pembagi ribuan (*thousand separator*) pada input nominal nominal transaksi.
7. **Physical Account Audit Trail**: Setiap transaksi menyimpan rekening manual yang menerima atau mengeluarkan dana sehingga jejak fisik kas dapat direkonsiliasi dengan jurnal Debit/Kredit.
8. **Internal Fund Transfer**: Admin dapat memindahkan dana antar rekening pusat komunitas secara langsung dan setiap pemindahan dicatat sebagai transaksi yang dapat diaudit.
9. **Emergency Deficit Coverage**: Saldo kas utama minus dicatat sebagai saldo awal/defisit yang terpisah. Dana hibah anggota dapat dialokasikan untuk menutup defisit tersebut terlebih dahulu; sisa hibah setelah penutupan dicatat sebagai tambahan modal hibah.
10. **Admin Audit Log**: Kejadian penting aplikasi dicatat dalam log yang tidak dapat diubah atau dihapus. Log hanya dapat dibaca oleh `admin` untuk membantu pelacakan aktivitas dan perubahan data.

---

## 3. Authentication, Roles & Session Policy

Semua pengguna aplikasi wajib login sebelum dapat mengakses halaman fitur, dashboard, data, atau API aplikasi. Alur awal pengguna tanpa session adalah: **buka alamat website → welcome screen (`/`) → Get Started → login screen → launchpad (`/`)**. Pengguna dengan session aktif langsung melihat launchpad di `/`.

Launchpad adalah halaman utama setelah login dan menjadi menu untuk masuk ke seluruh area aplikasi. Launchpad tidak menggantikan halaman fitur; launchpad menyediakan tautan menuju dashboard, transaksi, data anggota, pengaturan, dan Log Aktivitas sesuai role pengguna.

### 3.1 Role Pengguna

| Role | Akses utama |
| --- | --- |
| `member` | Mengakses launchpad lalu melihat dashboard, ringkasan saldo, feed transaksi, dan mutasi dirinya sendiri secara *read-only*. |
| `pengurus` | Mengakses launchpad lalu memakai seluruh akses `member`, serta pencatatan dan pengelolaan transaksi operasional sesuai kewenangan organisasi. |
| `admin` | Mengakses launchpad lalu memakai seluruh akses `pengurus`, serta pengelolaan pengguna, role, rekening manual, konfigurasi, Log Aktivitas, dan seluruh operasi administrasi. |

Role disimpan pada akun pengguna dan diverifikasi pada setiap route server. Tidak ada role anonim atau akses data aplikasi tanpa session aktif; welcome screen dan halaman autentikasi dapat diakses tanpa session.

### 3.2 Log Aktivitas Admin

Sistem menyimpan log untuk kejadian penting, yaitu login/logout, login yang gagal, pembuatan transaksi, transfer, perubahan rekening manual, perubahan pengguna atau role, serta perubahan konfigurasi. Setiap catatan menyimpan waktu, pelaku jika tersedia, jenis kejadian, ringkasan kejadian, dan ID data yang terdampak jika ada.

Halaman dan endpoint log hanya tersedia untuk `admin`. `member` dan `pengurus` tidak menerima data log melalui UI maupun API. Log bersifat *append-only*: tidak ada fitur edit atau hapus, dan isi log tidak boleh menyimpan password, PIN, token, atau isi berkas bukti transaksi.

### 3.3 Session

Session dikelola oleh `@nuxtjs/better-auth` dan berakhir setelah **1 jam tanpa aktivitas**. Setiap request atau interaksi terautentikasi yang valid memperbarui waktu aktivitas terakhir. Ketika session kedaluwarsa, pengguna diarahkan kembali ke welcome screen dan harus login ulang sebelum kembali ke launchpad.

## 4. Technology Stack Specification

| Layer | Development Environment | Production Environment |
| --- | --- | --- |
| **Framework** | Nuxt 4 (SSR & Server Routes / Nitro Engine) | Cloudflare Pages (`*.pages.dev`) via Nitro Cloudflare Preset |
| **PWA** | `@vite-pwa/nuxt` dengan Web App Manifest dan service worker | PWA installable melalui HTTPS, update service worker terkelola |
| **UI Responsif** | Nuxt UI + Tailwind CSS dengan pendekatan mobile-first | Layout tetap nyaman digunakan pada mobile dan desktop |
| **UI Library & Styling** | Nuxt UI + Tailwind CSS | Nuxt UI + Tailwind CSS |
| **Language** | TypeScript (Strict Mode) | TypeScript (Strict Mode) |
| **Data Validation** | Zod (Runtime + Type-Safe) | Zod (Runtime + Type-Safe) |
| **Backend Layers** | API Route (Auth/Val) → Service (Logic) → Repository (DB) | API Route (Auth/Val) → Service (Logic) → Repository (DB) |
| **ORM & Database Driver** | Drizzle ORM + `@libsql/client` (file-based SQLite) | Drizzle ORM + `@libsql/client` (Turso LibSQL Driver) |
| **Database Engine** | SQLite Local File (`./sqlite.db`) | Turso SQLite Cloud (Edge Replicated) |
| **Authentication** | `@nuxtjs/better-auth` (Username Plugin), role-based access, idle timeout 1 jam | `@nuxtjs/better-auth` (Username Plugin), role-based access, idle timeout 1 jam |
| **Attachment Storage** | Google Drive API (Service Account / OAuth2) | Google Drive API (Service Account / OAuth2) |

---

## 5. Financial Architecture & Chart of Accounts (COA SAK EMKM)

Struktur Bagan Akun disesuaikan dengan standar SAK EMKM:

| Kode Akun | Nama Akun | Kelompok Akun | Saldo Normal | Deskripsi & Fungsi |
| --- | --- | --- | --- | --- |
| **1-1001** | Kas & Bank Utama | Aset | Debit | Penampung seluruh saldo kas tunai dan rekening bank |
| **1-1002** | Piutang Pinjaman Anggota | Aset | Debit | Tagihan pinjaman bebas riba yang aktif di anggota |
| **2-1001** | Simpanan Anggota | Kewajiban | Kredit | Titipan dana milik anggota (pokok/sukarela/tabungan) |
| **3-1001** | Modal Hibah - Donasi | Ekuitas | Kredit | Akumulasi penerimaan hibah/donasi publik, anggota, & lembaga yang belum dialokasikan |
| **3-1002** | Akumulasi Defisit Kas | Ekuitas | Debit | Penampung defisit/saldo kas utama minus dan pengurang saat ditutup oleh hibah |
| **5-1001** | Beban Operasional | Beban | Debit | Pengeluaran riil untuk operasional, server, & administrasi |

### 5.1 Kebijakan Saldo Kas Minus dan Hibah Penutup Defisit

Pada saat implementasi awal, admin wajib mencatat nilai saldo kas utama minus berdasarkan hasil rapat anggota darurat dan bukti rekonsiliasi. Nilai tersebut tidak boleh dihapus atau disamarkan sebagai penerimaan hibah. Sistem menampilkan tiga nilai terpisah:

* **Defisit awal**: nilai kas utama minus sebelum hibah.
* **Defisit tertutup**: bagian hibah yang dialokasikan khusus untuk menutup defisit.
* **Sisa hibah/modal**: hibah yang masih tersedia setelah penutupan defisit.

Hibah anggota dicatat dalam dua tahap: penerimaan dana ke rekening/kas dan alokasi internal untuk penutupan defisit. Alokasi internal tidak mengubah kas fisik; alokasi hanya memindahkan nilai ekuitas dari Modal Hibah ke Akumulasi Defisit. Jumlah alokasi tidak boleh melebihi defisit yang belum tertutup atau hibah yang tersedia.

### Matriks Penjurnalan Otomatis (Rules Engine)

| Jenis Transaksi | Akun Debit (Dr) | Akun Kredit (Kr) | Dampak Saldo |
| --- | --- | --- | --- |
| **Saldo Awal Kas Minus** | 3-1002 (Akumulasi Defisit) | 1-1001 (Kas) | Kas menjadi negatif, defisit tercatat |
| **Penerimaan Hibah / Donasi** | 1-1001 (Kas) | 3-1001 (Modal Hibah) | Kas (+), Modal Hibah (+) |
| **Alokasi Hibah untuk Menutup Defisit** | 3-1001 (Modal Hibah) | 3-1002 (Akumulasi Defisit) | Modal hibah (-), defisit tertutup (+) |
| **Setoran Simpanan Anggota** | 1-1001 (Kas) | 2-1001 (Simpanan) | Kas (+), Simpanan Anggota (+) |
| **Penarikan Simpanan Anggota** | 2-1001 (Simpanan) | 1-1001 (Kas) | Simpanan Anggota (-), Kas (-) |
| **Pencairan Pinjaman Anggota** | 1-1002 (Piutang) | 1-1001 (Kas) | Piutang (+), Kas (-) |
| **Angsuran Pinjaman Anggota** | 1-1001 (Kas) | 1-1002 (Piutang) | Kas (+), Piutang (-) |
| **Beban Operasional** | 5-1001 (Beban) | 1-1001 (Kas) | Beban (+), Kas (-) |
| **Transfer Antar Rekening Pusat** | 1-1001 (Kas) | 1-1001 (Kas) | Saldo rekening sumber (-), saldo rekening tujuan (+), total kas tetap |

---

## 6. Database & Data Model

Definisi schema database, audit trail rekening manual, log aktivitas admin, dan pengaturan daftar rekening manual dipisahkan dalam [database.md](database.md). Dokumen tersebut menjadi sumber detail struktur data dan aturan persistensi.

## 7. Application Flows

Alur pengguna dan kebutuhan UX aplikasi dipisahkan dalam [flow.md](flow.md). Dokumen tersebut menjadi sumber detail untuk splash screen, login, launchpad, dashboard terautentikasi, panel role, dan pemilihan rekening manual.

## 8. Backend Specification

Spesifikasi API, server routes, validasi payload, log aktivitas, dan endpoint admin dipisahkan dalam [backend.md](backend.md). Dokumen tersebut menjadi sumber detail implementasi backend aplikasi.

## 9. Environment & Deployment Configurations

### Mobile-First Responsive UI

UI aplikasi dirancang dengan pendekatan **mobile-first**. Pada viewport desktop, aplikasi tetap mempertahankan pengalaman seperti aplikasi mobile melalui shell dengan lebar maksimum yang terkontrol dan diposisikan di tengah. Layout tidak boleh melebar tanpa batas atau mengubah prioritas navigasi mobile.

* Gunakan breakpoint responsive Tailwind untuk menyesuaikan spasi, ukuran komponen, dan grid.
* Pertahankan navigasi utama yang mudah dijangkau pada layar kecil; pada desktop boleh menggunakan rail/sidebar tanpa menghilangkan struktur mobile.
* Tabel dan form harus memiliki perilaku responsif, seperti scroll horizontal terkontrol atau tampilan kartu pada layar kecil.
* Target sentuh, tipografi, dan jarak antar kontrol harus nyaman pada perangkat mobile.

### PWA & Cloudflare Pages Deployment

Aplikasi wajib dapat dipasang sebagai Progressive Web App pada browser desktop dan mobile. Konfigurasi PWA harus menyediakan:

* Web App Manifest dengan `name`, `short_name`, icon, `start_url`, `display: standalone`, dan warna tema.
* Service worker untuk caching asset aplikasi dan fallback shell saat koneksi tidak tersedia.
* HTTPS pada production agar service worker dan instalasi PWA aktif.
* Strategi update service worker yang memberi tahu pengguna saat versi baru tersedia.
* Data transaksi, session, dan operasi mutasi tidak boleh ditulis melalui cache offline. Operasi tersebut tetap memerlukan koneksi dan session server yang valid.

### Cloudflare Pages & Turso Setup

Berkas `.env` untuk lingkungan pengembangan dan produksi:

```env
# Nuxt & App Config
NUXT_PUBLIC_APP_NAME="Luber - Lunas Bersama"
BETTER_AUTH_SECRET="your-super-secret-better-auth-key"
BETTER_AUTH_URL="http://localhost:3000" # https://luber.pages.dev di Production
BETTER_AUTH_SESSION_IDLE_TIMEOUT=3600 # detik; session berakhir setelah 1 jam tanpa aktivitas

# Development DB (SQLite Local)
DATABASE_URL="file:./sqlite.db"

# Production DB (Turso LibSQL)
TURSO_DATABASE_URL="libsql://luber-db-yourorg.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"

# Google Drive Storage Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL="luber-uploader@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="1a2b3c4d5e6f7g8h9i0j"

```

---

## 10. Non-Functional Requirements (NFR)

1. **Mobile-First Responsive UI**: Tampilan dirancang untuk mobile dan tetap menggunakan shell berlebar terkontrol pada viewport desktop.
2. **PWA Support**: Aplikasi dapat di-install sebagai PWA melalui manifest dan service worker, berjalan pada HTTPS, serta menyediakan fallback shell untuk kondisi koneksi terbatas.
3. **Authentication Boundary**: Seluruh halaman dan endpoint menolak akses tanpa session valid; role dan idle timeout 1 jam ditegakkan di server.
4. **Edge Ready**: Aplikasi siap di-deploy secara *serverless* di Cloudflare Pages edge network dengan waktu tunda (*latency*) minimal.
5. **Strict Data Integrity**: Penjurnalan SAK EMKM dan validasi Zod menjamin saldo debit dan kredit selalu seimbang.
6. **Zero-Cost Scaling**: Menggunakan kombinasi free-tier Cloudflare Pages, Turso SQLite (500MB free storage), dan Google Drive (15GB free storage).
