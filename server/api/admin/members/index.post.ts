import { readBody, createError } from 'h3'
import { createMember } from '../../../services/member-service'
import { recordAuditEvent } from '../../../services/audit-log-service'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, 'admin')
  const created = await createMember(await readBody(event))
  if (!created) throw createError({ statusCode: 500, statusMessage: 'Anggota gagal dibuat' })
  await recordAuditEvent({ eventType: 'USER_UPDATED', summary: 'Anggota dibuat', actorId: session.user.id, targetType: 'member', targetId: created.id, metadata: { name: created.name, status: created.status } })
  return created
})
