import { useMySqlPool } from '#server/database/client'

export default defineEventHandler(async () => {
  const pool = useMySqlPool()
  await pool.query('SELECT 1')
  return { ok: true, database: 'mysql' }
})
