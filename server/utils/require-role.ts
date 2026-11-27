import type { H3Event } from 'h3'
import type { AppRole } from '../../shared/auth/permissions'
import { recordAuditEvent } from '../services/audit-log-service'

export async function requireRole(event: H3Event, ...allowed: AppRole[]) {
  try {
    return await requireUserSession(event, { user: { role: allowed } })
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    // Hanya 403 (login tapi role salah) yang bernilai audit. 401 = belum login / sesi habis,
    // volumenya tinggi (bot, tab lama) dan akan membanjiri tabel audit.
    // Error lain (mis. DB down) BUKAN "ACTION_REJECTED".
    if (statusCode === 403) {
      void recordAuditEvent({
        eventType: 'ACTION_REJECTED',
        summary: 'Aksi ditolak oleh role guard',
        metadata: { path: event.path, method: event.method, requiredRoles: allowed }
      }).catch(() => {})
    }
    throw error
  }
}
