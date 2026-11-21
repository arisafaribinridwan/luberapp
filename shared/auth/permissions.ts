import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

export const ac = createAccessControl(defaultStatements)

export const roles = {
  member: ac.newRole({ user: [], session: [] }),
  pengurus: ac.newRole({ user: [], session: [] }),
  admin: ac.newRole({ ...adminAc.statements })
}

export type AppRole = keyof typeof roles

export const defaultRole: AppRole = 'member'
export const adminRoles: AppRole[] = ['admin']

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && Object.hasOwn(roles, value)
}
