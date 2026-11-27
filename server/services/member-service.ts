import { createError } from 'h3'
import { z, type ZodError } from 'zod'
import { insertMemberSchema, updateMemberSchema, type InsertMember, type UpdateMember } from '../database/schema'
import { USER_ROLES } from '../database/schema/constants'
import { insertMember, updateMember } from '../repositories/member-repository'

function validationError(error: ZodError) {
  const issue = error.issues[0]
  const field = issue?.path.join('.')
  return createError({
    statusCode: 400,
    statusMessage: field ? `${field}: ${issue?.message}` : issue?.message ?? 'Data anggota tidak valid'
  })
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) throw validationError(result.error)
  return result.data
}

// Pipe: trim + lowercase DULU, baru validasi email (z.email().trim() memvalidasi sebelum trim).
const memberImageSchema = z.string()
  .trim()
  .max(2_000_000, 'Foto profil terlalu besar.')
  .refine(value => !value.startsWith('data:') || /^data:image\/(?:jpeg|png);base64,/.test(value), 'Foto profil hanya boleh berupa JPG, JPEG, atau PNG.')
  .nullable()
  .optional()
  .transform(value => value || null)

const createMemberSchema = insertMemberSchema.extend({
  email: z.string().trim().toLowerCase().pipe(z.email('Format email belum benar.')),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(128, 'Password terlalu panjang.'),
  role: z.enum(USER_ROLES),
  image: memberImageSchema
})
export type CreateMemberInput = z.infer<typeof createMemberSchema>

export const normalizeMemberImage = (input: unknown) => parse(memberImageSchema, input)

export const normalizeMemberInput = (input: unknown): InsertMember => parse(insertMemberSchema, input)
export const normalizeMemberCreate = (input: unknown): CreateMemberInput => parse(createMemberSchema, input)
export const normalizeMemberUpdate = (input: unknown): UpdateMember => parse(updateMemberSchema, input)

// Constraint UNIQUE di database adalah satu-satunya penjaga yang bebas race condition.
function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string, message?: string, cause?: unknown } | undefined
  if (!e) return false
  if (/UNIQUE constraint failed/i.test(e.message ?? '')) return true
  return e.cause ? isUniqueViolation(e.cause) : false
}

export async function createMember(input: unknown, userId?: string) {
  const source = input && typeof input === 'object' ? input : {}
  const normalized = normalizeMemberInput({ ...source, userId })
  try {
    return await insertMember(normalized) // 1 query, bukan SELECT lalu INSERT
  } catch (error) {
    if (isUniqueViolation(error)) throw createError({ statusCode: 409, statusMessage: 'ID anggota atau akun sudah digunakan' })
    throw error
  }
}

export async function editMember(id: string, input: unknown) {
  const normalized = normalizeMemberUpdate(input)
  try {
    const row = await updateMember(id, normalized) // 1 query, bukan SELECT lalu UPDATE
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan' })
    return row
  } catch (error) {
    if (isUniqueViolation(error)) throw createError({ statusCode: 409, statusMessage: 'Akun sudah terhubung ke anggota lain' })
    throw error
  }
}
