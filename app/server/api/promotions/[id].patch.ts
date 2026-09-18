import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { promotions } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const promotionId = getRouterParam(event, 'id')
  const { active } = z.object({ active: z.boolean() }).parse(await readBody(event))
  if (!promotionId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสโปรโมชัน' })
  const result = await useDatabase().update(promotions).set({ active }).where(and(eq(promotions.id, promotionId), eq(promotions.shopId, user.shopId)))
  if (!result[0].affectedRows) throw createError({ statusCode: 404, statusMessage: 'ไม่พบโปรโมชัน' })
  return { success: true }
})
