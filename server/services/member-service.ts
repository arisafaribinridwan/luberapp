import { createError } from 'h3'
import { z, type ZodError } from 'zod'
import {
  insertMemberSchema,
  updateMemberSchema,
  type InsertMember,
  type UpdateMember
} from '../database/schema'
import { USER_ROLES } from '../database/schema/constants'
import { findMemberById, insertMember, updateMember } from '../repositories/member-repository'

function validationError(error: ZodError) {
  const issue = error.issues[0]
  const field = issue?.path.join('.')
  return createError({
    statusCode: 400,
    statusMessage: field ? `${field}: ${issue?.message}` : issue?.message ?? 'Data anggota tidak valid'
  })
}

export function normalizeMemberInput(input: unknown): InsertMember {
  const result = insertMemberSchema.safeParse(input)
  if (!result.success) throw validationError(result.error)
  return result.data
}

const createMemberSchema = insertMemberSchema.extend({
  email: z.email('Format email belum benar.').trim().toLowerCase(),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(128, 'Password terlalu panjang.'),
  role: z.enum(USER_ROLES)
})

export type CreateMemberInput = z.infer<typeof createMemberSchema>

export function normalizeMemberCreate(input: unknown): CreateMemberInput {
  const result = createMemberSchema.safeParse(input)
  if (!result.success) throw validationError(result.error)
  return result.data
}

export function normalizeMemberUpdate(input: unknown): UpdateMember {
  const result = updateMemberSchema.safeParse(input)
  if (!result.success) throw validationError(result.error)
  return result.data
}

export async function createMember(input: unknown, userId?: string) {
  const source = input && typeof input === 'object' ? input : {}
  const normalized = normalizeMemberInput({ ...source, userId })
  if (await findMemberById(normalized.id)) throw createError({ statusCode: 409, statusMessage: 'ID anggota sudah digunakan' })
  return insertMember(normalized)
}

export async function editMember(id: string, input: unknown) {
  const current = await findMemberById(id)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan' })
  const normalized = normalizeMemberUpdate(input)
  return updateMember(id, normalized)
}
