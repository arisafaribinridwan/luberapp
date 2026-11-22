import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { MEMBER_STATUSES, type MemberStatus } from './constants'

export const member = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    status: text('status').$type<MemberStatus>().default('ACTIVE').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [index('member_status_idx').on(table.status)]
)

export type Member = typeof member.$inferSelect
export type NewMember = typeof member.$inferInsert

export { MEMBER_STATUSES }
