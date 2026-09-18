import { desc, eq } from 'drizzle-orm'
import { promotions } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  return useDatabase().select().from(promotions).where(eq(promotions.shopId, user.shopId)).orderBy(desc(promotions.active))
})
