import { asc, eq } from 'drizzle-orm'
import { productCategories } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  return useDatabase()
    .select()
    .from(productCategories)
    .where(eq(productCategories.shopId, user.shopId))
    .orderBy(asc(productCategories.createdAt), asc(productCategories.name))
})
