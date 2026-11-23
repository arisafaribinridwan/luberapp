import { createError } from 'h3'
import type { ZodError } from 'zod'
import {
  insertMemberSchema,
  updateMemberSchema,
  type InsertMember,
  type UpdateMember
} from '../database/schema'
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

export function normalizeMemberUpdate(input: unknown): UpdateMember {
  const result = updateMemberSchema.safeParse(input)
  if (!result.success) throw validationError(result.error)
  return result.data
}

export async function createMember(input: unknown) {
  const normalized = normalizeMemberInput(input)
  if (await findMemberById(normalized.id)) throw createError({ statusCode: 409, statusMessage: 'ID anggota sudah digunakan' })
  return insertMember(normalized)
}

export async function editMember(id: string, input: unknown) {
  const current = await findMemberById(id)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan' })
  const normalized = normalizeMemberUpdate(input)
  return updateMember(id, normalized)
}
