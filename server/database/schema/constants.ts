export const USER_ROLES = ['member', 'pengurus', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const MEMBER_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export const MANUAL_ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type ManualAccountStatus = (typeof MANUAL_ACCOUNT_STATUSES)[number]

export const FUND_PURPOSES = [
  'PENUTUPAN_DEFISIT',
  'MODAL_PUTAR',
  'OPERASIONAL'
] as const
export type FundPurpose = (typeof FUND_PURPOSES)[number]

export const TRANSACTION_TYPES = [
  'HIBAH_MASUK',
  'SIMPANAN_MASUK',
  'PENARIKAN_SIMPANAN',
  'PENCAIRAN_PINJAMAN',
  'ANGSURAN_PINJAMAN',
  'BEBAN_OPERASIONAL',
  'TRANSFER_ANTAR_REKENING',
  'SALDO_AWAL_DEFISIT',
  'ALOKASI_HIBAH_PENUTUP_DEFISIT'
] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const AUDIT_EVENT_TYPES = [
  'LOGIN_SUCCEEDED',
  'LOGIN_FAILED',
  'LOGOUT',
  'ACTION_REJECTED',
  'TRANSACTION_CREATED',
  'TRANSFER_CREATED',
  'MANUAL_ACCOUNT_CREATED',
  'MANUAL_ACCOUNT_UPDATED',
  'USER_UPDATED',
  'CONFIG_UPDATED'
] as const
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number]

export const COA_ACCOUNTS = {
  CASH_AND_BANK: '1-1001',
  GRANT_CAPITAL: '3-1001',
  CASH_DEFICIT: '3-1002'
} as const
export type CoaAccount = (typeof COA_ACCOUNTS)[keyof typeof COA_ACCOUNTS]
