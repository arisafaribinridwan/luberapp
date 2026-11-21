import { drizzle } from 'drizzle-orm/libsql'
import { client } from './libsql'
import { authRelations } from './schema/auth'

export const db = drizzle({ client, relations: authRelations })
