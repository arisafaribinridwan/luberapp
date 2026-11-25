import type { MemberStatus } from '~~/server/database/schema/constants'

export type MemberDto = {
  id: string
  userId: string | null
  name: string
  email: string | null
  image: string | null
  role: 'admin' | 'pengurus' | 'member' | null
  phone: string | null
  status: MemberStatus
  createdAt: string
  updatedAt: string
}

export type MemberListResponse = {
  items: MemberDto[]
  page: number
  limit: number
  total: number
  totalPages: number
}
