import { mkdirSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL || 'file:.data/sqlite.db'

if (url.startsWith('file:.data/')) {
  mkdirSync('.data', { recursive: true })
}

export default defineConfig({
  schema: './server/database/schema/index.ts',
  out: './server/database/migrations',
  dialect: 'turso',
  dbCredentials: {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN
  }
})
