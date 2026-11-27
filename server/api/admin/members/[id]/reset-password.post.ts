import { createError, readBody } from 'h3'
import { z } from 'zod'
import { db } from '../../../../database'
import { user } from '../../../../database/schema/auth'
import { findMemberById } from '../../../../repositories/member-repository'
import { eq } from 'drizzle-orm'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password minimal 8 karakter.').max(128, 'Password terlalu panjang.')
})

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID anggota wajib diisi' })
  const member = await findMemberById(id)
  if (!member?.userId) throw createError({ statusCode: 404, statusMessage: 'Akun pengguna tidak ditemukan' })
  const [authUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, member.userId)).limit(1)
  if (!authUser) throw createError({ statusCode: 404, statusMessage: 'Akun pengguna tidak ditemukan' })
  const result = resetPasswordSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Password tidak valid' })
  await serverAuth(event).api.setUserPassword({
    body: { userId: authUser.id, newPassword: result.data.password },
    headers: new Headers(getHeaders(event) as Record<string, string>)
  })
  return { success: true }
})
