import { defineRelationsPart } from 'drizzle-orm'
import { account, authRelations, session, twoFactor, user, verification } from './auth'
import { auditLog } from './audit-log'
import { manualAccount } from './manual-account'
import { member } from './member'
import { transaction } from './transaction'

export * from './auth'
export * from './audit-log'
export * from './constants'
export * from './manual-account'
export * from './member'
export * from './transaction'

export const databaseSchema = {
  account,
  auditLog,
  manualAccount,
  member,
  session,
  transaction,
  twoFactor,
  user,
  verification
}

export const relations = defineRelationsPart(databaseSchema, r => ({
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id })
  },
  auditLog: {
    actor: r.one.user({ from: r.auditLog.actorId, to: r.user.id })
  },
  manualAccount: {
    createdBy: r.one.user({ from: r.manualAccount.createdById, to: r.user.id }),
    updatedBy: r.one.user({ from: r.manualAccount.updatedById, to: r.user.id }),
    destinationTransactions: r.many.transaction({ from: r.manualAccount.id, to: r.transaction.destinationAccount }),
    sourceTransactions: r.many.transaction({ from: r.manualAccount.id, to: r.transaction.sourceAccount })
  },
  member: {
    transactions: r.many.transaction({ from: r.member.id, to: r.transaction.memberId })
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id })
  },
  transaction: {
    createdBy: r.one.user({ from: r.transaction.createdById, to: r.user.id }),
    member: r.one.member({ from: r.transaction.memberId, to: r.member.id }),
    destinationManualAccount: r.one.manualAccount({ from: r.transaction.destinationAccount, to: r.manualAccount.id }),
    sourceManualAccount: r.one.manualAccount({ from: r.transaction.sourceAccount, to: r.manualAccount.id })
  },
  twoFactor: {
    user: r.one.user({ from: r.twoFactor.userId, to: r.user.id })
  },
  user: {
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
    accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
    twoFactors: r.many.twoFactor({ from: r.user.id, to: r.twoFactor.userId }),
    auditLogs: r.many.auditLog({ from: r.user.id, to: r.auditLog.actorId }),
    createdManualAccounts: r.many.manualAccount({ from: r.user.id, to: r.manualAccount.createdById }),
    updatedManualAccounts: r.many.manualAccount({ from: r.user.id, to: r.manualAccount.updatedById }),
    transactions: r.many.transaction({ from: r.user.id, to: r.transaction.createdById })
  },
  verification: {}
}))

// Kept as a compatibility export for Better Auth consumers that import auth relations directly.
export { authRelations }
