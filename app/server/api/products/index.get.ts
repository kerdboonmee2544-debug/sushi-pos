import { and, asc, eq, gt } from 'drizzle-orm'
import { useDatabase } from '#server/database/client'
import { products } from '#server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'kitchen', 'manager', 'admin'])
  const includeInactive = getQuery(event).all === '1' && ['manager', 'admin'].includes(user.role)
  return useDatabase()
    .select()
    .from(products)
    .where(includeInactive ? eq(products.shopId, user.shopId) : and(eq(products.shopId, user.shopId), eq(products.active, true), gt(products.stock, 0)))
    .orderBy(asc(products.name))
})
