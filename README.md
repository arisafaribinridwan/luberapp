# Luber

Aplikasi pencatatan keuangan komunitas berbasis Nuxt 4. Fondasi autentikasi dan role sudah tersedia; fitur keuangan serta launchpad lengkap masih menunggu task berikutnya.

## Menjalankan proyek

Gunakan Node.js 20 atau lebih baru dan pnpm versi yang tertera di `package.json`. Salin `.env.example` menjadi `.env`, lalu ganti `NUXT_BETTER_AUTH_SECRET` dengan secret acak minimal 32 karakter.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Server development tersedia di `http://localhost:3000`. Pendaftar baru mendapat role `member`. Login memakai email/password. Buat akun admin awal dengan `pnpm exec auth create-admin --config auth.ts` sebelum mengelola role melalui plugin Better Auth. Halaman `/security` menyediakan setup 2FA dengan kunci manual dan kode cadangan.

Jika schema auth berubah, jalankan `pnpm exec auth generate --config auth.ts --output server/database/schema/auth.ts -y`, lalu `pnpm db:generate` dan `pnpm db:migrate`. Migration yang sudah diterapkan harus dipertahankan sebagai riwayat.

## Verifikasi

```bash
pnpm build
pnpm lint
pnpm typecheck
```

Untuk menjalankan hasil build dalam mode production, sediakan `NUXT_BETTER_AUTH_SECRET` minimal 32 karakter, `NUXT_PUBLIC_SITE_URL`, dan database yang sudah dimigrasi sebelum `pnpm preview`. Simpan secret di environment lokal atau platform deployment, bukan di repository.

## Rencana implementasi

- [Task plan](.doc/task-plan.md)
- [Audit baseline Task 1](.doc/task-1-baseline.md)
- [Spesifikasi produk](.doc/prd.md)

Kode aplikasi berada di `app/`, kode backend di `server/`, dan tipe/constants yang digunakan kedua sisi akan berada di `shared/`.
