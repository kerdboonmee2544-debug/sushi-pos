import { asc, eq } from 'drizzle-orm'
import { ingredients } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  return useDatabase().select().from(ingredients).where(eq(ingredients.shopId, user.shopId)).orderBy(asc(ingredients.name))
})
