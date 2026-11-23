import { getQuery, createError } from 'h3'
import { listMembers } from '../../../repositories/member-repository'
import { MEMBER_STATUSES, type MemberStatus } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')
  const query = getQuery(event)
  const rawPage = String(query.page ?? '1')
  const rawLimit = String(query.limit ?? '20')
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1
  const limit = /^\d+$/.test(rawLimit) ? Math.min(Number(rawLimit), 100) : 20
  if (page < 1 || limit < 1) throw createError({ statusCode: 400, statusMessage: 'Pagination tidak valid' })
  const status = typeof query.status === 'string' && MEMBER_STATUSES.includes(query.status as MemberStatus) ? query.status as MemberStatus : undefined
  if (query.status && !status) throw createError({ statusCode: 400, statusMessage: 'Status tidak valid' })
  return listMembers({ q: typeof query.q === 'string' ? query.q.trim().slice(0, 100) : undefined, status, page, limit })
})
