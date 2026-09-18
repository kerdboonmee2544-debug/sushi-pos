import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from './schema'

let pool: mysql.Pool | undefined

export function useMySqlPool() {
  if (!pool) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) {
      throw new Error('NUXT_DATABASE_URL is not configured')
    }
    pool = mysql.createPool({
      uri: config.databaseUrl,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      decimalNumbers: true,
      timezone: '+07:00'
    })
  }
  return pool
}

export function useDatabase() {
  return drizzle({ client: useMySqlPool(), schema, mode: 'default' })
}
