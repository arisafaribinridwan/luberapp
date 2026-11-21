# Luber

Aplikasi pencatatan keuangan komunitas berbasis Nuxt 4. Repository saat ini masih berada pada tahap fondasi; halaman utama masih template Nuxt UI dan belum dilindungi session.

## Menjalankan proyek

Gunakan Node.js 20 atau lebih baru dan pnpm versi yang tertera di `package.json`.

```bash
pnpm install
pnpm dev
```

Server development tersedia di `http://localhost:3000`.

## Verifikasi

```bash
pnpm build
pnpm lint
pnpm typecheck
```

Untuk menjalankan hasil build dalam mode production, sediakan `NUXT_BETTER_AUTH_SECRET` minimal 32 karakter sebelum `pnpm preview`. Simpan secret di environment lokal atau platform deployment, bukan di repository.

## Rencana implementasi

- [Task plan](.doc/task-plan.md)
- [Audit baseline Task 1](.doc/task-1-baseline.md)
- [Spesifikasi produk](.doc/prd.md)

Kode aplikasi berada di `app/`, kode backend di `server/`, dan tipe/constants yang digunakan kedua sisi akan berada di `shared/`.
