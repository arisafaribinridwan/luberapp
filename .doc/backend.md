# Backend Specification

**Project:** Luber (Lunas Bersama)

**Runtime:** Nuxt Server Routes / Nitro, Better Auth, Zod, Drizzle ORM, PWA service worker (`@vite-pwa/nuxt`)

**Validation:** Zod (Runtime + Type-Safe)

**Layers:** API Route (Auth/Val) → Service (Logic) → Repository (DB)

## Constants & Types

Semua enum menggunakan pola `as const` untuk menjaga type safety. Constants bersama diimpor oleh schema files dan validation schema sehingga daftar nilai yang disimpan database sama dengan nilai yang diterima API.

```typescript
export const MANUAL_ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type ManualAccountStatus = (typeof MANUAL_ACCOUNT_STATUSES)[number]
```

Schema dan route validation harus menggunakan constants tersebut, misalnya `z.enum(MANUAL_ACCOUNT_STATUSES)`. Hindari mendefinisikan ulang enum sebagai array atau union string terpisah di setiap layer.

## TypeScript Types by Scope

File TypeScript `types` dipisahkan berdasarkan cakupan penggunaannya agar auto-import Nuxt berjalan otomatis dan kode server tidak ikut terbawa ke client:

```text
├── app/
│   └── types/          # Khusus Client / Vue UI (auto-imported di app/)
├── server/
│   └── types/          # Khusus Backend / Nitro (auto-imported di server/)
└── shared/
    └── types/          # Dipakai Client dan Server (auto-imported di keduanya)
```

Aturan penempatan:

* `app/types/` hanya berisi tipe yang dibutuhkan komponen, halaman, composable, dan utilitas client.
* `server/types/` berisi tipe internal backend, repository, service, dan server route.
* `shared/types/` hanya berisi tipe serta constants yang aman digunakan bersama oleh client dan server.
* Tipe dari `server/types/` tidak boleh diimpor ke `app/` atau `shared/`.
* Jika tipe request/response dipakai kedua sisi, letakkan di `shared/types/` dan gunakan kembali di API validation serta client API.

Pola ini mengikuti struktur direktori Nuxt untuk menjaga auto-import berdasarkan scope ([Nuxt Directory Structure](https://nuxt.com/docs/4.x/directory-structure/app/utils)).

## 1. Authentication, Authorization & Session

* Semua route data dan mutasi aplikasi, termasuk route yang sebelumnya disebut public, memerlukan session Better Auth yang valid. Endpoint login menjadi pengecualian karena digunakan untuk membuat session.
* `requireUserSession(event)` wajib dipanggil pada setiap endpoint sebelum membaca atau mengubah data.
* Session berakhir setelah 1 jam tanpa aktivitas. Middleware memperbarui aktivitas pada request terautentikasi dan mengembalikan HTTP 401 saat idle timeout terlewati.
* Role pengguna adalah `member`, `pengurus`, atau `admin`. Gunakan pemeriksaan terpusat seperti `requireRole(event, roles)` setelah session ditemukan.
* `member` hanya dapat membaca dashboard dan data miliknya; `pengurus` dapat melakukan operasi transaksi yang diizinkan; `admin` memiliki akses penuh termasuk pengguna, role, rekening manual, dan konfigurasi.
* Login berhasil melalui `POST /api/auth/login` mengarahkan client ke launchpad `/`. Session yang tidak valid mengarahkan client ke login screen. Service worker hanya mencache asset shell dan response baca yang aman; response autentikasi, session, dan mutasi tidak boleh dicache.
* Log aktivitas hanya boleh dibaca oleh `admin`. Pemeriksaan role dilakukan di server pada setiap request log; menyembunyikan menu di client saja tidak cukup.

## 2. Backend Implementation Pattern

Server route mengikuti pola service yang tipis dan memakai instance database terpusat dari `server/database/index.ts`:

```typescript
import { db } from '../../database'
import {
  insertManualAccountSchema,
  manualAccount,
} from '../../database/schema'

export default defineEventHandler(async (event) => {
  const payload = insertManualAccountSchema.parse(await readBody(event))

  // query dan aturan bisnis dilakukan di service/route backend
  return db.insert(manualAccount).values(payload).returning()
})
```

Aturan backend:

* Server route tidak membuat koneksi Drizzle baru; impor `db` dari `server/database`.
* API Route menangani autentikasi, parsing request, dan validasi payload menggunakan Zod.
* Gunakan `requireUserSession(event)` untuk semua endpoint aplikasi, termasuk endpoint baca, admin, dan operasi mutasi; gunakan `requireRole(event, roles)` untuk pembatasan role.
* Service menangani aturan bisnis, orkestrasi, dan transaksi multi-langkah.
* Repository menangani query Drizzle dan akses langsung ke database.
* Service dan repository tidak membaca request event secara langsung; data diteruskan melalui parameter bertipe.
* Tipe input/output diturunkan dari schema Drizzle (`$inferSelect`, `$inferInsert`) dan schema Zod.
* Error validasi dikembalikan sebagai error HTTP terstruktur; jangan meneruskan error database mentah ke client.
* Schema transaksi dipisah berdasarkan arah dana: schema Cash In mewajibkan `destinationAccount`, sedangkan schema Cash Out mewajibkan `sourceAccount`.
* Setelah aksi penting selesai atau ditolak, service menulis satu baris ke `audit_logs`. Penulisan log tidak boleh menyimpan password, PIN, token, atau isi file bukti.

### 2.1 Tanggung Jawab Tiap Layer

| Layer | Tanggung Jawab | Contoh |
| --- | --- | --- |
| **API Route** | Auth, membaca request, validasi Zod, response dan status HTTP | `server/api/admin/manual-accounts.post.ts` |
| **Service** | Aturan bisnis, validasi lintas entity, orkestrasi beberapa repository | `server/services/manual-account-service.ts` |
| **Repository** | Query Drizzle, insert/update/delete, dan pemetaan data database | `server/repositories/manual-account-repository.ts` |

Alur request standar:

```text
Request
  → API Route (Auth + Zod validation)
  → Service (business logic)
  → Repository (Drizzle / database)
  → Response
```

Schema Zod digunakan pada boundary request untuk memastikan data runtime aman dan menghasilkan tipe TypeScript yang dapat dipakai oleh layer berikutnya.

## 3. API Specs & Nuxt Server Routes

All server routes utilize **Zod validation** for runtime safety. Payload transaksi menggunakan schema terpisah untuk Cash In dan Cash Out, lalu dipilih berdasarkan `txType`.

### 3.1 Authenticated Read Routes

* `GET /api/public/summary`: Mengembalikan ringkasan saldo kas, piutang, hibah, defisit awal, hibah yang sudah dialokasikan untuk penutupan, sisa defisit, dan sisa modal hibah setelah `requireUserSession`; route tetap bernama public untuk kompatibilitas, tetapi tidak anonim.
* `GET /api/public/transactions`: Mengembalikan feed transaksi setelah login.
* `GET /api/public/members`: Mengembalikan daftar ringan anggota aktif (`id`, `name`) setelah login; data dibatasi sesuai role.
* `GET /api/public/members/:id`: Mengembalikan profil ringkas dan riwayat mutasi setelah login; `member` hanya boleh melihat datanya sendiri.

### 3.1.1 Admin Audit Log

* `GET /api/admin/audit-logs`: Mengembalikan log secara *read-only* untuk `admin`, diurutkan dari yang terbaru. Endpoint menerima filter sederhana `from`, `to`, `eventType`, `actorId`, serta `page` dan `limit` bila pagination diperlukan.
* Endpoint mengembalikan waktu, jenis kejadian, ringkasan, pelaku, `targetType`, dan `targetId` bila ada. `metadataJson` tidak perlu dikirim jika tidak dibutuhkan oleh tampilan.
* `member` dan `pengurus` menerima `403` untuk endpoint ini. Tidak ada endpoint `POST`, `PATCH`, atau `DELETE` untuk log.

### 3.2 Protected Mutation Routes (Better-Auth + Role Middleware)

Semua endpoint di bawah `/api/admin` memerlukan session aktif. Operasi transaksi dapat diberikan kepada `pengurus` dan `admin` melalui middleware role; pembuatan transfer dan pengelolaan rekening manual hanya tersedia untuk `admin`.

* `POST /api/auth/login`: Autentikasi semua role via username & password/PIN dan membuat session dengan idle timeout 1 jam.
* `POST /api/admin/transactions`:
* **Zod Payload Validation**:
```typescript
    const transactionBaseSchema = z.object({
      txDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      memberId: z.string().optional(),
      amount: z.number().positive(),
      description: z.string().min(3),
      fileBase64: z.string().min(1, 'Bukti transaksi wajib diunggah'),
      fileName: z.string().min(1),
      fundPurpose: z.enum(['PENUTUPAN_DEFISIT', 'MODAL_PUTAR', 'OPERASIONAL']).optional(),
    })

    const cashInTransactionSchema = transactionBaseSchema.extend({
      txType: z.enum(['HIBAH_MASUK', 'SIMPANAN_MASUK', 'ANGSURAN_PINJAMAN']),
      destinationAccount: z.string().min(1),
    })

    const cashOutTransactionSchema = transactionBaseSchema.extend({
      txType: z.enum([
        'PENARIKAN_SIMPANAN',
        'PENCAIRAN_PINJAMAN',
        'BEBAN_OPERASIONAL',
      ]),
      sourceAccount: z.string().min(1),
    })

    const openingDeficitSchema = transactionBaseSchema.extend({
      txType: z.literal('SALDO_AWAL_DEFISIT'),
      // amount adalah nilai absolut defisit; jurnal menghasilkan Kas Utama negatif
      meetingReference: z.string().min(1),
    })

    const deficitAllocationSchema = transactionBaseSchema.extend({
      txType: z.literal('ALOKASI_HIBAH_PENUTUP_DEFISIT'),
      relatedTransactionId: z.string().min(1),
      meetingReference: z.string().min(1),
    })

    const accountTransferSchema = transactionBaseSchema.extend({
      txType: z.literal('TRANSFER_ANTAR_REKENING'),
      sourceAccount: z.string().min(1),
      destinationAccount: z.string().min(1),
    }).refine(
      (payload) => payload.sourceAccount !== payload.destinationAccount,
      { message: 'Rekening asal dan tujuan harus berbeda' },
    )

    const createTransactionSchema = z.union([
      cashInTransactionSchema,
      cashOutTransactionSchema,
      openingDeficitSchema,
      deficitAllocationSchema,
      accountTransferSchema,
    ])

```

Untuk `HIBAH_MASUK`, service wajib memvalidasi `fundPurpose` dan menyimpan tujuan hibah. Untuk `SALDO_AWAL_DEFISIT`, service hanya boleh dipanggil oleh `admin`, menyimpan referensi rapat dan memastikan saldo awal hanya dapat dibuat sekali atau melalui koreksi pembalik. Untuk `ALOKASI_HIBAH_PENUTUP_DEFISIT`, service wajib memastikan hibah tersedia, defisit masih tersisa, jumlah alokasi tidak melebihi keduanya, dan referensi penerimaan hibah valid. Kedua operasi harus atomik.

Untuk `TRANSFER_ANTAR_REKENING`, service wajib memastikan kedua rekening manual berstatus aktif, rekening asal dan tujuan berbeda, serta saldo rekening asal mencukupi. Jurnal transaksi (`debitAccount` dan `creditAccount` sama-sama `1-1001`) dan perhitungan saldo rekening manual harus diproses dalam satu transaksi database. Jika terjadi kegagalan, seluruh perubahan dibatalkan.

* `GET /api/admin/manual-accounts`: Mengembalikan daftar rekening manual untuk admin.
* `POST /api/admin/manual-accounts`: Menambahkan rekening manual baru.
* `PATCH /api/admin/manual-accounts/:id`: Mengubah data atau status aktif rekening manual.
* `DELETE /api/admin/manual-accounts/:id`: Menonaktifkan rekening manual yang sudah pernah digunakan; penghapusan fisik ditolak jika memiliki riwayat transaksi.

Setiap endpoint mutasi di atas memanggil service log setelah hasil aksi diketahui. Minimal event yang digunakan adalah `TRANSACTION_CREATED`, `TRANSFER_CREATED`, `MANUAL_ACCOUNT_CREATED`, `MANUAL_ACCOUNT_UPDATED`, `USER_UPDATED`, `CONFIG_UPDATED`, dan `ACTION_REJECTED`. Route login juga mencatat `LOGIN_SUCCEEDED` atau `LOGIN_FAILED`, sedangkan route logout mencatat `LOGOUT`; kegagalan autentikasi dapat memiliki `actorId` kosong.





---

