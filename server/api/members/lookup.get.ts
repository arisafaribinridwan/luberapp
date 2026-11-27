import { getQuery, createError } from 'h3'
import { listMembers } from '../../repositories/member-repository'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'pengurus', 'admin')
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  if (q.length < 2) throw createError({ statusCode: 400, statusMessage: 'Pencarian minimal 2 karakter' })
  const result = await listMembers({ q: q.slice(0, 80), status: 'ACTIVE', page: 1, limit: 10 })
  return { items: result.items.map(({ id, name, status }) => ({ id, name, status })) }
})
