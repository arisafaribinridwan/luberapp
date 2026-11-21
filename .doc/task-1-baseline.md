# Task 1 — Audit baseline starter

Tanggal audit: 21 November 2026 (Asia/Jakarta).

## Hasil verifikasi

| Perintah / pemeriksaan | Hasil |
| --- | --- |
| `pnpm build` | Lulus setelah konflik Tailwind diperbaiki. Awalnya gagal karena `@nuxtjs/tailwindcss` memasang plugin PostCSS Tailwind 3, sedangkan proyek menggunakan Tailwind 4. Modul tersebut dihapus; `@nuxt/ui` sudah memasang integrasi Tailwind 4. |
| `pnpm lint` | Lulus setelah Nuxt menghasilkan ulang `.nuxt/eslint.config.mjs` sesuai dependency tree terbaru. |
| `pnpm typecheck` | Lulus. |
| Preview production `GET /` tanpa cookie/session | HTTP 200, berisi halaman “Nuxt Starter Template”, tanpa redirect. Ini adalah gap keamanan/produk untuk Task 2–3. |
| Route hasil Nuxt | Satu halaman aplikasi: `app/pages/index.vue` → `/`. Route API modul yang dihasilkan: `/api/auth/**` dan `/api/_nuxt_icon/**`; tidak ada API domain Luber. `authRouteRules` yang dihasilkan kosong (`{}`). |

Preview production memerlukan `NUXT_BETTER_AUTH_SECRET` (atau secret alternatif yang didukung modul) minimal 32 karakter. Audit menggunakan secret sementara lokal. Nilai produksi harus disediakan melalui environment; tidak disimpan dalam repository.

## Kontrak implementasi untuk task berikutnya

### Route dan akses

| Path target | Akses | Status saat audit |
| --- | --- | --- |
| `/` | Launchpad setelah session valid untuk semua role | Halaman starter, dapat dibaca guest |
| `/login`, `/register`, `/two-factor` | Alur autentikasi; challenge 2FA sebelum session penuh | Belum ada |
| `/dashboard/**` dan halaman baca lain | Session valid; data `member` dibatasi ke miliknya | Belum ada |
| `/transactions/**` | `pengurus` dan `admin` sesuai kewenangan operasi | Belum ada |
| `/transfers/**`, `/settings/**`, `/admin/**` | `admin` untuk mutasi dan log yang dilindungi | Belum ada |
| `/api/auth/**` | Handler Better Auth dari modul; endpoint login harus dapat diakses guest | Route modul ada, konfigurasi auth masih minimal |
| `/api/public/**`, `/api/admin/**` | Selalu wajib session; `/api/admin/**` juga wajib pemeriksaan role server | Belum ada |

Nama `/api/public/**` pada spesifikasi berarti endpoint baca, bukan akses anonim. Setiap endpoint aplikasi harus memanggil pemeriksaan session di server; menyembunyikan menu atau redirect halaman tidak cukup. Definisi endpoint final mengikuti `.doc/backend.md` dan `.doc/flow.md` saat diimplementasikan.

### Role dan session

- Role aplikasi: `member`, `pengurus`, `admin`. Role harus didefinisikan satu kali dalam modul bersama dan dipakai oleh konfigurasi auth, UI, serta pemeriksaan server.
- `member` membaca dashboard dan data miliknya; `pengurus` dapat mencatat transaksi yang diizinkan; `admin` mengelola pengguna, rekening, transfer, konfigurasi, dan audit log.
- Semua halaman dan API aplikasi memerlukan session valid. Session kedaluwarsa setelah satu jam tanpa aktivitas; guest diarahkan ke login dan login berhasil menuju `/`.
- `server/auth.config.ts` saat ini hanya mengaktifkan email/password. `app/auth.config.ts` kosong. Belum ada role, idle timeout, database adapter, route guard, atau helper `requireRole`.
- `.doc/flow.md` menyebut login username + password/PIN, sedangkan `.doc/nuxt-better-auth-libsql-drizzle-guide.md` memakai email/password. Perbedaan ini perlu diputuskan pada Task 2 sebelum membuat form dan schema auth. Prioritas role tiga tingkat mengikuti PRD/flow/database, bukan contoh dua role pada guide.

### Struktur direktori Nuxt 4

- `app/`: halaman, komponen, composable, utilitas UI, dan tipe client.
- `server/`: API route, middleware/helper session dan role, service, repository, koneksi dan schema database, serta tipe internal backend.
- `shared/`: tipe dan constants aman yang dipakai client dan server. Jangan mengimpor tipe internal `server/` ke `app/` atau `shared/`.
- `public/`: aset statis. Endpoint API domain baru berada di `server/api/`.

## Gap starter terhadap spesifikasi

- Belum ada splash, login, launchpad, proteksi halaman/session, role guard, maupun session idle timeout. Root masih menampilkan branding dan tautan starter.
- Better Auth belum tersambung ke database; belum ada `auth.ts` untuk CLI, schema auth/domain, migration, seed, atau koneksi Drizzle/LibSQL.
- Belum ada endpoint anggota, dashboard, transaksi double-entry, pemulihan defisit, transfer, rekening manual, atau audit log.
- Belum ada UI dashboard, pencarian anggota, form transaksi, pengaturan admin, dan tampilan audit log.
- Modul PWA sudah terpasang, tetapi manifest, icon aplikasi, kebijakan cache aman, dan verifikasi offline belum dibuat.
- `README.md` semula dokumentasi template dan sudah diganti dengan petunjuk baseline proyek. Petunjuk auth/database dan environment perlu dilengkapi saat fondasinya tersedia.

## Perintah verifikasi berulang

```bash
pnpm build
pnpm lint
pnpm typecheck
```

Jalankan `pnpm build` setelah perubahan dependency atau konfigurasi modul Nuxt; kemudian `pnpm lint` dan `pnpm typecheck` agar konfigurasi dan tipe `.nuxt/` terbaru tersedia.
