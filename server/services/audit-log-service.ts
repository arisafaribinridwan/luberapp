import type { AuditEventType } from '../database/schema'
import { insertAuditLog } from '../repositories/audit-log-repository'

const SENSITIVE_KEY = /(password|passcode|pin|token|secret|backup.?code|attachment|file.?base64|file.?content)/i

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || typeof value === 'boolean' || typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') return value.slice(0, 500)
  if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitizeMetadata(item, depth + 1))

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY.test(key))
        .slice(0, 50)
        .map(([key, item]) => [key, sanitizeMetadata(item, depth + 1)])
    )
  }

  return undefined
}

export type AuditEventInput = {
  eventType: AuditEventType
  summary: string
  actorId?: string | null
  targetType?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown>
}

export async function recordAuditEvent(input: AuditEventInput) {
  const metadata = input.metadata ? sanitizeMetadata(input.metadata) : undefined

  try {
    return await insertAuditLog({
      id: crypto.randomUUID(),
      eventType: input.eventType,
      summary: input.summary.slice(0, 500),
      actorId: input.actorId ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadataJson: metadata && Object.keys(metadata).length > 0
        ? JSON.stringify(metadata)
        : null
    })
  } catch (error) {
    console.error('[audit-log] failed to write event', error)
    return null
  }
}
