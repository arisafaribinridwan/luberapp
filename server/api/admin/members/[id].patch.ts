import { readBody, createError } from 'h3'
import { editMember } from '../../../services/member-service'
import { recordAuditEvent } from '../../../services/audit-log-service'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, 'admin')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID anggota wajib diisi' })
  const updated = await editMember(id, await readBody(event))
  if (!updated) throw createError({ statusCode: 500, statusMessage: 'Anggota gagal diperbarui' })
  await recordAuditEvent({ eventType: 'USER_UPDATED', summary: 'Anggota diperbarui', actorId: session.user.id, targetType: 'member', targetId: id, metadata: { status: updated?.status } })
  return updated
})
