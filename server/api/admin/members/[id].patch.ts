import { readBody, createError } from 'h3'
import { editMember } from '../../../services/member-service'
import { USER_ROLES } from '../../../database/schema/constants'
import { db } from '../../../database'
import { user } from '../../../database/schema/auth'
import { eq } from 'drizzle-orm'
import { recordAuditEvent } from '../../../services/audit-log-service'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, 'admin')
  const headers = new Headers(getHeaders(event) as Record<string, string>)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID anggota wajib diisi' })
  const body = await readBody(event)
  const role = body?.role
  if (role !== undefined && (typeof role !== 'string' || !USER_ROLES.includes(role as typeof USER_ROLES[number]))) {
    throw createError({ statusCode: 400, statusMessage: 'Role pengguna tidak valid' })
  }
  const validRole = typeof role === 'string' ? role as typeof USER_ROLES[number] : undefined
  const updated = await editMember(id, body)
  if (!updated) throw createError({ statusCode: 500, statusMessage: 'Anggota gagal diperbarui' })
  const [authUser] = updated.userId
    ? await db.select({ name: user.name, role: user.role }).from(user).where(eq(user.id, updated.userId)).limit(1)
    : []
  const nameChanged = typeof body?.name === 'string' && body.name !== authUser?.name
  const roleChanged = validRole !== undefined && validRole !== authUser?.role
  if (updated.userId && (nameChanged || roleChanged)) {
    const auth = serverAuth(event)
    const authData: { name?: string, role?: typeof USER_ROLES[number] } = {}
    if (nameChanged) authData.name = body.name
    if (roleChanged) authData.role = validRole
    await auth.api.adminUpdateUser({ body: { userId: updated.userId, data: authData }, headers })
  }
  await recordAuditEvent({ eventType: 'USER_UPDATED', summary: 'Anggota diperbarui', actorId: session.user.id, targetType: 'member', targetId: id, metadata: { status: updated?.status } })
  return updated
})
