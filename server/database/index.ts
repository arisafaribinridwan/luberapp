import { drizzle } from 'drizzle-orm/libsql'
import { client } from './libsql'
import { relations } from './schema'

export const db = drizzle({ client, relations })
