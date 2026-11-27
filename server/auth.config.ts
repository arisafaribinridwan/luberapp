import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { admin, twoFactor } from 'better-auth/plugins'
import { db } from './database'
import * as schema from './database/schema/auth'
import { ac, adminRoles, defaultRole, roles } from '../shared/auth/permissions'
import { auditAuthEvent } from './services/audit-auth-hooks'

// Hook "after" berjalan untuk SETIAP pemanggilan endpoint better-auth, termasuk
// get-session yang dipanggil requireUserSession di tiap request API. Audit hanya
// event yang bermakna.
const AUDITED_PREFIXES = ['/sign-in', '/sign-out', '/two-factor', '/admin', '/change-password', '/reset-password']

export default defineServerAuth({
  appName: 'Luber',
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 5,
    // Menghindari query sesi+user ke DB di setiap request. Konsekuensi: ban/ubah role
    // baru berlaku maksimal setelah maxAge (di sini 1 menit). Sesuaikan kebutuhan.
    cookieCache: { enabled: true, maxAge: 60 }
  },
  hooks: {
    after: async (context) => {
      const path = (context as unknown as { path?: string }).path
      if (!AUDITED_PREFIXES.some(prefix => path?.startsWith(prefix))) return {}
      // Jangan blokir response karena penulisan audit; kegagalan audit tidak boleh menggagalkan login.
      void auditAuthEvent(context).catch(error => console.error('[audit] gagal mencatat event auth', error))
      return {}
    }
  },
  plugins: [
    admin({ ac, roles, defaultRole, adminRoles }),
    twoFactor()
  ]
})
