import { readBody, createError } from 'h3'
import { createMember, normalizeMemberCreate } from '../../../services/member-service'
import { findMemberById } from '../../../repositories/member-repository'
import { recordAuditEvent } from '../../../services/audit-log-service'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, 'admin')
  const headers = new Headers(getHeaders(event) as Record<string, string>)
  const input = normalizeMemberCreate(await readBody(event))
  if (await findMemberById(input.id)) throw createError({ statusCode: 409, statusMessage: 'ID anggota sudah digunakan' })
  const auth = serverAuth(event)
  const createdAuth = await auth.api.createUser({
    body: {
      email: input.email,
      name: input.name,
      password: input.password,
      role: input.role
    },
    headers
  })

  let created
  try {
    created = await createMember(input, createdAuth.user.id)
  } catch (error) {
    await auth.api.removeUser({
      body: { userId: createdAuth.user.id },
      headers
    }).catch(() => undefined)
    throw error
  }
  if (!created) throw createError({ statusCode: 500, statusMessage: 'Anggota gagal dibuat' })
  await recordAuditEvent({ eventType: 'USER_UPDATED', summary: 'Anggota dibuat', actorId: session.user.id, targetType: 'member', targetId: created.id, metadata: { name: created.name, status: created.status } })
  return created
})
