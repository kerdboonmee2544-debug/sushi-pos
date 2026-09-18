import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { useDatabase } from '#server/database/client'
import { orderItems, orders } from '#server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'kitchen', 'manager', 'admin'])
  const db = useDatabase()
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.shopId, user.shopId), ne(orders.status, 'cancelled')))
    .orderBy(desc(orders.createdAt))
    .limit(100)

  if (!rows.length) return []

  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map(order => order.id)))
  return rows.map(order => ({
    ...order,
    items: items.filter(item => item.orderId === order.id)
  }))
})
