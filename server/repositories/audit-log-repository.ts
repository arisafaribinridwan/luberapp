import { and, asc, count, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../database'
import { auditLog, user, type AuditEventType } from '../database/schema'

export type AuditLogFilters = {
  from?: Date
  to?: Date
  eventType?: AuditEventType
  actorId?: string
  page: number
  limit: number
}

export async function insertAuditLog(input: {
  id: string
  eventType: AuditEventType
  summary: string
  actorId?: string | null
  targetType?: string | null
  targetId?: string | null
  metadataJson?: string | null
}) {
  const [created] = await db.insert(auditLog).values(input).returning()
  return created
}

export async function listAuditLogs(filters: AuditLogFilters) {
  const conditions = []

  if (filters.from) conditions.push(gte(auditLog.createdAt, filters.from))
  if (filters.to) conditions.push(lte(auditLog.createdAt, filters.to))
  if (filters.eventType) conditions.push(eq(auditLog.eventType, filters.eventType))
  if (filters.actorId) conditions.push(eq(auditLog.actorId, filters.actorId))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const offset = (filters.page - 1) * filters.limit

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        eventType: auditLog.eventType,
        summary: auditLog.summary,
        actorId: auditLog.actorId,
        actorName: user.name,
        actorEmail: user.email,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        createdAt: auditLog.createdAt
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.actorId, user.id))
      .where(where)
      .orderBy(desc(auditLog.createdAt), asc(auditLog.id))
      .limit(filters.limit)
      .offset(offset),
    db.select({ total: count() }).from(auditLog).where(where)
  ])
  const total = countRows[0]?.total ?? 0

  return {
    items: rows.map(row => ({
      id: row.id,
      eventType: row.eventType,
      summary: row.summary,
      actor: row.actorId && row.actorName && row.actorEmail
        ? { id: row.actorId, name: row.actorName, email: row.actorEmail }
        : null,
      targetType: row.targetType,
      targetId: row.targetId,
      createdAt: row.createdAt.toISOString()
    })),
    page: filters.page,
    limit: filters.limit,
    total,
    totalPages: Math.ceil(total / filters.limit)
  }
}
