import { isAppRole } from '../../shared/auth/permissions'
import type { AppRole } from '../../shared/auth/permissions'

export function useRole() {
  const { user } = useUserSession()
  const role = computed(() => isAppRole(user.value?.role) ? user.value.role : null)
  const hasRole = (...allowed: AppRole[]) => role.value !== null && allowed.includes(role.value)
  const isAdmin = computed(() => role.value === 'admin')

  return { role, hasRole, isAdmin }
}
