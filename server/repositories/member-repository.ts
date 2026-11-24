import { and, asc, count, desc, eq, like, or, isNull } from 'drizzle-orm'
import { db } from '../database'
import { member, type MemberStatus, user } from '../database/schema'

export type MemberFilters = { q?: string, status?: MemberStatus, page: number, limit: number }

async function syncUsersToMembers() {
  const usersWithoutMembers = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .where(isNull(member.id))

  if (usersWithoutMembers.length) {
    await db.insert(member).values(usersWithoutMembers.map(authUser => ({
      id: authUser.id,
      userId: authUser.id,
      name: authUser.name,
      phone: null,
      status: 'ACTIVE' as const
    }))).onConflictDoNothing()
  }
}

export async function listMembers(filters: MemberFilters) {
  await syncUsersToMembers()
  const conditions = []
  if (filters.q) {
    const q = `%${filters.q}%`
    conditions.push(or(like(member.id, q), like(member.name, q))!)
  }
  if (filters.status) conditions.push(eq(member.status, filters.status))
  const where = conditions.length ? and(...conditions) : undefined
  const offset = (filters.page - 1) * filters.limit
  const [rows, totals] = await Promise.all([
    db.select({
      id: member.id,
      userId: member.userId,
      name: member.name,
      email: user.email,
      role: user.role,
      phone: member.phone,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    }).from(member).leftJoin(user, eq(member.userId, user.id)).where(where).orderBy(asc(member.name), desc(member.createdAt)).limit(filters.limit).offset(offset),
    db.select({ total: count() }).from(member).where(where)
  ])
  const total = Number(totals[0]?.total ?? 0)
  return { items: rows, page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) }
}

export async function findMemberByUserId(userId: string) {
  const [row] = await db.select().from(member).where(eq(member.userId, userId)).limit(1)
  return row
}

export async function findMemberById(id: string) {
  const [row] = await db.select().from(member).where(eq(member.id, id)).limit(1)
  return row
}

export async function insertMember(input: { id: string, name: string, phone?: string | null, userId?: string | null }) {
  const [row] = await db.insert(member).values({ ...input, status: 'ACTIVE' }).returning()
  return row
}

export async function updateMember(id: string, input: { name?: string, phone?: string | null, status?: MemberStatus }) {
  const [row] = await db.update(member).set({ ...input, updatedAt: new Date() }).where(eq(member.id, id)).returning()
  return row
}
