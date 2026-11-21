import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { admin, twoFactor } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/libsql'
import { client } from './server/database/libsql'
import * as schema from './server/database/schema/auth'
import { ac, adminRoles, defaultRole, roles } from './shared/auth/permissions'

export const auth = betterAuth({
  appName: 'Luber',
  database: drizzleAdapter(drizzle({ client, relations: schema.authRelations }), { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60,
    updateAge: 0
  },
  plugins: [
    admin({ ac, roles, defaultRole, adminRoles }),
    twoFactor()
  ]
})
