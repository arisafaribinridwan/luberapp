import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { admin, twoFactor } from 'better-auth/plugins'
import { db } from './database'
import * as schema from './database/schema/auth'
import { ac, adminRoles, defaultRole, roles } from '../shared/auth/permissions'
import { auditAuthEvent } from './services/audit-auth-hooks'

export default defineServerAuth({
  appName: 'Luber',
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true
  },
  session: {
    expiresIn: 60 * 60,
    updateAge: 0
  },
  hooks: {
    after: async (context) => {
      await auditAuthEvent(context)
      return {}
    }
  },
  plugins: [
    admin({ ac, roles, defaultRole, adminRoles }),
    twoFactor()
  ]
})
