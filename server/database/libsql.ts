import { mkdirSync } from 'node:fs'
import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:.data/sqlite.db'
const isLocalFile = url.startsWith('file:')

if (url.startsWith('file:.data/')) {
  mkdirSync('.data', { recursive: true })
}

export const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN
})

if (isLocalFile) {
  // WAL: pembaca tidak diblokir penulis (audit log + update sesi menulis terus-menerus).
  // busy_timeout: tunggu singkat daripada langsung SQLITE_BUSY. foreign_keys: SQLite default-nya OFF.
  void client.executeMultiple(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
  `).catch(error => console.warn('[db] gagal menerapkan PRAGMA', error))
}
