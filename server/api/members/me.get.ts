import { createError } from 'h3'
import { findMemberByUserId } from '../../repositories/member-repository'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, 'member', 'pengurus', 'admin')
  const current = await findMemberByUserId(session.user.id)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Profil anggota belum terhubung' })
  return { id: current.id, name: current.name, status: current.status }
})
