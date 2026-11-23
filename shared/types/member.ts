import type { MemberStatus } from '~~/server/database/schema/constants'

export type MemberDto = {
  id: string
  name: string
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
