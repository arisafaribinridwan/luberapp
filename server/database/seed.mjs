import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:.data/sqlite.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

const client = createClient({ url, authToken })

const manualAccounts = [
  {
    id: 'muamalat-Ketua',
    name: 'Muamalat Ketua',
    accountNumber: null,
    holderName: 'Ketua'
  },
  {
    id: 'bca-ketua',
    name: 'BCA Ketua',
    accountNumber: null,
    holderName: 'Ketua'
  },
  {
    id: 'kas-tunai',
    name: 'Kas Tunai',
    accountNumber: null,
    holderName: 'Kas komunitas'
  }
]

try {
  await client.batch(
    manualAccounts.map(account => ({
      sql: `
        INSERT INTO manual_accounts (id, name, account_number, holder_name, status)
        VALUES (?, ?, ?, ?, 'ACTIVE')
        ON CONFLICT(name) DO NOTHING
      `,
      args: [account.id, account.name, account.accountNumber, account.holderName]
    })),
    'write'
  )

  console.log(`Seeded ${manualAccounts.length} default manual accounts (existing rows were kept).`)
} finally {
  client.close()
}
