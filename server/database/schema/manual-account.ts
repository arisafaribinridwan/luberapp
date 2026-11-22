import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { MANUAL_ACCOUNT_STATUSES, type ManualAccountStatus } from './constants'

export const manualAccount = sqliteTable(
  'manual_accounts',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    accountNumber: text('account_number'),
    holderName: text('holder_name').notNull(),
    status: text('status').$type<ManualAccountStatus>().default('ACTIVE').notNull(),
    createdById: text('created_by_id').references(() => user.id, { onDelete: 'set null' }),
    updatedById: text('updated_by_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [
    uniqueIndex('manual_account_name_unique').on(table.name),
    index('manual_account_status_idx').on(table.status),
    index('manual_account_created_by_idx').on(table.createdById),
    index('manual_account_updated_by_idx').on(table.updatedById)
  ]
)

export type ManualAccount = typeof manualAccount.$inferSelect
export type NewManualAccount = typeof manualAccount.$inferInsert

export { MANUAL_ACCOUNT_STATUSES }
