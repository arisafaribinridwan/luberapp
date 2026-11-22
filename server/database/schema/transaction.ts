import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import {
  FUND_PURPOSES,
  TRANSACTION_TYPES,
  type FundPurpose,
  type TransactionType
} from './constants'
import { manualAccount } from './manual-account'
import { member } from './member'

export const transaction = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    txType: text('tx_type').$type<TransactionType>().notNull(),
    fundPurpose: text('fund_purpose').$type<FundPurpose>(),
    txDate: text('tx_date').notNull(),
    debitAccount: text('debit_account').notNull(),
    creditAccount: text('credit_account').notNull(),
    amount: integer('amount').notNull(),
    description: text('description').notNull(),
    meetingReference: text('meeting_reference'),
    relatedTransactionId: text('related_transaction_id'),
    memberId: text('member_id').references(() => member.id, { onDelete: 'restrict' }),
    destinationAccount: text('destination_account').references(() => manualAccount.id, { onDelete: 'restrict' }),
    sourceAccount: text('source_account').references(() => manualAccount.id, { onDelete: 'restrict' }),
    attachmentUrl: text('attachment_url').notNull(),
    attachmentDriveId: text('attachment_drive_id').notNull(),
    createdById: text('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull()
  },
  table => [
    index('transaction_type_idx').on(table.txType),
    index('transaction_date_idx').on(table.txDate),
    index('transaction_member_idx').on(table.memberId),
    index('transaction_related_idx').on(table.relatedTransactionId),
    index('transaction_destination_account_idx').on(table.destinationAccount),
    index('transaction_source_account_idx').on(table.sourceAccount),
    index('transaction_created_by_idx').on(table.createdById)
  ]
)

export type Transaction = typeof transaction.$inferSelect
export type NewTransaction = typeof transaction.$inferInsert

export { FUND_PURPOSES, TRANSACTION_TYPES }
