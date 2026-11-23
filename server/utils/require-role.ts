import type { H3Event } from 'h3'
import type { AppRole } from '../../shared/auth/permissions'
import { recordAuditEvent } from '../services/audit-log-service'

export async function requireRole(event: H3Event, ...allowed: AppRole[]) {
  try {
    return await requireUserSession(event, { user: { role: allowed } })
  } catch (error) {
    await recordAuditEvent({
      eventType: 'ACTION_REJECTED',
      summary: 'Aksi ditolak oleh role guard',
      metadata: {
        path: event.path,
        method: event.method,
        requiredRoles: allowed
      }
    })
    throw error
  }
}
