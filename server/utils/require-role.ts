import type { H3Event } from 'h3'
import type { AppRole } from '../../shared/auth/permissions'

export function requireRole(event: H3Event, ...allowed: AppRole[]) {
  return requireUserSession(event, { user: { role: allowed } })
}
