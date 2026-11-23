import { getQuery, createError } from 'h3'
import { AUDIT_EVENT_TYPES, type AuditEventType } from '../../database/schema'
import { listAuditLogs } from '../../repositories/audit-log-repository'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function queryString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function parseDate(value: unknown, field: string, endOfDay = false) {
  const raw = queryString(value)
  if (!raw) return undefined
  if (!datePattern.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: `${field} harus berformat YYYY-MM-DD` })
  }

  const date = new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: `${field} tidak valid` })
  }
  return date
}

function parsePositiveInt(value: unknown, fallback: number, field: string, max: number) {
  const raw = queryString(value)
  if (!raw) return fallback
  if (!/^\d+$/.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: `${field} harus berupa angka` })
  }
  const parsed = Number(raw)
  if (parsed < 1 || parsed > max) {
    throw createError({ statusCode: 400, statusMessage: `${field} berada di luar batas yang diizinkan` })
  }
  return parsed
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')
  const query = getQuery(event)
  const eventType = queryString(query.eventType)

  if (eventType && !AUDIT_EVENT_TYPES.includes(eventType as AuditEventType)) {
    throw createError({ statusCode: 400, statusMessage: 'eventType tidak dikenal' })
  }

  const actorId = queryString(query.actorId)
  if (actorId && actorId.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'actorId tidak valid' })
  }

  return listAuditLogs({
    from: parseDate(query.from, 'from'),
    to: parseDate(query.to, 'to', true),
    eventType: eventType as AuditEventType | undefined,
    actorId,
    page: parsePositiveInt(query.page, 1, 'page', 10_000),
    limit: parsePositiveInt(query.limit, 50, 'limit', 100)
  })
})
