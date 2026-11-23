export type AuditLogActor = {
  id: string
  name: string
  email: string
}

export type AuditLogDto = {
  id: string
  eventType: string
  summary: string
  actor: AuditLogActor | null
  targetType: string | null
  targetId: string | null
  createdAt: string
}

export type AuditLogPage = {
  items: AuditLogDto[]
  page: number
  limit: number
  total: number
  totalPages: number
}
