import type { AuditLogPage } from '~~/shared/types/audit-log'

const emptyPage: AuditLogPage = {
  items: [],
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
}

export function useAuditLogs() {
  const result = shallowRef<AuditLogPage>(emptyPage)
  const pending = shallowRef(false)
  const errorMessage = shallowRef('')

  async function fetchLogs(query: Record<string, string | number | undefined> = {}) {
    pending.value = true
    errorMessage.value = ''

    try {
      result.value = await $fetch<AuditLogPage>('/api/admin/audit-logs', { query })
    } catch {
      errorMessage.value = 'Log aktivitas tidak dapat dimuat.'
    } finally {
      pending.value = false
    }
  }

  return { result, pending, errorMessage, fetchLogs }
}
