import { sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { MEMBER_STATUSES, type MemberStatus } from './constants'
import { user } from './auth'

export const member = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
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
  table => [index('member_status_idx').on(table.status), index('member_user_idx').on(table.userId), uniqueIndex('member_user_unique').on(table.userId)]
)

export const insertMemberSchema = createInsertSchema(member, {
  id: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{2,39}$/, 'ID anggota tidak valid'),
  userId: z.string().trim().min(1).max(100).optional().nullable(),
  name: z.string().trim().min(2, 'Nama anggota minimal 2 karakter').max(120, 'Nama anggota maksimal 120 karakter'),
  phone: z.string().trim().regex(/^[+0-9][0-9 ()-]{5,24}$/, 'Nomor telepon tidak valid').optional().nullable()
}).omit({ status: true, createdAt: true, updatedAt: true })

export const selectMemberSchema = createSelectSchema(member)

export const updateMemberSchema = createUpdateSchema(member, {
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().regex(/^[+0-9][0-9 ()-]{5,24}$/, 'Nomor telepon tidak valid').optional().nullable(),
  status: z.enum(MEMBER_STATUSES).optional(),
  userId: z.string().trim().min(1).max(100).optional().nullable()
}).omit({ id: true, createdAt: true, updatedAt: true })

export type Member = typeof member.$inferSelect
export type NewMember = typeof member.$inferInsert
export type InsertMember = z.infer<typeof insertMemberSchema>
export type UpdateMember = z.infer<typeof updateMemberSchema>

export { MEMBER_STATUSES }
