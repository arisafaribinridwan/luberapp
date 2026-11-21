import { mkdirSync } from 'node:fs'
import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:.data/sqlite.db'

if (url.startsWith('file:.data/')) {
  mkdirSync('.data', { recursive: true })
}

export const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN
})
