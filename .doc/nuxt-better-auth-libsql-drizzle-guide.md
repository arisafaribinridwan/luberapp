# Boilerplate Nuxt: Better Auth + Role (member/admin) + 2FA + SQLite (libSQL) + Drizzle ORM 1.0

> Panduan step-by-step yang bisa dipakai ulang setiap membuat aplikasi Nuxt baru.
> Stack: **Nuxt 4**, modul **`@nuxtjs/better-auth`**, **Better Auth 1.7**, plugin **admin** (role & manajemen user) dan **two-factor** (TOTP + backup codes), database **SQLite lokal** lewat **`@libsql/client`**, dan **Drizzle ORM 1.0 RC** yang dikelola sendiri (tanpa NuxtHub).
> Diperbarui 20 November 2026 berdasarkan dokumentasi Nuxt Better Auth, Better Auth, dan Drizzle.

---

## Daftar Isi

1. [Gambaran umum & versi](#1-gambaran-umum--versi)
2. [Buat project & install dependency](#2-buat-project--install-dependency)
3. [Environment variable](#3-environment-variable)
4. [Konfigurasi `nuxt.config.ts` (route rules per role)](#4-konfigurasi-nuxtconfigts-route-rules-per-role)
5. [Koneksi libSQL](#5-koneksi-libsql)
6. [Definisi role (`member` dan `admin`)](#6-definisi-role-member-dan-admin)
7. [File `auth.ts` untuk CLI Better Auth](#7-file-authts-untuk-cli-better-auth)
8. [Generate skema Drizzle](#8-generate-skema-drizzle)
9. [drizzle-kit, migrasi, dan instance `db`](#9-drizzle-kit-migrasi-dan-instance-db)
10. [Konfigurasi auth server](#10-konfigurasi-auth-server)
11. [Konfigurasi auth client](#11-konfigurasi-auth-client)
12. [Helper role (composable & util server)](#12-helper-role-composable--util-server)
13. [Halaman-halaman UI](#13-halaman-halaman-ui)
14. [Lindungi API server](#14-lindungi-api-server)
15. [Membuat admin pertama](#15-membuat-admin-pertama)
16. [Checklist pengujian](#16-checklist-pengujian)
17. [Menambah role baru & mengatur halaman per role](#17-menambah-role-baru--mengatur-halaman-per-role)
18. [Mengubah plugin atau skema di kemudian hari](#18-mengubah-plugin-atau-skema-di-kemudian-hari)
19. [Troubleshooting](#19-troubleshooting)
20. [Catatan production](#20-catatan-production)
21. [Memakai boilerplate ini di project baru](#21-memakai-boilerplate-ini-di-project-baru)
22. [Referensi](#22-referensi)

---

## 1. Gambaran umum & versi

**Fitur**

- Register dan login email/password
- Dua role bawaan: **`member`** (default untuk setiap pendaftar baru) dan **`admin`**
- Halaman dan API yang dibatasi per role
- Setup 2FA (TOTP + QR + backup codes), challenge 2FA saat login, trust device
- Panel admin: daftar user (search + pagination), ubah role, ban/unban, revoke sesi
- Panduan menambah role baru beserta halaman khususnya

**Versi**

```json
{
  "dependencies": {
    "better-auth": "^1.7.7",
    "@better-auth/drizzle-adapter": "^1.7.7",
    "drizzle-orm": "1.0.0-rc.4",
    "@libsql/client": "^0.18.0"
  },
  "devDependencies": {
    "drizzle-kit": "1.0.0-rc.4"
  }
}
```

Nuxt 4 memerlukan Node.js 20 atau lebih baru.

**Komponen**

| Komponen | Peran |
| --- | --- |
| `@nuxtjs/better-auth` | Modul Nuxt: composables, route protection, handler `/api/auth/**`, helper server |
| `better-auth` | Library inti (peer dependency modul) + plugin `admin` dan `twoFactor` |
| `@better-auth/drizzle-adapter` | Adapter Drizzle. Entry `relations-v2` dipakai untuk Drizzle 1.0 |
| `drizzle-orm` / `drizzle-kit` 1.0 RC | ORM dan tooling migrasi (relations memakai `defineRelations`) |
| `@libsql/client` | Driver SQLite untuk file lokal |
| `auth` (CLI Better Auth) | Men-generate skema Drizzle dari konfigurasi plugin |

**Aturan penting**

- Modul **tidak** membuat skema otomatis. Anda men-generate skema, membuat migrasi, dan menjalankannya.
- **Jangan** set `secret` dan `baseURL` di `defineServerAuth`. Modul menyuntikkannya sendiri.
- CLI Better Auth membaca instance dari file `auth.ts`, **bukan** dari `server/auth.config.ts`. Karena itu ada file `auth.ts` khusus CLI, dan isinya harus **sama** dengan `server/auth.config.ts`.
- Adapter yang dipakai selalu **`@better-auth/drizzle-adapter/relations-v2`**. Adapter inilah yang membuat skema hasil generate memakai `defineRelationsPart` (kompatibel dengan Drizzle 1.0).
- Satu user memiliki **satu role** (string). Lihat [bagian 17](#17-menambah-role-baru--mengatur-halaman-per-role) untuk catatan multi-role.

**Struktur akhir project**

```
nuxt-auth-boilerplate/
├─ .env
├─ auth.ts                         ← hanya untuk CLI generate skema
├─ drizzle.config.ts
├─ nuxt.config.ts
├─ shared/
│  └─ auth/
│     └─ permissions.ts            ← daftar role (dipakai server, client, CLI)
├─ app/
│  ├─ app.vue
│  ├─ auth.config.ts               ← config client Better Auth
│  ├─ composables/
│  │  └─ useRole.ts                ← helper cek role di UI
│  └─ pages/
│     ├─ index.vue              ← launchpad utama setelah login
│     ├─ login.vue
│     ├─ register.vue
│     ├─ two-factor.vue            ← challenge 2FA saat login
│     ├─ dashboard/
│     │  ├─ index.vue              ← dashboard (semua user login)
│     │  └─ security.vue           ← setup 2FA
│     ├─ member/
│     │  └─ index.vue              ← area member (member + admin)
│     └─ admin/
│        └─ index.vue              ← manajemen user (admin)
└─ server/
   ├─ auth.config.ts               ← config server Better Auth
   ├─ api/
   │  ├─ admin/stats.get.ts
   │  └─ member/me.get.ts
   ├─ utils/
   │  └─ require-role.ts           ← helper cek role di API
   └─ db/
      ├─ libsql.ts                 ← koneksi libSQL (client)
      ├─ index.ts                  ← instance Drizzle + relations
      ├─ auth-schema.ts            ← hasil generate (tabel + authRelations)
      └─ migrations/               ← hasil drizzle-kit
```

---

## 2. Buat project & install dependency

```bash
pnpm dlx nuxi@latest init nuxt-auth-boilerplate
cd nuxt-auth-boilerplate

# Drizzle dipasang persis di versi RC yang dipakai panduan ini
pnpm add -E drizzle-orm@1.0.0-rc.4
pnpm add better-auth@^1.7.7 @better-auth/drizzle-adapter@^1.7.7 @libsql/client@^0.18.0 qrcode

# Tooling
pnpm add -D -E drizzle-kit@1.0.0-rc.4
pnpm add -D @types/qrcode

# Pasang modul Better Auth (menambah ke nuxt.config & membuat file config awal)
pnpm dlx nuxi module add @nuxtjs/better-auth
```

Catatan:

- `better-auth` adalah peer dependency modul. Jaga versi mayornya selaras, dan samakan versi `@better-auth/drizzle-adapter` dengan `better-auth`.
- Adapter Drizzle Better Auth menerima Drizzle `^0.45.2` atau `>=1.0.0-rc.1 <2.0.0`, jadi `1.0.0-rc.4` didukung.
- `@libsql/client` memakai binary prebuilt, jadi tidak perlu kompilasi native.
- `nuxi module add` bisa membuat `server/auth.config.ts` dan `app/auth.config.ts`. Isinya akan ditimpa pada langkah berikutnya.
- Pastikan `.data` ada di `.gitignore` (template Nuxt biasanya sudah memuatnya).

---

## 3. Environment variable

Buat atau lengkapi file `.env`:

```ini
# Wajib: minimal 32 karakter, high entropy
NUXT_BETTER_AUTH_SECRET=isi_dengan_hasil_generate

# URL aplikasi (di dev boleh kosong karena diinfer, tapi sebaiknya diisi)
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Database SQLite lokal (file) lewat libSQL. Awalan "file:" wajib untuk libSQL
DATABASE_URL=file:.data/sqlite.db
```

Cara membuat secret:

```bash
openssl rand -base64 32
# atau tanpa openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Di production, `NUXT_PUBLIC_SITE_URL` **wajib** diisi dengan domain Anda jika host tidak menyediakan variabel URL platform (`VERCEL_URL`, `CF_PAGES_URL`, `URL` di Netlify). Tanpa itu, inisialisasi auth gagal.

---

## 4. Konfigurasi `nuxt.config.ts` (route rules per role)

```ts
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  devtools: { enabled: true },

  modules: ['@nuxtjs/better-auth'],

  auth: {
    redirects: {
      login: '/login',
      authenticated: '/', // launchpad setelah sign in / sign up sukses
      logout: '/login',
    },
    preserveRedirect: true, // tambahkan ?redirect=... saat dilempar ke /login
  },

  routeRules: {
    // Hanya tamu (belum login)
    '/login': { auth: { only: 'guest', redirectTo: '/' } },
    '/register': { auth: { only: 'guest', redirectTo: '/' } },

    // Semua user yang sudah login, apa pun rolenya
    '/': { auth: { only: 'user', redirectTo: '/login' } },
    '/dashboard/**': { auth: { only: 'user', redirectTo: '/login' } },

    // Hanya role tertentu. Array = OR (salah satu role cukup)
    '/member/**': { auth: { user: { role: ['member', 'admin'] }, redirectTo: '/' } },
    '/admin/**': { auth: { user: { role: 'admin' }, redirectTo: '/' } },
  },
})
```

Cara membaca aturan:

| Bentuk | Arti |
| --- | --- |
| `only: 'guest'` | Hanya yang belum login |
| `only: 'user'` | Semua yang sudah login |
| `user: { role: 'admin' }` | Role harus tepat `admin` |
| `user: { role: ['member', 'admin'] }` | Role salah satu dari daftar (OR) |
| `user: { role: 'admin', emailVerified: true }` | Beberapa field sekaligus (AND) |
| `redirectTo` | Tujuan redirect bila akses ditolak |

> **Penting:** route rules hanya untuk UX (redirect). Batas keamanan sebenarnya adalah pengecekan di server (`requireUserSession` / `requireRole`, lihat [bagian 14](#14-lindungi-api-server)).

Halaman `/two-factor` (challenge login) sengaja **tidak** diberi aturan `auth`, karena saat itu user belum punya sesi penuh.

---

## 5. Koneksi libSQL

Client dan instance `db` dipisah. Alasannya: `db` membawa `authRelations` dari file hasil generate (`auth-schema.ts`), sedangkan CLI harus bisa berjalan **sebelum** file itu ada. Jadi `auth.ts` untuk CLI hanya boleh bergantung pada client.

`server/db/libsql.ts`:

```ts
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL ?? 'file:.data/sqlite.db'

// libSQL tidak membuat folder otomatis untuk file lokal
// (mengasumsikan bentuk relatif: file:.data/sqlite.db)
if (url.startsWith('file:')) {
  mkdirSync(dirname(url.slice('file:'.length)), { recursive: true })
}

export const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN, // hanya perlu untuk Turso/remote
})
```

Catatan:

- Import default `@libsql/client` memakai modul `node`, yang mendukung protokol `file:`. Jangan memakai `@libsql/client/web` untuk file lokal.
- Client lokal memakai connection pool. Jika muncul `SQLITE_BUSY` saat dev server, Drizzle Studio, dan migrasi berjalan bersamaan, hentikan proses yang tidak dipakai.

---

## 6. Definisi role (`member` dan `admin`)

Daftar role dibuat **satu kali** di folder `shared/`, lalu diimpor oleh config server, config client, dan CLI. Dengan begitu tidak ada role yang terdaftar di satu sisi saja.

`shared/auth/permissions.ts`:

```ts
import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

export const ac = createAccessControl(defaultStatements)

/**
 * Daftar semua role aplikasi.
 * - admin  : semua hak plugin admin (kelola user & sesi)
 * - member : tanpa hak mengelola user (role default pendaftar baru)
 *
 * Menambah role baru = menambah satu baris di sini (lihat bagian 17).
 */
export const roles = {
  admin: ac.newRole({ ...adminAc.statements }),
  member: ac.newRole({ user: [], session: [] }),
}

export type AppRole = keyof typeof roles

/** Role untuk pendaftar baru */
export const defaultRole: AppRole = 'member'

/** Role yang boleh memakai endpoint plugin admin (kelola user) */
export const adminRoles: AppRole[] = ['admin']
```

Catatan:

- `defaultRole` menjadi nilai default kolom `role` pada skema hasil generate dan role untuk setiap pendaftar baru.
- Hanya role di `adminRoles` yang dianggap admin oleh plugin admin dan boleh memakai endpoint seperti `listUsers` dan `setRole`.
- Impor memakai **path relatif** di file config (bukan alias), karena file config dibaca oleh modul dan CLI di luar pipeline Vite.

---

## 7. File `auth.ts` untuk CLI Better Auth

Buat `auth.ts` di **root project**. File ini hanya dipakai CLI untuk men-generate skema.

Dua hal penting:

1. `drizzleAdapter` diimpor dari **`@better-auth/drizzle-adapter/relations-v2`**.
2. File ini mengimpor `./server/db/libsql`, **bukan** `./server/db/index.ts` (yang bergantung pada file hasil generate).

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { admin, twoFactor } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/libsql'
import { client } from './server/db/libsql' // path relatif, bukan alias Nuxt
import { ac, roles, defaultRole, adminRoles } from './shared/auth/permissions'

const db = drizzle({ client })

// ⚠️ Harus SAMA dengan server/auth.config.ts (opsi & plugin),
// supaya skema hasil generate cocok dengan runtime.
export const auth = betterAuth({
  appName: 'Nuxt Auth Boilerplate',
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  plugins: [
    admin({ ac, roles, defaultRole, adminRoles }),
    twoFactor(),
  ],
})
```

---

## 8. Generate skema Drizzle

```bash
npx auth@latest generate --config auth.ts --output server/db/auth-schema.ts -y
```

Opsi: `--config` (file konfigurasi), `--output` (lokasi hasil), `-y` (lewati konfirmasi).

Hasilnya `server/db/auth-schema.ts` yang berisi tabel:

| Tabel | Keterangan |
| --- | --- |
| `user` | Inti + kolom admin (`role`, `banned`, `banReason`, `banExpires`) + `twoFactorEnabled` |
| `session` | Sesi + `impersonatedBy` (admin) |
| `account` | Akun credential / OAuth |
| `verification` | Token verifikasi |
| `twoFactor` | Secret TOTP dan backup codes |

**Periksa hasilnya:**

- Kolom `role` pada tabel `user` memiliki default **`member`** (berasal dari `defaultRole`).
- Relations memakai **`defineRelationsPart`** dan diekspor sebagai **`authRelations`**:

  ```ts
  import { defineRelationsPart } from 'drizzle-orm'
  // ...
  export const authRelations = defineRelationsPart(
    { user, session, account, verification, twoFactor },
    (r) => ({ /* ... */ }),
  )
  ```

- Tidak ada `import { relations } from 'drizzle-orm'`.

Untuk memastikan CLI membaca config dengan benar: `npx auth@latest info --config auth.ts`.

---

## 9. drizzle-kit, migrasi, dan instance `db`

### 9a. Konfigurasi drizzle-kit

`drizzle.config.ts` di root:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/auth-schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:.data/sqlite.db', // "file:" wajib untuk libSQL
  },
})
```

Dengan `dialect: 'sqlite'`, drizzle-kit memilih driver SQLite yang tersedia di project (libSQL). drizzle-kit hanya membaca definisi tabel. Relations tidak memengaruhi migrasi.

### 9b. Buat dan terapkan migrasi

```bash
npx drizzle-kit generate   # membuat folder migrasi di server/db/migrations/
npx drizzle-kit migrate    # menerapkan ke .data/sqlite.db
```

Setiap migrasi berada di folder sendiri (SQL + snapshot). Commit seluruh folder `server/db/migrations/` ke git.

Untuk eksperimen cepat saat belajar, `npx drizzle-kit push` juga bisa menyinkronkan skema langsung. Untuk project sungguhan, pakai `generate` + `migrate`.

Melihat isi database:

```bash
npx drizzle-kit studio
```

### 9c. Instance `db` (dengan relations)

Setelah `auth-schema.ts` ada, buat `server/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/libsql'
import { client } from './libsql'
import { authRelations } from './auth-schema'

export const db = drizzle({ client, relations: authRelations })
```

Jika nanti Anda punya relations aplikasi sendiri (`defineRelations`), gabungkan dengan men-spread bagian `defineRelationsPart` **setelah** relations penuh:

```ts
import { relations } from './app-schema'
export const db = drizzle({ client, relations: { ...relations, ...authRelations } })
```

---

## 10. Konfigurasi auth server

`server/auth.config.ts`:

```ts
import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { admin, twoFactor } from 'better-auth/plugins'
import { db } from './db'
import * as schema from './db/auth-schema'
import { ac, roles, defaultRole, adminRoles } from '../shared/auth/permissions'

export default defineServerAuth({
  // Dipakai sebagai nama "issuer" di aplikasi authenticator
  appName: 'Nuxt Auth Boilerplate',

  database: drizzleAdapter(db, { provider: 'sqlite', schema }),

  emailAndPassword: { enabled: true },

  plugins: [
    admin({ ac, roles, defaultRole, adminRoles }), // role, ban, impersonation, manajemen user
    twoFactor(),                                   // TOTP + backup codes + trusted device
  ],
})
```

Jangan menambahkan `secret` atau `baseURL`. `schema` berisi tabel dan `authRelations` dari file hasil generate.

### Opsional: database joins

Better Auth bisa memakai join database untuk mengurangi jumlah query (misalnya `/get-session`). Opsi ini ada di `advanced.database.joins` dan bergantung pada relations yang sudah digenerate. Jika ingin mengaktifkannya, tambahkan di **kedua** file (`auth.ts` dan `server/auth.config.ts`), lalu generate ulang skema:

```ts
advanced: { database: { joins: true } },
```

---

## 11. Konfigurasi auth client

`app/auth.config.ts`. Setiap plugin server harus punya padanan client:

```ts
import { navigateTo } from '#imports'
import { defineClientAuth } from '@nuxtjs/better-auth/config'
import { adminClient, twoFactorClient } from 'better-auth/client/plugins'
import { ac, roles } from '../shared/auth/permissions'

export default defineClientAuth({
  plugins: [
    adminClient({ ac, roles }),
    twoFactorClient({
      // Dipanggil saat user punya 2FA aktif dan perlu verifikasi kode
      onTwoFactorRedirect() {
        navigateTo('/two-factor')
      },
    }),
  ],
})
```

Setelah langkah ini, jalankan `pnpm dev`. Aplikasi seharusnya menyala tanpa error "missing config".

---

## 12. Helper role (composable & util server)

### UI: `app/composables/useRole.ts`

Auto-import di semua halaman dan komponen.

```ts
import type { AppRole } from '../../shared/auth/permissions'

export function useRole() {
  const { user } = useUserSession()

  const role = computed(() => (user.value?.role ?? null) as AppRole | null)

  /** true jika role user termasuk salah satu role yang diberikan */
  const hasRole = (...allowed: AppRole[]) =>
    role.value !== null && allowed.includes(role.value)

  const isAdmin = computed(() => role.value === 'admin')

  return { role, hasRole, isAdmin }
}
```

Dipakai untuk menampilkan atau menyembunyikan menu. Ini hanya soal tampilan. Keamanan tetap di route rules dan API.

### Server: `server/utils/require-role.ts`

Auto-import di semua handler API.

```ts
import type { H3Event } from 'h3'
import type { AppRole } from '../../shared/auth/permissions'

/**
 * Wajib login dan memiliki salah satu role yang diberikan.
 * Melempar 401 bila belum login dan 403 bila role tidak sesuai.
 */
export function requireRole(event: H3Event, ...allowed: AppRole[]) {
  return requireUserSession(event, { user: { role: allowed } })
}
```

---

## 13. Halaman-halaman UI

Semua halaman memakai composable auto-import dari modul: `useUserSession`, `useSignIn`, `useSignUp`, `useSignOut`, `useAuthClient`, `runWithSessionRefresh`, serta `useRole` dari bagian 12.

### `app/app.vue`

```vue
<template>
  <NuxtPage />
</template>
```

### `app/pages/index.vue`

```vue
<template>
  <main>
    <h1>Nuxt Auth Boilerplate</h1>
    <NuxtLink to="/login">Login</NuxtLink> |
    <NuxtLink to="/register">Register</NuxtLink> |
    <NuxtLink to="/">Launchpad</NuxtLink>
  </main>
</template>
```

### `app/pages/register.vue`

Pendaftar baru otomatis mendapat role `member` (dari `defaultRole`).

```vue
<script setup lang="ts">
const name = ref('')
const email = ref('')
const password = ref('')
const { execute, status, error } = useSignUp('email')

async function submit() {
  // Setelah sukses & ter-autentikasi, otomatis redirect ke auth.redirects.authenticated
  await execute({ name: name.value, email: email.value, password: password.value })
}
</script>

<template>
  <main>
    <h1>Register</h1>
    <form @submit.prevent="submit">
      <input v-model="name" placeholder="Nama" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password (min. 8)" required />
      <button :disabled="status === 'pending'">Daftar</button>
    </form>
    <p v-if="error" role="alert">{{ error.message }}</p>
    <NuxtLink to="/login">Sudah punya akun?</NuxtLink>
  </main>
</template>
```

### `app/pages/login.vue`

```vue
<script setup lang="ts">
const email = ref('')
const password = ref('')
const { execute, status, error } = useSignIn('email')

// Jika 2FA aktif, twoFactorClient mengarahkan ke /two-factor.
// Jika tidak, redirect otomatis ke / (launchpad) atau ?redirect=... yang aman.
async function submit() {
  await execute({ email: email.value, password: password.value })
}
</script>

<template>
  <main>
    <h1>Login</h1>
    <form @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button :disabled="status === 'pending'">Masuk</button>
    </form>
    <p v-if="error" role="alert">{{ error.message }}</p>
    <NuxtLink to="/register">Buat akun</NuxtLink>
  </main>
</template>
```

Pesan untuk user yang di-ban juga muncul di `error.message`.

### `app/pages/two-factor.vue` (challenge saat login)

Halaman ini dipisah dari halaman setup. Saat challenge, user belum punya sesi, jadi tidak boleh dilindungi `auth: 'user'`.

```vue
<script setup lang="ts">
const client = useAuthClient()

const code = ref('')
const useBackup = ref(false)
const trustDevice = ref(false)
const loading = ref(false)
const error = ref('')

async function verify() {
  if (!client) return
  error.value = ''
  loading.value = true
  try {
    // runWithSessionRefresh: sinkronkan useUserSession() setelah sesi terbentuk
    const res = await runWithSessionRefresh(() =>
      useBackup.value
        ? client.twoFactor.verifyBackupCode({ code: code.value, trustDevice: trustDevice.value })
        : client.twoFactor.verifyTotp({ code: code.value, trustDevice: trustDevice.value }),
    )
    if (res?.error) {
      error.value = res.error.message ?? 'Kode tidak valid'
      return
    }
    await navigateTo('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <h1>Verifikasi 2 Langkah</h1>
    <form @submit.prevent="verify">
      <input
        v-model="code"
        :placeholder="useBackup ? 'Backup code' : 'Kode 6 digit dari authenticator'"
        autocomplete="one-time-code"
        required
      />
      <label>
        <input v-model="trustDevice" type="checkbox" />
        Percayai perangkat ini 30 hari
      </label>
      <button :disabled="loading">Verifikasi</button>
    </form>
    <button type="button" @click="useBackup = !useBackup">
      {{ useBackup ? 'Pakai kode authenticator' : 'Pakai backup code' }}
    </button>
    <p v-if="error" role="alert">{{ error }}</p>
  </main>
</template>
```

### `app/pages/index.vue` (launchpad, semua user login)

Menu muncul sesuai role.

```vue
<script setup lang="ts">
const { user } = useUserSession()
const { hasRole } = useRole()
const { execute: signOut, status } = useSignOut()
</script>

<template>
  <main>
    <h1>Launchpad</h1>
    <p>Menu utama untuk masuk ke dashboard dan area aplikasi sesuai role.</p>
    <p>Halo, {{ user?.name }} ({{ user?.email }})</p>
    <p>
      Role: <strong>{{ user?.role }}</strong> ·
      2FA: {{ user?.twoFactorEnabled ? 'aktif' : 'belum aktif' }}
    </p>

    <nav>
      <NuxtLink to="/security">Keamanan (2FA)</NuxtLink>
      <NuxtLink v-if="hasRole('member', 'admin')" to="/member"> | Area Member</NuxtLink>
      <NuxtLink v-if="hasRole('admin')" to="/admin"> | Admin</NuxtLink>
    </nav>

    <button :disabled="status === 'pending'" @click="signOut()">Sign out</button>
  </main>
</template>
```

### `app/pages/member/index.vue` (member + admin)

Contoh halaman yang dibatasi per role. Perlindungannya ada di route rule `/member/**` (bagian 4) dan di API `/api/member/me`.

```vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/member/me')
</script>

<template>
  <main>
    <h1>Area Member</h1>
    <p>Halaman ini hanya untuk role <code>member</code> dan <code>admin</code>.</p>
    <pre v-if="data">{{ data }}</pre>
    <p v-if="error" role="alert">{{ error.statusMessage }}</p>
    <NuxtLink to="/">← Launchpad</NuxtLink>
  </main>
</template>
```

### `app/pages/security.vue` (setup 2FA)

Alurnya: masukkan password, panggil `enable` untuk mendapat `totpURI` dan `backupCodes`, scan QR, lalu verifikasi satu kode. 2FA baru aktif setelah verifikasi itu.

```vue
<script setup lang="ts">
import QRCode from 'qrcode'

const client = useAuthClient()
const { user, fetchSession } = useUserSession()

const password = ref('')
const code = ref('')
const qrImage = ref('')
const backupCodes = ref<string[]>([])
const step = ref<'idle' | 'verify'>('idle')
const error = ref('')
const info = ref('')

async function startEnable() {
  if (!client) return
  error.value = ''
  info.value = ''
  const { data, error: err } = await client.twoFactor.enable({ password: password.value })
  if (err || !data || !('totpURI' in data)) {
    error.value = err?.message ?? 'Gagal memulai setup 2FA'
    return
  }
  // QR dirender lokal di browser. URI berisi secret, jangan kirim ke layanan QR pihak ketiga.
  qrImage.value = await QRCode.toDataURL(data.totpURI)
  backupCodes.value = data.backupCodes
  step.value = 'verify'
}

async function confirm() {
  if (!client) return
  error.value = ''
  const { error: err } = await client.twoFactor.verifyTotp({ code: code.value })
  if (err) {
    error.value = err.message ?? 'Kode salah'
    return
  }
  await fetchSession({ force: true }) // refresh user.twoFactorEnabled
  step.value = 'idle'
  qrImage.value = ''
  code.value = ''
  password.value = ''
  info.value = '2FA aktif. Simpan backup code di tempat aman.'
}

async function disable() {
  if (!client) return
  error.value = ''
  const { error: err } = await client.twoFactor.disable({ password: password.value })
  if (err) {
    error.value = err.message ?? 'Gagal menonaktifkan 2FA'
    return
  }
  await fetchSession({ force: true })
  backupCodes.value = []
  password.value = ''
  info.value = '2FA dinonaktifkan.'
}

async function regenerate() {
  if (!client) return
  error.value = ''
  const { data, error: err } = await client.twoFactor.generateBackupCodes({
    password: password.value,
  })
  if (err || !data) {
    error.value = err?.message ?? 'Gagal membuat backup code'
    return
  }
  backupCodes.value = data.backupCodes // kode lama otomatis dihapus
}
</script>

<template>
  <main>
    <h1>Keamanan Akun</h1>
    <p>
      Status 2FA:
      <strong>{{ user?.twoFactorEnabled ? 'Aktif' : 'Tidak aktif' }}</strong>
    </p>

    <section v-if="!user?.twoFactorEnabled && step === 'idle'">
      <input v-model="password" type="password" placeholder="Password Anda" />
      <button @click="startEnable">Aktifkan 2FA</button>
    </section>

    <section v-if="step === 'verify'">
      <p>1. Scan QR ini dengan Google Authenticator / Authy / 1Password:</p>
      <img v-if="qrImage" :src="qrImage" alt="QR 2FA" width="220" height="220" />
      <p>2. Simpan backup code (setiap kode hanya bisa dipakai sekali):</p>
      <ul>
        <li v-for="c in backupCodes" :key="c"><code>{{ c }}</code></li>
      </ul>
      <p>3. Masukkan kode 6 digit untuk mengonfirmasi:</p>
      <input v-model="code" inputmode="numeric" placeholder="123456" />
      <button @click="confirm">Konfirmasi</button>
    </section>

    <section v-if="user?.twoFactorEnabled">
      <input v-model="password" type="password" placeholder="Password Anda" />
      <button @click="regenerate">Buat ulang backup code</button>
      <button @click="disable">Nonaktifkan 2FA</button>
      <ul v-if="backupCodes.length">
        <li v-for="c in backupCodes" :key="c"><code>{{ c }}</code></li>
      </ul>
    </section>

    <p v-if="info">{{ info }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <NuxtLink to="/">← Kembali ke Launchpad</NuxtLink>
  </main>
</template>
```

### `app/pages/admin/index.vue` (manajemen user, admin)

Dropdown role dibuat dari `roles` di `shared/auth/permissions.ts`, jadi **role baru otomatis muncul** tanpa mengubah halaman ini. `useAuthClient()` bernilai `null` saat SSR, jadi data dimuat di `onMounted`.

```vue
<script setup lang="ts">
import { roles, type AppRole } from '../../../shared/auth/permissions'

type AdminUser = {
  id: string
  name: string
  email: string
  role?: string | null
  banned?: boolean | null
  twoFactorEnabled?: boolean | null
}

const client = useAuthClient()
const { user: me } = useUserSession()

const roleNames = Object.keys(roles) as AppRole[]

const users = ref<AdminUser[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const search = ref('')
const error = ref('')
const loading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

async function load() {
  if (!client) return
  loading.value = true
  error.value = ''
  const { data, error: err } = await client.admin.listUsers({
    query: {
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      ...(search.value
        ? { searchValue: search.value, searchField: 'email', searchOperator: 'contains' as const }
        : {}),
    },
  })
  loading.value = false
  if (err || !data) {
    error.value = err?.message ?? 'Gagal memuat user'
    return
  }
  users.value = data.users as unknown as AdminUser[]
  total.value = data.total
}

async function changeRole(u: AdminUser, role: AppRole) {
  const { error: err } = await client!.admin.setRole({ userId: u.id, role })
  if (err) error.value = err.message ?? 'Gagal mengubah role'
  await load()
}

async function toggleBan(u: AdminUser) {
  const res = u.banned
    ? await client!.admin.unbanUser({ userId: u.id })
    : await client!.admin.banUser({
        userId: u.id,
        banReason: 'Melanggar aturan',
        banExpiresIn: 60 * 60 * 24 * 7, // 7 hari
      })
  if (res.error) error.value = res.error.message ?? 'Gagal'
  await load()
}

async function revokeSessions(u: AdminUser) {
  await client!.admin.revokeUserSessions({ userId: u.id })
}

function onSearch() {
  page.value = 1
  load()
}

onMounted(load)
watch(page, load)
</script>

<template>
  <main>
    <h1>Admin: Manajemen User</h1>
    <NuxtLink to="/">← Launchpad</NuxtLink>

    <form @submit.prevent="onSearch">
      <input v-model="search" placeholder="Cari email…" />
      <button>Cari</button>
    </form>

    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="loading">Memuat…</p>

    <div style="overflow-x: auto">
      <table>
        <thead>
          <tr>
            <th>Nama</th><th>Email</th><th>Role</th><th>2FA</th><th>Status</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>
              <!-- Admin tidak bisa mengubah role dirinya sendiri -->
              <select
                v-if="u.id !== me?.id"
                :value="u.role"
                @change="changeRole(u, ($event.target as HTMLSelectElement).value as AppRole)"
              >
                <option v-for="r in roleNames" :key="r" :value="r">{{ r }}</option>
              </select>
              <span v-else>{{ u.role }}</span>
            </td>
            <td>{{ u.twoFactorEnabled ? '✓' : '–' }}</td>
            <td>{{ u.banned ? 'Banned' : 'Aktif' }}</td>
            <td>
              <template v-if="u.id !== me?.id">
                <button @click="toggleBan(u)">{{ u.banned ? 'Unban' : 'Ban' }}</button>
                <button @click="revokeSessions(u)">Revoke sesi</button>
              </template>
              <em v-else>(Anda)</em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button :disabled="page <= 1" @click="page--">‹</button>
    {{ page }} / {{ totalPages }}
    <button :disabled="page >= totalPages" @click="page++">›</button>
  </main>
</template>
```

Membuat user baru langsung dengan role tertentu dari admin (opsional):

```ts
await client.admin.createUser({
  email: 'user@example.com',
  password: 'password-aman-123',
  name: 'Nama User',
  role: 'member',
})
```

---

## 14. Lindungi API server

Route rules hanya mengatur navigasi. Setiap endpoint harus dilindungi di server. Gunakan helper `requireRole` (bagian 12).

`server/api/admin/stats.get.ts` (admin saja):

```ts
import { count } from 'drizzle-orm'
import { db } from '../../db'
import { user } from '../../db/auth-schema'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const [row] = await db.select({ total: count() }).from(user)
  return { totalUsers: row?.total ?? 0 }
})
```

`server/api/member/me.get.ts` (member dan admin):

```ts
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'member', 'admin')
  return { id: user.id, name: user.name, role: user.role }
})
```

Endpoint yang cukup mewajibkan login (apa pun rolenya) memakai `requireUserSession(event)` langsung.

### Endpoint Log Aktivitas Admin

Untuk halaman log aktivitas Luber, gunakan `requireRole(event, 'admin')` langsung pada `GET /api/admin/audit-logs`. Pemeriksaan role di client hanya untuk menyembunyikan menu; endpoint tetap wajib menolak role lain dengan `403`. Endpoint log bersifat read-only dan tidak menyediakan operasi update atau delete.

Query bergaya SQL (`db.select()`, `db.insert()`, dan seterusnya) berjalan seperti biasa. Jika memakai Relational Queries (`db.query.<tabel>`), gunakan sintaks v2 dengan `where` berbentuk objek:

```ts
const found = await db.query.user.findFirst({ where: { email: 'user@example.com' } })
```

**Aturan tambahan (AND dengan role).** Untuk syarat yang tidak cukup dengan pencocokan field, tambahkan `rule`:

```ts
await requireUserSession(event, {
  user: { role: 'admin' },
  rule: ({ user }) => user.twoFactorEnabled === true, // admin wajib sudah mengaktifkan 2FA
})
```

Hal yang sama bisa dipasang di route rules, misalnya mewajibkan admin memakai 2FA:

```ts
'/admin/**': {
  auth: {
    user: { role: 'admin', twoFactorEnabled: true },
    redirectTo: '/security',
  },
},
```

---

## 15. Membuat admin pertama

Setiap pendaftar baru berperan `member`. Untuk membuat admin pertama:

1. Daftar lewat `/register`.
2. Ubah kolom `role` user tersebut menjadi `admin`. Pilih salah satu:

```bash
# Cara 1: Drizzle Studio (ubah kolom role di tabel user)
npx drizzle-kit studio

# Cara 2: CLI sqlite3 (jika terpasang)
sqlite3 .data/sqlite.db "UPDATE \"user\" SET role = 'admin' WHERE email = 'email@anda.com';"
```

3. Sign out, lalu sign in lagi supaya sesi membawa role baru. Jika role belum berubah, panggil `fetchSession({ force: true })` atau login ulang.

Setelah ada satu admin, role user lain diubah dari halaman `/admin` lewat dropdown role.

---

## 16. Checklist pengujian

**Auth dan 2FA**

1. Daftar user A, jadikan admin (bagian 15), lalu login. Anda diarahkan ke launchpad `/`.
2. Buka `/security`, aktifkan 2FA, scan QR, simpan backup code, lalu konfirmasi kode. Status berubah menjadi "Aktif".
3. Sign out lalu login lagi. Anda diarahkan ke `/two-factor`. Masukkan kode TOTP. Coba juga alur dengan backup code.

**Role**

4. Daftar user B (browser lain atau incognito). Cek di Drizzle Studio: `role` bernilai `member`.
5. Login sebagai B (member): `/member` bisa dibuka, `/admin` diarahkan ke `/`, `GET /api/admin/stats` mengembalikan 403, dan `GET /api/member/me` berhasil.
6. Login sebagai A (admin): `/member` dan `/admin` bisa dibuka, dan `GET /api/admin/stats` berhasil.
7. Dari `/admin`, ubah role B menjadi `admin`, lalu kembalikan ke `member`. B harus login ulang agar perubahan role berlaku di sesinya.
8. Ban user B. Login B harus gagal dengan pesan banned.

---

## 17. Menambah role baru & mengatur halaman per role

Contoh: menambah role **`editor`** yang boleh membuka area `/editor`. Admin tetap boleh membuka semuanya.

Ringkasan: **1 file daftar role + 1 route rule + 1 halaman + 1 pengecekan API.**

### Langkah 1: Daftarkan role

`shared/auth/permissions.ts`, tambahkan satu baris di `roles`:

```ts
export const roles = {
  admin: ac.newRole({ ...adminAc.statements }),
  member: ac.newRole({ user: [], session: [] }),
  editor: ac.newRole({ user: [], session: [] }), // ← role baru
}
```

Efeknya otomatis:

- Tipe `AppRole` bertambah `'editor'`.
- Dropdown role di `/admin` memuat `editor`.
- Server (`admin({ roles })`) dan client (`adminClient({ roles })`) sama-sama mengenalnya, karena keduanya membaca file yang sama.

Tidak perlu generate skema atau migrasi. Kolom `role` hanya string. Pengecualian: jika Anda **mengubah `defaultRole`**, generate ulang skema dan buat migrasi (bagian 18), dan user lama harus diperbarui rolenya dengan `UPDATE`.

Restart dev server setelah mengubah file ini.

### Langkah 2: Atur halaman yang boleh dibuka

Ada dua cara. Pilih sesuai cakupannya.

**A. Satu seksi/folder penuh: route rule** di `nuxt.config.ts`

```ts
routeRules: {
  // ...aturan lain
  '/editor/**': { auth: { user: { role: ['editor', 'admin'] }, redirectTo: '/' } },
},
```

**B. Satu halaman tertentu: `definePageMeta`** di halaman itu sendiri

```vue
<script setup lang="ts">
definePageMeta({
  auth: {
    only: 'user',
    user: { role: ['editor', 'admin'] },
    redirectTo: '/',
  },
})
</script>
```

Page meta menimpa route rules global untuk halaman tersebut.

### Langkah 3: Buat halamannya

`app/pages/editor/index.vue`:

```vue
<template>
  <main>
    <h1>Area Editor</h1>
    <p>Hanya untuk role <code>editor</code> dan <code>admin</code>.</p>
    <NuxtLink to="/">← Launchpad</NuxtLink>
  </main>
</template>
```

### Langkah 4: Tampilkan menu hanya untuk role yang berhak

Di `app/pages/index.vue` (launchpad):

```vue
<NuxtLink v-if="hasRole('editor', 'admin')" to="/editor"> | Area Editor</NuxtLink>
```

### Langkah 5: Lindungi API-nya

`server/api/editor/posts.get.ts`:

```ts
export default defineEventHandler(async (event) => {
  await requireRole(event, 'editor', 'admin')
  return { posts: [] }
})
```

Ini langkah terpenting. Route rule dan menu hanya mengatur tampilan, sedangkan data hanya aman bila API memeriksa role.

### Langkah 6: Berikan role ke user

Login sebagai admin, buka `/admin`, pilih `editor` pada dropdown role user yang bersangkutan. User tersebut harus login ulang agar sesinya membawa role baru.

### Langkah 7: Uji

- Login sebagai `editor`: `/editor` terbuka, `/admin` diarahkan ke `/`.
- Login sebagai `member`: `/editor` diarahkan ke `/`.
- Panggil `/api/editor/posts` sebagai `member`: harus 403.

### Peta akses (contoh hasil akhir)

| Path | Siapa yang boleh | Mekanisme |
| --- | --- | --- |
| `/`, `/login`, `/register`, `/two-factor` | Publik (login/register: tamu saja) | `only: 'guest'` atau tanpa aturan |
| `/` dan area fitur terautentikasi | Semua user yang login | `only: 'user'` |
| `/member/**` | member, admin | `role: ['member', 'admin']` |
| `/editor/**` | editor, admin | `role: ['editor', 'admin']` |
| `/admin/**` | admin | `role: 'admin'` |
| `/api/admin/**` | admin | `requireRole(event, 'admin')` |
| `/api/member/**` | member, admin | `requireRole(event, 'member', 'admin')` |
| `/api/editor/**` | editor, admin | `requireRole(event, 'editor', 'admin')` |

Disarankan memperbarui tabel seperti ini di README project Anda setiap kali menambah area baru.

### Catatan penting tentang role

- **Satu role per user.** Plugin admin sebenarnya bisa menyimpan beberapa role dalam satu string yang dipisah koma. Route rules mencocokkan nilai `role` **secara persis**, jadi user dengan `"editor,member"` tidak akan cocok dengan aturan `role: 'editor'`. Jika butuh multi-role, gunakan `rule` callback:

  ```ts
  await requireUserSession(event, {
    rule: ({ user }) => (user.role ?? '').split(',').includes('editor'),
  })
  ```

- **Role dengan hak admin plugin.** Role baru tidak otomatis boleh mengelola user. Hanya role di `adminRoles` yang dianggap admin oleh plugin admin. Jika ingin role `moderator` bisa memakai endpoint seperti ban user, tambahkan ke `adminRoles` dan beri permission yang sesuai di `ac.newRole(...)`:

  ```ts
  moderator: ac.newRole({ user: ['list', 'ban'], session: ['list', 'revoke'] }),
  // ...
  export const adminRoles: AppRole[] = ['admin', 'moderator']
  ```

- **Pengecekan berbasis permission (lebih halus dari role).** Jika aturan Anda lebih rumit dari "role X boleh buka halaman Y", definisikan resource dan aksi sendiri, lalu cek dengan `hasPermission`:

  ```ts
  // shared/auth/permissions.ts
  const statement = {
    ...defaultStatements,
    project: ['create', 'update', 'delete'],
  } as const
  export const ac = createAccessControl(statement)

  export const roles = {
    admin: ac.newRole({ ...adminAc.statements, project: ['create', 'update', 'delete'] }),
    member: ac.newRole({ user: [], session: [], project: ['create'] }),
  }
  ```

  ```ts
  // client
  const { data } = await client.admin.hasPermission({ permissions: { project: ['create'] } })
  // server
  await auth.api.userHasPermission({ body: { userId, permissions: { project: ['create'] } } })
  ```

  Ubah `statement` hanya bila perlu. Untuk kebutuhan "halaman per role", route rules + `requireRole` sudah cukup.

---

## 18. Mengubah plugin atau skema di kemudian hari

Karena skema tidak otomatis, ulangi urutan ini setiap kali plugin atau opsi yang memengaruhi skema berubah (termasuk mengganti `defaultRole`):

```bash
# 1. Samakan perubahan di:
#    - auth.ts
#    - server/auth.config.ts
#    - app/auth.config.ts (padanan client)

# 2. Generate ulang skema (tabel + authRelations)
npx auth@latest generate --config auth.ts --output server/db/auth-schema.ts -y

# 3. Buat & terapkan migrasi
npx drizzle-kit generate
npx drizzle-kit migrate

# 4. Restart dev server
pnpm dev
```

Perubahan yang hanya menyentuh relations (tanpa tabel atau kolom baru) tidak menghasilkan migrasi baru. Menambah role baru ke `roles` **tidak** memerlukan langkah ini.

---

## 19. Troubleshooting

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| `'"drizzle-orm"' has no exported member named 'relations'` | Skema dibuat dengan adapter yang salah | Pastikan adapter diimpor dari `@better-auth/drizzle-adapter/relations-v2` di `auth.ts` dan `server/auth.config.ts`, lalu generate ulang |
| `Cannot find module './auth-schema'` saat menjalankan CLI | `auth.ts` mengimpor `server/db/index.ts` | Impor hanya `./server/db/libsql` di `auth.ts` |
| Error adapter soal relations atau schema saat start | `db` dibuat tanpa `relations`, atau `schema` tidak sama dengan hasil generate | Pastikan `drizzle({ client, relations: authRelations })` dan `schema` memakai `auth-schema.ts` terbaru |
| `no such table: user` | Migrasi belum dijalankan, atau `DATABASE_URL` berbeda antara app dan drizzle-kit | Jalankan `npx drizzle-kit migrate`, pastikan URL sama |
| `no such column: role` / `twoFactorEnabled` | Skema dibuat sebelum plugin ditambahkan | Ikuti [bagian 18](#18-mengubah-plugin-atau-skema-di-kemudian-hari) |
| User baru berperan `user`, bukan `member` | `defaultRole` belum diteruskan ke `admin()` di salah satu file | Pastikan `auth.ts` dan `server/auth.config.ts` sama-sama memakai `admin({ ac, roles, defaultRole, adminRoles })`, lalu generate ulang skema dan migrasi |
| Role baru tidak muncul di dropdown atau `setRole` ditolak | Role belum ada di `roles`, atau dev server belum di-restart | Tambahkan ke `shared/auth/permissions.ts`, lalu restart |
| Setelah ubah role, akses tetap ditolak | Sesi lama masih membawa role lama | Login ulang atau `fetchSession({ force: true })` |
| Role `editor` tidak bisa memakai endpoint kelola user | Role tidak ada di `adminRoles` | Tambahkan ke `adminRoles` dan beri permission (bagian 17) |
| User multi-role (`"a,b"`) tidak cocok dengan route rule | Route rules mencocokkan nilai persis | Pakai satu role per user, atau `rule` callback dengan `split(',')` |
| Redirect berputar (loop) | Halaman tujuan `redirectTo` juga dibatasi role yang sama | Arahkan `redirectTo` ke launchpad `/` |
| Pengguna yang belum login dibuka ke `/admin` lalu berakhir di `/login` tanpa kembali ke `/admin` | `redirectTo: '/'` pada aturan role mengalihkan dulu ke launchpad | Perilaku normal. Setelah login, user masuk ke `/` |
| Tipe `role` / `twoFactorEnabled` tidak muncul | Cache tipe | Jalankan `npx nuxi prepare` dan restart TS server |
| Error secret / `baseURL` saat start | `NUXT_BETTER_AUTH_SECRET` kurang dari 32 karakter atau kosong | Generate ulang secret |
| Method client plugin `undefined` | Plugin client belum didaftarkan | Tambahkan `adminClient({ ac, roles })` / `twoFactorClient()` di `app/auth.config.ts` |
| `SQLITE_BUSY` | Beberapa proses memegang file DB (dev server, Studio, migrate) | Hentikan proses yang tidak dipakai, lalu ulangi |
| `SQLITE_CANTOPEN` atau URL tidak dikenali | Folder `.data` belum ada, atau URL tanpa awalan `file:` | Pastikan `libsql.ts` membuat folder dan `DATABASE_URL=file:.data/sqlite.db` |
| Error `file:` URL tidak didukung | Memakai `@libsql/client/web` | Pakai import default `@libsql/client` |

Catatan perilaku 2FA Better Auth:

- 2FA hanya bisa diaktifkan untuk akun credential (email/password), kecuali server memakai `allowPasswordless: true`.
- Login via OAuth/social, passkey, magic link, dan metode tanpa password lain **tidak** ditantang 2FA secara default.
- Ada account lockout otomatis setelah beberapa kali verifikasi gagal (TOTP, OTP, dan backup code berbagi satu penghitung).
- Plugin admin **tidak** punya API untuk menonaktifkan 2FA user lain. Untuk user yang kehilangan semua faktor, gunakan backup code atau buat alur recovery sendiri (re-autentikasi admin, audit log, notifikasi ke user, dan revoke sesi).

---

## 20. Catatan production

- **File SQLite lokal** cocok untuk VPS atau Docker dengan volume persisten. Platform serverless dengan filesystem sementara tidak cocok.
- **Dependency native:** `@libsql/client` memuat paket native. Pastikan artefak deploy (`.output/`) membawa `node_modules` hasil tracing Nitro dan dijalankan di OS/arsitektur yang sama dengan saat build.
- **Pindah ke Turso (libSQL remote):** cukup ubah environment variable. Kode tidak berubah.

  ```ini
  DATABASE_URL=libsql://nama-db-anda.turso.io
  DATABASE_AUTH_TOKEN=token_anda
  ```

  Untuk drizzle-kit ke Turso, ubah `dialect` menjadi `'turso'` dan tambahkan `authToken` di `dbCredentials`.
- **Jalankan migrasi saat deploy:** `npx drizzle-kit migrate`.
- **Wajib set** `NUXT_BETTER_AUTH_SECRET` dan `NUXT_PUBLIC_SITE_URL` di environment production. Jika Anda merotasi secret, gunakan `BETTER_AUTH_SECRETS` berversi, misalnya `2:secret-baru,1:secret-lama`.
- **Backup** file `.data/sqlite.db` secara berkala (dan file `-wal`/`-shm` jika WAL aktif).
- Jangan commit `.env` dan folder `.data`. Folder `server/db/migrations/` **harus** di-commit.
- **Pin versi Drizzle.** Drizzle 1.0 masih berstatus RC, jadi pasang versi persis (`-E`) dan baca catatan rilis sebelum menaikkan versi.
- **Admin pertama di production:** jangan membuka endpoint khusus untuk itu. Daftarkan akun, lalu ubah role-nya lewat akses langsung ke database (bagian 15).

---

## 21. Memakai boilerplate ini di project baru

Ringkasan urutan kerja. Setiap nomor merujuk ke bagian di atas.

```bash
# 1. Project + dependency (bagian 2)
pnpm dlx nuxi@latest init nama-app && cd nama-app
pnpm add -E drizzle-orm@1.0.0-rc.4
pnpm add better-auth@^1.7.7 @better-auth/drizzle-adapter@^1.7.7 @libsql/client@^0.18.0 qrcode
pnpm add -D -E drizzle-kit@1.0.0-rc.4
pnpm add -D @types/qrcode
pnpm dlx nuxi module add @nuxtjs/better-auth

# 2. Buat file, urutannya penting:
#    .env                         (bagian 3)
#    nuxt.config.ts               (bagian 4)
#    server/db/libsql.ts          (bagian 5)
#    shared/auth/permissions.ts   (bagian 6)
#    auth.ts                      (bagian 7)

# 3. Generate skema, migrasi (bagian 8 dan 9)
npx auth@latest generate --config auth.ts --output server/db/auth-schema.ts -y
#    buat drizzle.config.ts
npx drizzle-kit generate && npx drizzle-kit migrate
#    buat server/db/index.ts

# 4. Config server dan client, helper, halaman, API (bagian 10 sampai 14)

# 5. Jalankan, daftar akun, jadikan admin (bagian 15)
pnpm dev
```

Hal yang biasanya disesuaikan per project:

| Yang diubah | Di mana |
| --- | --- |
| Nama aplikasi (nama issuer di authenticator) | `appName` di `auth.ts` dan `server/auth.config.ts` |
| Daftar role dan role default | `shared/auth/permissions.ts` |
| Area/halaman per role | `routeRules` di `nuxt.config.ts` dan folder `app/pages/` |
| Lokasi database | `DATABASE_URL` di `.env` |
| Tampilan | Seluruh file di `app/pages/` (contoh memakai HTML polos agar mudah diganti UI library) |

Aturan yang tidak boleh terlewat:

1. `auth.ts` dan `server/auth.config.ts` selalu sama (plugin, opsi, role).
2. Setiap perubahan yang memengaruhi skema diikuti generate skema, `drizzle-kit generate`, dan `drizzle-kit migrate`.
3. Setiap halaman yang dibatasi role harus punya API yang dibatasi dengan `requireRole`.

---

## 22. Referensi

- Nuxt Better Auth: [Installation](https://better-auth.nuxt.dev/getting-started/installation), [Configuration](https://better-auth.nuxt.dev/getting-started/configuration), [Client Setup](https://better-auth.nuxt.dev/getting-started/client-setup), [Custom Database](https://better-auth.nuxt.dev/guides/custom-database), [Route Protection](https://better-auth.nuxt.dev/core-concepts/route-protection), [Role-Based Access](https://better-auth.nuxt.dev/guides/role-based-access), [Composables](https://better-auth.nuxt.dev/api/composables), [Server Utilities](https://better-auth.nuxt.dev/api/server-utils), [Two-Factor Auth](https://better-auth.nuxt.dev/guides/two-factor-auth)
- Better Auth: [Drizzle ORM Adapter](https://better-auth.com/docs/adapters/drizzle) (termasuk bagian Drizzle Relations v2), [CLI](https://better-auth.com/docs/concepts/cli), [Plugin Admin](https://www.better-auth.com/docs/plugins/admin) (Access Control, `defaultRole`, `adminRoles`), [Plugin Two-Factor](https://www.better-auth.com/docs/plugins/2fa), [Changelog](https://better-auth.com/changelog)
- Drizzle ORM: [Upgrade ke v1](https://orm.drizzle.team/docs/upgrade-v1), [Relational Queries v2](https://orm.drizzle.team/docs/relations-v1-v2), [drizzle.config.ts (SQLite)](https://orm.drizzle.team/docs/sqlite/drizzle-config-file), [Get Started Turso/libSQL](https://orm.drizzle.team/docs/get-started/turso-new)
- libSQL client: <https://github.com/tursodatabase/libsql-client-ts>
