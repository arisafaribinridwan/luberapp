import { z } from 'zod'
import { MEMBER_STATUSES } from '../../../database/schema/constants'
import { listMembers } from '../../../repositories/member-repository'

const querySchema = z.object({
  q: z.string().trim().max(100).optional().transform(v => v || undefined),
  status: z.enum(MEMBER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const parsed = await getValidatedQuery(event, input => querySchema.safeParse(input))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw createError({ statusCode: 400, statusMessage: `${issue?.path.join('.') || 'query'}: ${issue?.message ?? 'tidak valid'}` })
  }

  // Data admin berisi email/role: jangan pernah di-cache oleh CDN/proxy bersama.
  setHeader(event, 'Cache-Control', 'private, no-store')
  return listMembers(parsed.data)
})
