# Database Design

**Project:** Luber (Lunas Bersama)

**Stack:** Drizzle ORM + `@libsql/client`, SQLite file (Development), Turso LibSQL (Production)

**Architecture Status:** Struktur modular di dokumen ini adalah target refactor database aplikasi.

## 1. Authentication, Roles & Session Data

Tabel pengguna menyimpan tiga role yang valid: `member`, `pengurus`, dan `admin`. Semua data aplikasi dibaca atau diubah melalui session Better Auth yang valid; tidak ada pengguna anonim. PWA tidak menyimpan data transaksi atau session sebagai data offline yang dapat digunakan kembali.

Session harus menyimpan waktu aktivitas terakhir (`lastActivityAt`) atau metadata setara yang dapat diperbarui pada request terautentikasi. Session dianggap kedaluwarsa setelah 1 jam tanpa aktivitas dan harus dihapus/ditolak oleh middleware. Setelah kedaluwarsa, client kembali ke welcome screen `/`; setelah login ulang client menuju launchpad `/`.

## 2. Database Implementation Pattern

Struktur database mengikuti pola modular seperti referensi `maukaga-nuxt-v2`:

```text
server/database/
├── index.ts                 # koneksi Drizzle dan export db
└── schema/
    ├── index.ts             # export schema, databaseSchema, dan relations
    ├── constants.ts         # enum/status bersama dengan pola as const
    ├── user.ts              # tabel Better Auth
    ├── member.ts            # master anggota
    ├── transaction.ts       # jurnal transaksi
    ├── manual-account.ts    # daftar rekening manual
    └── audit-log.ts         # log kejadian aplikasi (append-only)
```

### 2.1 Koneksi Database

`server/database/index.ts` menjadi entry point koneksi database yang sederhana. File ini:

* mengimpor client LibSQL dari `server/database/libsql.ts`;
* mengimpor relasi database dari schema;
* membuat satu instance Drizzle melalui `drizzle({ client, relations })`;
* mengekspor instance tersebut sebagai `db` untuk dipakai server route dan service.

Implementasi koneksi mengikuti pola yang saat ini digunakan aplikasi:

```typescript
import { drizzle } from 'drizzle-orm/libsql'
import { client } from './libsql'
import { relations } from './schema'

export const db = drizzle({
  client,
  relations,
})
```

Tidak diperlukan factory database, penyimpanan pada `globalThis`, atau wrapper `useDb()` untuk kebutuhan aplikasi saat ini.

### 2.2 Schema Modular dan Relasi Terpusat

Setiap domain memiliki file schema sendiri. `server/database/schema/index.ts` mengimpor dan mengekspor seluruh tabel, lalu menyusun object `databaseSchema` yang diberikan ke `defineRelations`. Refactor dari `schema/auth-schema.ts` ke struktur modular ini dilakukan sebelum fitur domain baru ditambahkan.

```typescript
export const databaseSchema = {
  manualAccount,
  member,
  transaction,
  auditLog,
  user,
  // tabel Better Auth lain: account, session, verification
}

export const relations = defineRelations(databaseSchema, (r) => ({
  member: {
    transactions: r.many.transaction(),
  },
  transaction: {
    member: r.one.member({
      from: r.transaction.memberId,
      to: r.member.id,
    }),
  },
  user: {
    auditLogs: r.many.auditLog(),
  },
  auditLog: {
    actor: r.one.user({
      from: r.auditLog.actorId,
      to: r.user.id,
    }),
  },
}))
```

Relasi tidak didefinisikan tersebar di server route. Semua file schema diekspor ulang dari `schema/index.ts` agar import tabel dan tipe tetap konsisten.

### 2.3 Schema Drizzle dan Zod

Untuk entity yang menerima input dari API, schema insert/select/update dibuat dekat dengan definisi tabel menggunakan `drizzle-orm/zod`:

```typescript
export const insertManualAccountSchema = createInsertSchema(manualAccount, {
  name: z.string().min(1).trim(),
  holderName: z.string().min(1).trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const selectManualAccountSchema = createSelectSchema(manualAccount)
export const updateManualAccountSchema = createUpdateSchema(manualAccount)

export type ManualAccount = typeof manualAccount.$inferSelect
export type InsertManualAccount = z.infer<typeof insertManualAccountSchema>
export type UpdateManualAccount = z.infer<typeof updateManualAccountSchema>
```

Aturan bisnis lintas field, seperti kewajiban `destinationAccount` untuk Cash In dan `sourceAccount` untuk Cash Out, tetap diterapkan pada schema payload endpoint di backend.

### 2.4 Constants & Types

Semua enum dan daftar nilai terbatas menggunakan pola `as const` agar tetap aman secara tipe:

```typescript
export const USER_ROLES = ['member', 'pengurus', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const FUND_PURPOSES = ['PENUTUPAN_DEFISIT', 'MODAL_PUTAR', 'OPERASIONAL'] as const
export type FundPurpose = (typeof FUND_PURPOSES)[number]

export const TRANSACTION_TYPES = [
  'HIBAH_MASUK',
  'SIMPANAN_MASUK',
  'PENARIKAN_SIMPANAN',
  'PENCAIRAN_PINJAMAN',
  'ANGSURAN_PINJAMAN',
  'BEBAN_OPERASIONAL',
  'TRANSFER_ANTAR_REKENING',
  'SALDO_AWAL_DEFISIT',
  'ALOKASI_HIBAH_PENUTUP_DEFISIT',
] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const AUDIT_EVENT_TYPES = [
  'LOGIN_SUCCEEDED',
  'LOGIN_FAILED',
  'LOGOUT',
  'ACTION_REJECTED',
  'TRANSACTION_CREATED',
  'TRANSFER_CREATED',
  'MANUAL_ACCOUNT_CREATED',
  'MANUAL_ACCOUNT_UPDATED',
  'USER_UPDATED',
  'CONFIG_UPDATED',
] as const

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number]
```

Constants bersama disimpan dalam `server/database/schema/constants.ts` atau modul constants domain yang sesuai. Constants tersebut wajib diimpor dan digunakan oleh schema files serta validation schema; jangan menduplikasi daftar enum sebagai string literal di masing-masing file.

Tipe database yang hanya digunakan backend, seperti tipe repository dan hasil query internal, ditempatkan di `server/types/`. Tipe bentuk data yang dibagikan oleh API kepada client ditempatkan di `shared/types/`. Jangan menempatkan tipe yang mengandung detail database atau server secret di `shared/types/`.

## 3. Database Schema Definition (Drizzle ORM TypeScript)

Berikut adalah struktur skema basis data menggunakan Drizzle ORM (`server/database/schema.ts`):

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 1. Better-Auth Users Table (All Authenticated Users)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').default('member').notNull(), // member | pengurus | admin
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`)
})

// 2. Members Master Table
export const members = sqliteTable('members', {
  id: text('id').primaryKey(), // e.g. "MBR-001"
  name: text('name').notNull(),
  phone: text('phone'),
  status: text('status').default('ACTIVE').notNull(), // ACTIVE | INACTIVE
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`)
})

// 3. Transactions Journal Table
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(), // e.g. "TX-20261117-001"
  txType: text('tx_type').notNull(), // HIBAH_MASUK | SALDO_AWAL_DEFISIT | ALOKASI_HIBAH_PENUTUP_DEFISIT | ...
  fundPurpose: text('fund_purpose'), // PENUTUPAN_DEFISIT | MODAL_PUTAR | OPERASIONAL
  txDate: text('tx_date').notNull(), // YYYY-MM-DD
  debitAccount: text('debit_account').notNull(),
  creditAccount: text('credit_account').notNull(),
  amount: integer('amount').notNull(), // Nominal dalam satuan Rupiah (Integer)
  description: text('description').notNull(),
  meetingReference: text('meeting_reference'), // notulen/keputusan rapat
  relatedTransactionId: text('related_transaction_id'), // relasi penerimaan hibah dan alokasi defisit
  memberId: text('member_id').references(() => members.id),
  
  // Field Rekening Manual Komunitas
  destinationAccount: text('destination_account'), // Wajib diisi saat Transaksi Masuk (Rekening Tujuan)
  sourceAccount: text('source_account'),          // Wajib diisi saat Transaksi Keluar (Rekening Asal)

  attachmentUrl: text('attachment_url').notNull(), // Google Drive View URL
  attachmentDriveId: text('attachment_drive_id').notNull(), // Google Drive File ID
  createdById: text('created_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`)
})

// 4. Application Audit Log (admin read-only)
export const auditLog = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  summary: text('summary').notNull(),
  actorId: text('actor_id').references(() => users.id),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadataJson: text('metadata_json'), // metadata ringkas, tanpa password/PIN/token/file content
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
})

```

### 3.1 Saldo Awal Defisit dan Hibah Penutup

`SALDO_AWAL_DEFISIT` menjadi transaksi pembukaan yang merekam kondisi kas utama minus berdasarkan rekonsiliasi dan notulen rapat. Jurnalnya adalah Debit `3-1002 Akumulasi Defisit Kas` dan Kredit `1-1001 Kas & Bank Utama`, sehingga saldo kas utama dapat tampil negatif tanpa mengubah riwayat transaksi lama.

`HIBAH_MASUK` mencatat dana yang benar-benar diterima dengan Debit `1-1001` dan Kredit `3-1001`. Jika dana tersebut dipakai untuk menutup defisit, `ALOKASI_HIBAH_PENUTUP_DEFISIT` mencatat Debit `3-1001` dan Kredit `3-1002`, tanpa perubahan rekening fisik. `relatedTransactionId` menghubungkan alokasi dengan penerimaan hibah. Sisa pada `3-1001` adalah modal hibah yang belum dialokasikan.

Validasi database/service harus menjaga bahwa alokasi hibah tidak melebihi defisit yang tersisa dan hibah yang tersedia. Saldo awal defisit hanya boleh dibuat satu kali pada periode setup; koreksi memakai transaksi pembalik dan audit trail.

### 3.2 Rekening Manual & Audit Trail Fisik

Pencatatan transaksi harus membedakan antara akun akuntansi dan rekening fisik yang digunakan pengurus. Dana komunitas dapat ditampung sementara melalui beberapa rekening bank pribadi pengurus atau kas tunai sebelum disatukan atau dilaporkan. Karena itu, setiap transaksi menyimpan jejak rekening manual secara kondisional:

* `destinationAccount` (`destination_account`) digunakan untuk transaksi **Dana Masuk / Cash In** dan mencatat rekening atau kas yang menerima dana.
* `sourceAccount` (`source_account`) digunakan untuk transaksi **Dana Keluar / Cash Out** dan mencatat rekening atau kas yang mengeluarkan dana.
* Untuk `TRANSFER_ANTAR_REKENING`, kedua field wajib diisi: `sourceAccount` mencatat rekening pusat yang mengeluarkan dana dan `destinationAccount` mencatat rekening pusat yang menerima dana.
* Kedua kolom bersifat opsional di tingkat database agar satu tabel dapat menampung semua jenis transaksi, tetapi wajib diisi sesuai arah transaksi oleh validasi API.
* Nilai rekening harus menyimpan identitas yang cukup untuk rekonsiliasi, misalnya `BCA Bendahara (123456789)`, `Mandiri Ketua (987654321)`, atau `Kas Tunai`.

Pemetaan jenis transaksi dan rekening manual:

| Jenis Transaksi | Kategori Alur | Field Rekening Aktif | Contoh Rekening Manual |
| --- | --- | --- | --- |
| **Penerimaan Hibah / Donasi** | Dana Masuk (*Cash In*) | `destinationAccount` (Rekening Tujuan) | BCA Bendahara (123456789), Kas Tunai |
| **Setoran Simpanan Anggota** | Dana Masuk (*Cash In*) | `destinationAccount` (Rekening Tujuan) | Mandiri Ketua (987654321), BCA Bendahara |
| **Angsuran Pinjaman Anggota** | Dana Masuk (*Cash In*) | `destinationAccount` (Rekening Tujuan) | Kas Tunai, BCA Bendahara |
| **Penarikan Simpanan Anggota** | Dana Keluar (*Cash Out*) | `sourceAccount` (Rekening Asal) | BCA Bendahara (123456789) |
| **Pencairan Pinjaman Anggota** | Dana Keluar (*Cash Out*) | `sourceAccount` (Rekening Asal) | BCA Bendahara, Mandiri Ketua |
| **Beban Operasional** | Dana Keluar (*Cash Out*) | `sourceAccount` (Rekening Asal) | Kas Tunai, BCA Bendahara |
| **Transfer Antar Rekening Pusat** | Transfer Internal | `sourceAccount` dan `destinationAccount` | Mandiri Ketua → BCA Bendahara |

Daftar rekening manual dapat dikonfigurasi melalui pengaturan aplikasi. Untuk instalasi awal, opsi default yang tersedia adalah **BCA Bendahara**, **Mandiri Ketua**, dan **Kas Tunai**. Nilai rekening tidak menggantikan akun COA `1-1001`; nilai tersebut menjadi metadata audit yang menghubungkan jurnal dengan lokasi fisik dana.

### 3.3 Pengaturan Daftar Rekening Manual

Admin dapat mengelola daftar rekening manual yang tersedia pada form transaksi. Setiap rekening minimal memiliki atribut:

* `id`: identifier unik rekening.
* `name`: nama tampilan, misalnya `BCA Bendahara` atau `Kas Tunai`.
* `accountNumber`: nomor rekening atau keterangan kas; opsional untuk kas tunai.
* `holderName`: nama pemilik atau penanggung jawab rekening.
* `isActive`: status aktif/nonaktif.

Rekening yang dinonaktifkan tidak boleh dipilih untuk transaksi baru, tetapi tetap dipertahankan agar riwayat transaksi lama tidak kehilangan referensi audit. Penghapusan permanen rekening yang sudah pernah dipakai tidak diperbolehkan.

### 3.4 Transfer Antar Rekening Pusat

Transfer internal disimpan sebagai satu baris pada jurnal transaksi dengan `debitAccount` dan `creditAccount` sama-sama mengarah ke akun COA `1-1001` (Kas & Bank Utama). Nilai `sourceAccount` dan `destinationAccount` menjadi audit trail rekening fisik yang menunjukkan perpindahan dana. Karena kedua sisi berasal dari akun COA yang sama, total saldo kas komunitas tetap dan hanya saldo rekening manual yang berubah.

Pencatatan transfer harus dilakukan dalam satu transaksi database. Jika salah satu pembaruan gagal, pencatatan jurnal dan perubahan saldo rekening manual harus dibatalkan bersama. Transfer yang sudah tersimpan bersifat immutable; pembatalan atau koreksi dibuat sebagai transaksi pembalik agar riwayat tetap lengkap.

### 3.5 Aturan Log Aktivitas

`audit_logs` menyimpan satu baris untuk setiap kejadian penting yang berhasil atau ditolak. `actorId` boleh kosong untuk login yang gagal atau kejadian sebelum pengguna dikenali. `targetType` dan `targetId` dipakai bila kejadian berkaitan dengan data tertentu, misalnya transaksi atau rekening manual.

Log dibuat oleh server setelah kejadian diproses. Log bersifat *append-only*; tidak ada operasi update atau delete melalui aplikasi. `metadataJson` hanya berisi metadata singkat yang membantu pelacakan, bukan payload penuh, password, PIN, token, atau isi lampiran.

Minimal kejadian yang dicatat adalah login berhasil, login gagal, logout, pembuatan transaksi, pembuatan transfer, pembuatan/perubahan rekening manual, perubahan pengguna atau role, dan perubahan konfigurasi. Pembacaan log admin tidak perlu membuat log baru agar tidak menghasilkan rekursi.

---

