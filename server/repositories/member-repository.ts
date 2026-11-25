import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '../database'
import { member, type MemberStatus, user } from '../database/schema'

export type MemberFilters = { q?: string, status?: MemberStatus, page: number, limit: number }

// Escape wildcard LIKE agar input "50%" atau "a_b" dicari secara literal.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&')

export async function listMembers({ q, status, page, limit }: MemberFilters) {
  const conditions = []
  if (q) {
    const pattern = `%${escapeLike(q)}%`
    conditions.push(sql`(${member.id} LIKE ${pattern} ESCAPE '\\' OR ${member.name} LIKE ${pattern} ESCAPE '\\')`)
  }
  if (status) conditions.push(eq(member.status, status))
  const where = conditions.length ? and(...conditions) : undefined

  // Dua query paralel. Count tidak perlu JOIN ke tabel user (hasilnya sama, lebih murah).
  const [items, totals] = await Promise.all([
    db.select({
      id: member.id,
      userId: member.userId,
      name: member.name,
      email: user.email,
      image: user.image,
      role: user.role,
      phone: member.phone,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(where)
      .orderBy(asc(member.name), desc(member.createdAt), asc(member.id)) // id = tie-breaker agar paginasi stabil
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(member).where(where)
  ])

  const total = Number(totals[0]?.total ?? 0)
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
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

export async function updateMember(id: string, input: { name?: string, phone?: string | null, status?: MemberStatus, userId?: string | null }) {
  const [row] = await db.update(member).set({ ...input, updatedAt: new Date() }).where(eq(member.id, id)).returning()
  return row // undefined jika id tidak ada
}
