# Task Plan Implementasi Luber

**Sumber spesifikasi:**

- [prd.md](prd.md)
- [flow.md](flow.md)
- [database.md](database.md)
- [backend.md](backend.md)
- [design_guideline.md](design_guideline.md)
- [nuxt-better-auth-libsql-drizzle-guide.md](nuxt-better-auth-libsql-drizzle-guide.md)

**Status:** Task 1 selesai; hasil audit ada di [task-1-baseline.md](task-1-baseline.md)

**Task list target:** Checklist dalam dokumen ini menjadi daftar kerja utama untuk implementasi aplikasi.

## Tujuan

Membangun Luber sebagai aplikasi pencatatan keuangan komunitas yang seluruh fiturnya memerlukan session valid, menggunakan role `member`, `pengurus`, dan `admin`, menyediakan dashboard keuangan read-only, pencatatan transaksi berpasangan, pemulihan defisit kas, transfer antar rekening pusat, audit log append-only, PWA mobile-first, serta integrasi Google Drive untuk bukti transaksi.

Kondisi kode saat ini masih berupa starter Nuxt UI dengan konfigurasi Better Auth dasar. Karena itu, pekerjaan dimulai dari audit baseline dan fondasi auth/database sebelum fitur keuangan dibuat.

## Keputusan arsitektur

- Gunakan Nuxt 4, Vue Composition API dengan `<script setup lang="ts">`, Nuxt UI, TypeScript strict, Zod, Drizzle ORM, SQLite lokal, dan Turso LibSQL di production.
- Semua halaman dan endpoint aplikasi memerlukan session Better Auth; endpoint login adalah pengecualian.
- Role terpusat sebagai `member`, `pengurus`, dan `admin`. Pemeriksaan role dilakukan di server menggunakan helper bersama; route rules hanya membantu UX.
- Gunakan struktur modular `server/database/schema/` dan satu export `databaseSchema` serta relations terpusat.
- Pisahkan layer API route, service, dan repository. Route tidak berisi aturan bisnis atau query Drizzle yang kompleks.
- Gunakan constants `as const` untuk role, tipe transaksi, tujuan hibah, jenis event audit, dan status rekening.
- Simpan transaksi dalam jurnal double-entry. Transfer internal memakai akun COA `1-1001` pada debit dan kredit, sementara rekening fisik dicatat melalui `sourceAccount` dan `destinationAccount`.
- Perubahan jurnal, saldo rekening fisik, dan operasi pemulihan defisit diproses atomik. Record transaksi dan audit log bersifat immutable/append-only.
- Bukti transaksi diunggah sebelum commit jurnal. Kegagalan upload atau commit tidak boleh meninggalkan transaksi parsial.
- PWA hanya mencache shell dan asset yang aman. Session, data sensitif, dan mutasi transaksi tidak boleh dipakai secara offline.
- UI mengikuti design guideline: primary `#135BEC`, mobile-first, shell terkontrol pada desktop, navigasi launchpad, dan tabel yang tetap terbaca di mobile.

## Dependency graph

```text
Audit baseline dan kontrak aplikasi
        │
        ├── Better Auth, role, session idle timeout
        │           │
        │           └── route protection + helper requireRole
        │
        ├── Schema modular + constants + relations
        │           │
        │           ├── migration + seed
        │           ├── audit log repository/service
        │           ├── member repository/service
        │           ├── manual account repository/service
        │           └── transaction/recovery/transfer service
        │
        ├── API contracts dan validation Zod
        │           │
        │           ├── authenticated read API
        │           └── role-protected mutation API
        │
        └── API siap
                    │
                    ├── launchpad, auth, PWA shell
                    ├── dashboard dan lookup anggota
                    ├── form transaksi dan pemulihan kas
                    ├── transfer rekening dan pengaturan
                    └── audit log admin
```

### Task List

### Phase 1: Baseline dan fondasi aplikasi

### Task 1: Audit baseline starter dan tetapkan kontrak implementasi

**Description:** Periksa starter Nuxt, konfigurasi Better Auth, struktur halaman, lint/typecheck, import database, dan perbedaan antara kode dengan dokumen spesifikasi. Catat kontrak route, role, struktur direktori, dan perintah verifikasi yang akan dipakai oleh task berikutnya.

**Acceptance criteria:**

- [x] `pnpm build`, `pnpm lint`, dan `pnpm typecheck` dapat dijalankan atau setiap error baseline terdokumentasi sebagai pekerjaan Task 1.
- [x] Gap starter terhadap PRD teridentifikasi, termasuk belum adanya schema domain, route transaksi, dashboard, launchpad, PWA, dan audit log.
- [x] Konvensi path dipastikan konsisten dengan Nuxt 4 (`app/`, `server/`, `shared/`) dan dokumen guide.

**Verification:**

- [x] Jalankan ketiga command verifikasi dari package script.
- [x] Tinjau route hasil Nuxt dan halaman yang dapat diakses tanpa session.

**Dependencies:** None

**Files likely touched:** `package.json`, `nuxt.config.ts`, `README.md`, konfigurasi lint/typecheck bila diperlukan

**Estimated scope:** Small (1-2 files)

### Task 2: Implementasi Better Auth, role, redirect, dan idle timeout

**Description:** Selaraskan konfigurasi server/client Better Auth dengan tiga role, default role, launchpad `/`, login, register, two-factor, dan session idle timeout satu jam. Tambahkan helper role untuk server dan client agar pemeriksaan tidak tersebar.

**Acceptance criteria:**

- [ ] Role `member`, `pengurus`, dan `admin` didefinisikan sekali dan dipakai server, client, serta CLI auth.
- [ ] Semua route aplikasi mengarahkan guest ke login; login berhasil mengarah ke `/`; halaman admin dan fitur pengurus memakai role guard.
- [ ] Session berakhir setelah satu jam tanpa aktivitas dan user diarahkan ke login.
- [ ] Server menolak request tanpa session atau dengan role yang tidak sesuai.

**Verification:**

- [ ] Uji login, logout, register, user per role, role tidak sesuai, session expired, dan akses API langsung.
- [ ] Jalankan build/typecheck.

**Dependencies:** Task 1

**Files likely touched:** `auth.ts`, `server/auth.config.ts`, `app/auth.config.ts`, `shared/auth/permissions.ts`, `server/utils/require-role.ts`, `nuxt.config.ts`

**Estimated scope:** Medium (3-5 files)

### Task 3: Bangun splash screen, launchpad, dan application shell

**Description:** Ganti halaman starter dengan alur splash → pemeriksaan session → login atau launchpad. Buat shell navigasi mobile-first dengan menu berbeda berdasarkan role dan tautan kembali ke launchpad dari setiap area.

**Acceptance criteria:**

- [ ] Tidak ada launchpad, dashboard, atau data aplikasi yang tampil sebelum session valid.
- [ ] Launchpad `/` menampilkan menu dashboard, transaksi, anggota, pengaturan, dan audit log sesuai role.
- [ ] Shell nyaman di mobile dan memakai lebar terkontrol pada desktop.
- [ ] Loading, session expired, dan error auth memiliki state yang jelas.

**Verification:**

- [ ] Uji alur guest, member, pengurus, dan admin pada mobile serta desktop.
- [ ] Uji refresh langsung pada `/` dan route fitur.

**Dependencies:** Task 2

**Files likely touched:** `app/app.vue`, `app/pages/index.vue`, `app/components/AppShell.vue`, `app/components/Launchpad.vue`, `app/assets/css/main.css`

**Estimated scope:** Medium (3-5 files)

### Task 4: Konfigurasi PWA dan kebijakan cache aman

**Description:** Tambahkan modul PWA, manifest, icon, service worker, update notice, dan fallback shell. Pastikan data transaksi, session, dan operasi mutasi tidak dilayani dari cache offline.

**Acceptance criteria:**

- [ ] Manifest memuat nama, short name, icon, start URL, display standalone, dan warna tema.
- [ ] Service worker dapat meng-cache asset shell dan menyediakan fallback yang aman.
- [ ] Endpoint session, data sensitif, dan mutation tidak dicache atau dijalankan offline.
- [ ] Aplikasi dapat di-install melalui HTTPS production.

**Verification:**

- [ ] Jalankan audit manifest dan service worker pada browser.
- [ ] Uji offline hanya menampilkan shell/cache aman; transaksi tetap memerlukan koneksi.

**Dependencies:** Task 3

**Files likely touched:** `nuxt.config.ts`, `public/*`, `app/components/PwaUpdateNotice.vue`, konfigurasi PWA

**Estimated scope:** Medium (3-5 files)

### Checkpoint: Aplikasi dasar

- [ ] Auth dan role guard bekerja untuk semua tiga role.
- [ ] Guest tidak dapat membaca halaman atau API aplikasi.
- [ ] Launchpad menjadi titik masuk setelah login.
- [ ] PWA ter-install dan tidak meng-cache session/mutasi.

### Phase 2: Database, migration, dan audit

### Task 5: Modularisasi schema auth dan domain keuangan

**Description:** Pecah schema auth yang ada ke modul sesuai guide, lalu tambahkan tabel member, manual account, transaction, dan audit log. Tambahkan relations terpusat, infer types, dan constants domain.

**Acceptance criteria:**

- [ ] `server/database/schema/index.ts` mengekspor tabel, `databaseSchema`, dan relations.
- [ ] Schema memuat role, tipe transaksi termasuk `TRANSFER_ANTAR_REKENING`, tujuan hibah, field defisit, rekening fisik, attachment, actor, dan timestamp.
- [ ] `audit_logs` memiliki event type, actor, target, ringkasan, metadata aman, dan append-only policy.
- [ ] Tipe server tidak diimpor dari client/shared; DTO yang dipakai dua sisi berada di `shared/types/`.

**Verification:**

- [ ] Jalankan typecheck dan build.
- [ ] Jalankan query sederhana untuk memastikan relations dan foreign key dapat digunakan.

**Dependencies:** Task 1

**Files likely touched:** `server/database/schema/auth.ts`, `server/database/schema/constants.ts`, `server/database/schema/member.ts`, `server/database/schema/manual-account.ts`, `server/database/schema/transaction.ts`, `server/database/schema/audit-log.ts`, `server/database/schema/index.ts`, `server/database/index.ts`

**Estimated scope:** Large (5+ files; pecah per domain jika diperlukan)

### Task 6: Migration, seed, dan integritas database

**Description:** Buat migration Drizzle untuk schema modular dan seed idempotent untuk rekening manual awal serta konfigurasi yang diperlukan. Pastikan migration aman untuk database baru dan database auth existing.

**Acceptance criteria:**

- [ ] Migration dapat diterapkan pada SQLite lokal tanpa kehilangan user/session valid.
- [ ] Foreign key, index, unique constraint, dan kolom audit diterapkan sesuai database design.
- [ ] Seed rekening awal seperti BCA Bendahara, Mandiri Ketua, dan Kas Tunai tidak menggandakan data saat dijalankan ulang.
- [ ] Prosedur migration Turso terdokumentasi.

**Verification:**

- [ ] Uji migration pada database kosong dan database berisi auth.
- [ ] Jalankan seed dua kali dan bandingkan hasilnya.

**Dependencies:** Task 5

**Files likely touched:** `drizzle.config.ts`, `server/database/migrations/*`, `server/database/seed.*`, `package.json`

**Estimated scope:** Medium (3-5 files)

### Task 7: Implementasi audit log append-only

**Description:** Buat repository/service audit log dan helper untuk menulis event setelah aksi berhasil atau ditolak. Sediakan filter admin berdasarkan tanggal, event type, actor, pagination, dan DTO yang tidak menyimpan rahasia.

**Acceptance criteria:**

- [ ] Login berhasil/gagal, logout, transaksi, transfer, perubahan rekening, perubahan user/role, konfigurasi, dan penolakan aksi dapat dicatat.
- [ ] Log tidak menyimpan password, PIN, token, atau isi lampiran.
- [ ] Tidak ada endpoint edit/delete log.
- [ ] Hanya admin dapat membaca log.

**Verification:**

- [ ] Uji event sukses dan ditolak serta actor kosong untuk login gagal.
- [ ] Uji filter, pagination, role `member`/`pengurus`, dan upaya mutation log.

**Dependencies:** Tasks 2, 5, 6

**Files likely touched:** `server/repositories/audit-log-repository.ts`, `server/services/audit-log-service.ts`, `server/api/admin/audit-logs.get.ts`, `shared/types/audit-log.ts`, auth event integration

**Estimated scope:** Medium (3-5 files)

### Checkpoint: Database dan audit

- [ ] Schema modular dan migration lulus pada SQLite.
- [ ] Seed idempotent.
- [ ] Audit log append-only tersimpan untuk event penting.
- [ ] Tidak ada endpoint aplikasi yang melewati session guard.

### Phase 3: Master data dan attachment

### Task 8: Implementasi anggota dan lookup terproteksi

**Description:** Buat CRUD anggota untuk role yang berwenang dan endpoint lookup bagi dashboard serta form transaksi. Data anggota dan mutasi hanya boleh dibaca sesuai role dan kepemilikan.

**Acceptance criteria:**

- [ ] Admin dapat membuat, mengubah, mengaktifkan, dan menonaktifkan anggota.
- [ ] Pengurus dapat memakai lookup sesuai kewenangan; member hanya dapat melihat data dirinya.
- [ ] Lookup berdasarkan nama/ID mendukung auto-complete tanpa membocorkan nomor telepon atau data sensitif.

**Verification:**

- [ ] Uji validasi ID duplikat, anggota nonaktif, pencarian kosong, dan akses antar role.
- [ ] Uji pagination/batas hasil lookup.

**Dependencies:** Tasks 5-7

**Files likely touched:** `server/repositories/member-repository.ts`, `server/services/member-service.ts`, `server/api/admin/members/*`, `server/api/members/*`, `shared/types/member.ts`

**Estimated scope:** Medium (3-5 files)

### Task 9: Implementasi rekening manual dan pengaturan admin

**Description:** Buat CRUD rekening manual, status aktif/nonaktif, pemilik, nomor/keterangan, audit perubahan, dan larangan penghapusan permanen untuk rekening yang sudah dipakai.

**Acceptance criteria:**

- [ ] Hanya admin dapat mengelola rekening manual.
- [ ] Rekening nonaktif tidak dapat dipilih untuk transaksi baru tetapi tetap tampil dalam riwayat lama.
- [ ] Penghapusan rekening yang memiliki riwayat ditolak.
- [ ] Setiap perubahan menghasilkan audit log dengan actor dan waktu.

**Verification:**

- [ ] Uji create/update/deactivate/delete dan duplicate account.
- [ ] Uji transaksi baru terhadap rekening aktif dan nonaktif.

**Dependencies:** Tasks 5-7

**Files likely touched:** `server/repositories/manual-account-repository.ts`, `server/services/manual-account-service.ts`, `server/api/admin/manual-accounts/*`, `shared/types/manual-account.ts`

**Estimated scope:** Medium (3-5 files)

### Task 10: Integrasi Google Drive untuk bukti transaksi

**Description:** Buat service upload Google Drive dengan validasi file, environment configuration, link view, cleanup bila commit gagal, dan error HTTP terstruktur. Upload harus menjadi prasyarat penyimpanan transaksi.

**Acceptance criteria:**

- [ ] File diterima melalui multipart atau Base64 sesuai kontrak API dan diunggah ke folder yang dikonfigurasi.
- [ ] `attachmentUrl` dan `attachmentDriveId` tersimpan hanya setelah upload berhasil.
- [ ] File kosong, nama kosong, tipe/ukuran tidak valid, atau kredensial gagal ditolak.
- [ ] Secret Google Drive tidak pernah masuk response, log audit, atau source control.

**Verification:**

- [ ] Uji service dengan fixture/mock dan jalur kegagalan upload.
- [ ] Uji bahwa jurnal tidak tersimpan jika upload gagal.

**Dependencies:** Tasks 5-6

**Files likely touched:** `server/services/attachment-service.ts`, `server/utils/file-validation.ts`, `server/config/*`, `.env.example`, `nuxt.config.ts`

**Estimated scope:** Medium (3-5 files)

### Phase 4: Core financial flows

### Task 11: Implementasi service transaksi cash in/cash out

**Description:** Implementasikan validasi Zod, repository, dan service untuk hibah/donasi, simpanan, penarikan, pencairan pinjaman, angsuran, dan beban operasional dengan jurnal SAK EMKM serta rekening fisik.

**Acceptance criteria:**

- [ ] Cash in mewajibkan `destinationAccount`; cash out mewajibkan `sourceAccount`.
- [ ] Nominal positif, tanggal valid, description, member bila diperlukan, rekening aktif, dan attachment diverifikasi.
- [ ] Debit/kredit mengikuti matriks PRD dan mencatat `createdById`.
- [ ] Saldo simpanan, piutang, hibah, dan beban konsisten setelah setiap transaksi.
- [ ] Operasi mutasi hanya dapat dilakukan role yang diizinkan dan menghasilkan audit log.

**Verification:**

- [ ] Uji semua tipe transaksi valid dan invalid.
- [ ] Uji saldo tidak cukup, member tidak valid, rekening nonaktif, attachment gagal, dan double submit.
- [ ] Periksa saldo dari fixture dengan debit/kredit yang sudah diketahui.

**Dependencies:** Tasks 7-10

**Files likely touched:** `server/validation/transaction.ts`, `server/repositories/transaction-repository.ts`, `server/services/transaction-service.ts`, `server/api/transactions.post.ts`, `shared/types/transaction.ts`

**Estimated scope:** Large (5+ files; pecah per cash in/cash out bila diperlukan)

### Task 12: Implementasi saldo awal defisit dan pemulihan hibah

**Description:** Tambahkan alur admin untuk mencatat saldo awal kas minus, menerima hibah dengan `fundPurpose`, dan mengalokasikan hibah untuk menutup defisit. Aturan batas alokasi dan relasi transaksi harus atomik serta dapat diaudit.

**Acceptance criteria:**

- [ ] `SALDO_AWAL_DEFISIT` hanya dapat dibuat admin, memakai referensi rapat/rekonsiliasi, dan tidak dapat dibuat ulang tanpa koreksi pembalik.
- [ ] Hibah menerima tujuan `PENUTUPAN_DEFISIT`, `MODAL_PUTAR`, atau `OPERASIONAL` sesuai kontrak.
- [ ] Alokasi hibah tidak melebihi defisit tersisa atau hibah tersedia dan memiliki `relatedTransactionId`.
- [ ] Dashboard dapat membedakan defisit awal, defisit tertutup, sisa defisit, dan sisa hibah.

**Verification:**

- [ ] Uji defisit awal tunggal, alokasi penuh/parsial, alokasi melebihi batas, hibah tidak tersedia, dan koreksi pembalik.
- [ ] Periksa bahwa alokasi internal tidak mengubah kas fisik.

**Dependencies:** Tasks 7, 10, 11

**Files likely touched:** `server/validation/recovery.ts`, `server/services/recovery-service.ts`, `server/repositories/transaction-repository.ts`, `server/api/admin/recovery/*`, `shared/types/recovery.ts`

**Estimated scope:** Medium (3-5 files)

### Task 13: Implementasi transfer antar rekening pusat

**Description:** Tambahkan transfer admin dari satu rekening manual aktif ke rekening manual aktif lain. Pencatatan transfer harus satu jurnal, saldo rekening fisik berubah atomik, dan total saldo kas komunitas tetap.

**Acceptance criteria:**

- [ ] Payload mewajibkan sumber, tujuan, nominal, tanggal, keterangan, dan bukti.
- [ ] Sumber dan tujuan aktif serta berbeda; saldo sumber mencukupi.
- [ ] Jurnal memakai `TRANSFER_ANTAR_REKENING`, debit dan kredit `1-1001`.
- [ ] Jurnal, perubahan saldo fisik, attachment, dan audit log rollback bersama bila satu langkah gagal.
- [ ] Record transfer immutable; koreksi menggunakan transaksi pembalik.

**Verification:**

- [ ] Uji transfer berhasil, total kas tetap, sumber berkurang, tujuan bertambah.
- [ ] Uji rekening sama, nonaktif, saldo kurang, upload gagal, dan simulasi kegagalan di tengah transaksi.

**Dependencies:** Tasks 9-11

**Files likely touched:** `server/validation/transfer.ts`, `server/services/transfer-service.ts`, `server/repositories/transaction-repository.ts`, `server/api/admin/transfers.post.ts`, `shared/types/transfer.ts`

**Estimated scope:** Medium (3-5 files)

### Checkpoint: Keuangan inti

- [ ] Cash in, cash out, pemulihan defisit, hibah, dan transfer dapat diproses end-to-end.
- [ ] Semua transaksi memiliki bukti, actor, timestamp, dan audit log.
- [ ] Jurnal debit/kredit seimbang dan aturan saldo teruji.
- [ ] Rollback mencegah transaksi parsial.

### Phase 5: Read API dan UI fitur

### Task 14: Implementasi authenticated read API dan laporan

**Description:** Buat endpoint baca terproteksi untuk summary, feed transaksi, dashboard pemulihan kas, rekening manual, anggota, dan mutasi anggota. DTO publik hanya mengembalikan data yang sesuai role.

**Acceptance criteria:**

- [ ] Semua endpoint memanggil session guard sebelum query.
- [ ] Summary menghitung Kas Utama, Piutang, Modal Hibah, defisit, dan status pemulihan sesuai rumus PRD.
- [ ] Feed memiliki pagination, urutan terbaru, tipe transaksi, rekening audit yang aman, dan link bukti.
- [ ] Member hanya melihat mutasinya sendiri; pengurus/admin mengikuti kewenangan yang ditentukan.

**Verification:**

- [ ] Cocokkan output dengan fixture jurnal.
- [ ] Uji role, pagination, dataset kosong, transfer, defisit, dan data sensitif.

**Dependencies:** Tasks 8, 11-13

**Files likely touched:** `server/api/dashboard/*`, `server/api/transactions/*`, `server/api/members/*`, `server/repositories/report-repository.ts`, `shared/types/report.ts`

**Estimated scope:** Large (5+ files; pecah per endpoint)

### Task 15: Implementasi login/register/2FA dan launchpad UI final

**Description:** Selesaikan halaman auth berdasarkan flow, termasuk login semua role, register sesuai kebijakan, challenge/setup 2FA, logout, session expired, dan launchpad dengan menu role-aware.

**Acceptance criteria:**

- [ ] Login dan logout mengarahkan sesuai flow.
- [ ] 2FA setup, challenge, backup code, dan trust device mengikuti kemampuan Better Auth yang dipakai.
- [ ] Launchpad menampilkan tautan hanya untuk role yang berhak.
- [ ] Error auth dan expired session memiliki pesan yang dapat dipahami.

**Verification:**

- [ ] Uji seluruh alur auth pada browser mobile dan desktop.
- [ ] Uji akses langsung route tanpa session dan setelah session expired.

**Dependencies:** Tasks 2-4

**Files likely touched:** `app/pages/login.vue`, `app/pages/register.vue`, `app/pages/two-factor.vue`, `app/pages/index.vue`, `app/pages/app/security.vue`, `app/components/AppShell.vue`

**Estimated scope:** Medium (3-5 files)

### Task 16: Implementasi dashboard dan lookup anggota UI

**Description:** Bangun dashboard terautentikasi dengan kartu summary, status pemulihan kas, feed transaksi, preview bukti, pencarian anggota, simpanan bersih, dan sisa piutang.

**Acceptance criteria:**

- [ ] Dashboard menampilkan nilai summary dan status defisit dari API.
- [ ] Feed memiliki loading, empty, error, pagination, dan preview bukti.
- [ ] Lookup anggota memakai auto-complete nama/ID dan menampilkan data sesuai role.
- [ ] Format Rupiah, tanggal, warna status, dan layout mengikuti design guideline.

**Verification:**

- [ ] Uji dashboard dengan fixture normal, defisit, dan data kosong.
- [ ] Uji mobile, desktop shell, slow network, serta link kembali ke launchpad.

**Dependencies:** Task 14-15

**Files likely touched:** `app/pages/dashboard/index.vue`, `app/components/dashboard/*`, `app/components/member/*`, `app/composables/*`, `app/types/*`

**Estimated scope:** Large (5+ files; pecah dashboard dan lookup)

### Task 17: Implementasi form transaksi, pemulihan, dan transfer

**Description:** Buat panel input untuk pengurus/admin dengan pemilihan tipe, auto-complete anggota, format ribuan, pemilihan rekening aktif, upload bukti, field pemulihan defisit, dan form transfer admin.

**Acceptance criteria:**

- [ ] Field rekening berubah sesuai arah transaksi; transfer menampilkan sumber dan tujuan serta menolak pilihan sama.
- [ ] Nominal terformat di UI tetapi dikirim sebagai integer.
- [ ] Upload menampilkan progress/error dan submit tidak dapat digandakan.
- [ ] Form pemulihan meminta referensi rapat/notulen dan tujuan hibah sesuai aturan.
- [ ] Setelah sukses, UI memperbarui summary/feed dan menampilkan ID transaksi.

**Verification:**

- [ ] Uji validasi client dan server untuk setiap tipe transaksi.
- [ ] Uji submit ganda, saldo kurang, attachment gagal, session expired, dan rollback.

**Dependencies:** Tasks 9-13, 14-16

**Files likely touched:** `app/pages/transactions/index.vue`, `app/pages/transactions/new.vue`, `app/pages/transfers/new.vue`, `app/components/transactions/*`, `app/components/transfers/*`

**Estimated scope:** Large (5+ files; pecah per form)

### Task 18: Implementasi pengaturan rekening dan audit log UI

**Description:** Buat halaman admin untuk mengelola rekening manual dan membaca log aktivitas. Tampilkan perubahan sebagai read-only history dengan filter, pagination, dan layout tabel/card yang nyaman di mobile.

**Acceptance criteria:**

- [ ] Hanya admin melihat menu dan halaman pengaturan rekening serta audit log.
- [ ] Rekening dapat dibuat, diedit, dinonaktifkan, dan ditolak untuk delete jika memiliki riwayat.
- [ ] Audit log menampilkan waktu, event, actor, ringkasan, target, filter tanggal/event/actor, dan pagination.
- [ ] Tidak ada kontrol edit/delete log.

**Verification:**

- [ ] Uji semua role dan state rekening.
- [ ] Uji filter log, empty/error state, scroll tabel mobile, dan direct URL access.

**Dependencies:** Tasks 7, 9, 14-15

**Files likely touched:** `app/pages/settings/manual-accounts.vue`, `app/pages/admin/audit-logs.vue`, `app/components/settings/*`, `app/components/audit-log/*`, `app/types/*`

**Estimated scope:** Large (5+ files; pecah rekening dan audit log)

### Checkpoint: Alur produk

- [ ] Pengguna login lalu masuk launchpad.
- [ ] Member membaca dashboard dan data miliknya.
- [ ] Pengurus mencatat transaksi sesuai kewenangannya.
- [ ] Admin mengelola rekening, user/role, pemulihan defisit, transfer, dan audit log.
- [ ] Semua alur responsif pada mobile dan desktop.

### Phase 6: Quality dan release

### Task 19: Tambahkan test suite finansial dan authorization

**Description:** Buat test yang memeriksa validation schema, repository/service, saldo double-entry, pemulihan defisit, transfer atomik, audit log, session guard, dan role authorization. Gunakan fixture finansial yang dapat diulang.

**Acceptance criteria:**

- [ ] Setiap tipe transaksi memiliki kasus valid dan invalid.
- [ ] Transfer memiliki test saldo sumber, tujuan, rekening sama, rekening nonaktif, saldo kurang, rollback, dan total kas tetap.
- [ ] Defisit dan alokasi hibah memiliki test batas maksimum dan koreksi.
- [ ] Guest/user ditolak pada endpoint yang memerlukan pengurus/admin.

**Verification:**

- [ ] Tambahkan script test dan jalankan seluruh suite.
- [ ] Jalankan test terisolasi untuk service sebelum test integrasi.

**Dependencies:** Tasks 7-18

**Files likely touched:** `tests/*`, `server/**/*.test.ts`, `app/**/*.test.ts`, `package.json`, `vitest.config.*`

**Estimated scope:** Large (5+ files; pecah per domain)

### Task 20: Hardening, observability, dan error handling

**Description:** Standarkan error response, logging aman, validasi ukuran/payload, idempotency, query limit, rate limit yang relevan, dan monitoring dasar. Pastikan audit log tidak menjadi sumber kebocoran data.

**Acceptance criteria:**

- [ ] Error client tidak membocorkan SQL, secret, stack trace, atau kredensial.
- [ ] Double submit tidak menghasilkan transaksi ganda.
- [ ] Endpoint read memiliki pagination/batas hasil.
- [ ] Log server dan audit log menghapus data sensitif.
- [ ] Semua mutation memiliki actor dan event audit yang sesuai.

**Verification:**

- [ ] Uji payload besar, input tidak valid, request paralel, dan session expired.
- [ ] Tinjau log development/staging untuk secret atau attachment content.

**Dependencies:** Tasks 11-19

**Files likely touched:** `server/utils/errors.ts`, `server/middleware/*`, `server/services/*`, `server/api/*`, `shared/types/errors.ts`

**Estimated scope:** Medium (3-5 files)

### Task 21: Deployment Cloudflare Pages, Turso, Google Drive, dan recovery

**Description:** Siapkan konfigurasi production, environment variables, migration Turso, Google Drive service account, PWA HTTPS, backup/restore, seed, dan smoke test deployment.

**Acceptance criteria:**

- [ ] Build Cloudflare Pages berhasil dengan konfigurasi edge yang didukung dependency.
- [ ] Turso menerima migration tanpa kehilangan data.
- [ ] Google Drive upload production mengarah ke folder yang benar.
- [ ] HTTPS, manifest, service worker, auth callback, dan session idle timeout bekerja di production.
- [ ] Prosedur backup, restore, rollback migration, dan rotasi secret terdokumentasi.

**Verification:**

- [ ] Jalankan `pnpm build`, smoke test staging, dan deploy preview.
- [ ] Uji login, dashboard, transaksi, transfer, audit log, PWA install, dan recovery database.

**Dependencies:** Task 20

**Files likely touched:** `nuxt.config.ts`, `.env.example`, `.github/workflows/*`, deployment configuration, operational documentation

**Estimated scope:** Medium (3-5 files)

### Checkpoint: Complete

- [ ] Semua acceptance criteria task terpenuhi.
- [ ] `pnpm lint`, `pnpm typecheck`, test suite, dan `pnpm build` lulus.
- [ ] Migration dan seed tervalidasi pada SQLite serta Turso staging.
- [ ] Auth, role, dashboard, transaksi, pemulihan defisit, transfer, attachment, rekening, audit log, PWA, dan deployment diuji end-to-end.
- [ ] Dokumentasi konfigurasi, recovery, dan keputusan open question sudah diperbarui.

## Peluang paralelisasi

- Setelah Task 5-6 stabil, Task 7, Task 8, Task 9, dan sebagian Task 10 dapat dikerjakan paralel karena kontrak schema sudah tersedia.
- Setelah kontrak transaksi Task 11 disetujui, UI dashboard dan form dapat dikerjakan paralel dengan laporan read API selama DTO tidak berubah.
- Test fixture validation dapat dibuat paralel dengan service, tetapi test integrasi transfer dan pemulihan harus menunggu service selesai.
- Migration/schema, perubahan constants, dan perubahan kontrak API tetap dikerjakan berurutan agar tidak terjadi drift.

## Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Starter saat ini belum memiliki domain aplikasi | Tinggi | Selesaikan audit baseline dan kerjakan dependency dari auth/schema sebelum fitur UI. |
| Perbedaan konfigurasi Better Auth guide dan dependency aktual | Tinggi | Jadikan guide proyek sebagai acuan, verifikasi versi paket, dan uji auth sebelum schema domain. |
| Saldo rekening fisik dihitung dari metadata transaksi | Tinggi | Tetapkan satu fungsi perhitungan saldo dan transaksi database atomik; tambahkan test saldo transfer. |
| Upload Google Drive gagal di tengah mutasi | Tinggi | Upload sebelum commit dan cleanup file bila commit gagal; jangan menyimpan jurnal tanpa attachment valid. |
| Double submit transfer/transaksi | Tinggi | Idempotency key/ID transaksi unik dan disable submit selama request. |
| Session offline atau service worker menyajikan data basi | Tinggi | Cache hanya shell/asset aman; semua API session dan mutation network-only. |
| Hibah menutup defisit lebih besar dari saldo tersedia | Tinggi | Validasi server berdasarkan saldo hibah dan defisit tersisa dalam transaksi atomik. |
| Audit log menyimpan data rahasia | Sedang | Whitelist metadata event dan redaksi password, PIN, token, serta isi file. |
| UI desktop mengabaikan alur mobile | Sedang | Gunakan shell maksimum, breakpoint Tailwind, tabel scroll/card, dan uji viewport mobile. |
| SQLite lokal berbeda dari Turso | Sedang | Jalankan migration dan test transaksi pada kedua driver sebelum release. |

## Pertanyaan terbuka

- [ ] Apakah semua pendaftar baru boleh memilih `member`, atau role awal selalu `member` dan hanya admin yang dapat menaikkan ke `pengurus`?
- [ ] Apakah pengurus boleh mencatat seluruh transaksi operasional atau harus dibatasi berdasarkan tipe transaksi tertentu?
- [ ] Apakah nomor rekening lengkap boleh ditampilkan kepada member, atau harus disamarkan pada dashboard/feed?
- [ ] Apakah batas ukuran dan tipe file bukti perlu ditetapkan sekarang untuk Google Drive?
- [ ] Apakah saldo rekening manual akan selalu dihitung dari jurnal, atau perlu materialized balance setelah volume transaksi meningkat?
- [ ] Apakah koreksi transaksi memerlukan field `reversalOfTransactionId` dan alasan koreksi wajib pada schema final?

