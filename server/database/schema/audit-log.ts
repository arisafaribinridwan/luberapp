import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { AUDIT_EVENT_TYPES, type AuditEventType } from './constants'

export const auditLog = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').$type<AuditEventType>().notNull(),
    summary: text('summary').notNull(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull()
  },
  table => [
    index('audit_log_event_type_idx').on(table.eventType),
    index('audit_log_actor_idx').on(table.actorId),
    index('audit_log_created_at_idx').on(table.createdAt),
    index('audit_log_target_idx').on(table.targetType, table.targetId)
  ]
)

export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert

export { AUDIT_EVENT_TYPES }
