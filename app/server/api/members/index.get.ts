import { asc, eq } from 'drizzle-orm'
import { members } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'manager', 'admin'])
  return useDatabase().select().from(members).where(eq(members.shopId, user.shopId)).orderBy(asc(members.name))
})
