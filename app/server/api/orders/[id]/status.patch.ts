import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { orders } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const bodySchema = z.object({ status: z.enum(['pending', 'preparing', 'completed']) })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['kitchen', 'manager', 'admin'])
  const orderId = getRouterParam(event, 'id')
  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสออเดอร์' })
  const { status } = bodySchema.parse(await readBody(event))
  const result = await useDatabase().update(orders).set({ status }).where(and(eq(orders.id, orderId), eq(orders.shopId, user.shopId)))
  if (!result[0].affectedRows) throw createError({ statusCode: 404, statusMessage: 'ไม่พบออเดอร์' })
  return { success: true, status }
})
