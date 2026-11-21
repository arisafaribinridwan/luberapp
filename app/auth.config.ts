import { defineClientAuth } from '@nuxtjs/better-auth/config'
import { adminClient, twoFactorClient } from 'better-auth/client/plugins'
import { ac, roles } from '~~/shared/auth/permissions'

export default defineClientAuth({
  plugins: [
    adminClient({ ac, roles }),
    twoFactorClient({
      onTwoFactorRedirect() {
        navigateTo('/two-factor')
      }
    })
  ]
})
