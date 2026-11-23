import { eq } from 'drizzle-orm'
import { db } from '../database'
import { user } from '../database/schema'
import { recordAuditEvent } from './audit-log-service'

type AuthHookContext = {
  path?: string
  body?: Record<string, unknown>
  context?: {
    session?: { user?: { id?: string } } | null
    returned?: unknown
  }
}

function isFailedResponse(value: unknown) {
  return Boolean(
    value
    && typeof value === 'object'
    && 'statusCode' in value
    && Number((value as { statusCode?: unknown }).statusCode) >= 400
  )
}

export async function auditAuthEvent(context: AuthHookContext) {
  const path = context.path

  if (path === '/sign-in/email') {
    const failed = isFailedResponse(context.context?.returned)
    let actorId: string | null = null

    if (!failed && typeof context.body?.email === 'string') {
      const [matchedUser] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, context.body.email.toLowerCase()))
        .limit(1)
      actorId = matchedUser?.id ?? null
    }

    await recordAuditEvent({
      eventType: failed ? 'LOGIN_FAILED' : 'LOGIN_SUCCEEDED',
      summary: failed ? 'Login gagal' : 'Login berhasil',
      actorId,
      metadata: { method: 'email' }
    })
  }

  if (path === '/sign-out') {
    await recordAuditEvent({
      eventType: 'LOGOUT',
      summary: 'Logout',
      actorId: context.context?.session?.user?.id ?? null
    })
  }

  const userMutationPaths = new Set([
    '/admin/create-user',
    '/admin/update-user',
    '/admin/set-role',
    '/admin/remove-user',
    '/admin/ban-user',
    '/admin/unban-user',
    '/admin/set-user-password'
  ])

  if (path && userMutationPaths.has(path)) {
    const failed = isFailedResponse(context.context?.returned)
    await recordAuditEvent({
      eventType: failed ? 'ACTION_REJECTED' : 'USER_UPDATED',
      summary: failed ? 'Perubahan pengguna ditolak' : 'Data pengguna diperbarui',
      actorId: context.context?.session?.user?.id ?? null,
      targetType: 'user',
      targetId: typeof context.body?.userId === 'string' ? context.body.userId : null,
      metadata: { operation: path }
    })
  }
}
