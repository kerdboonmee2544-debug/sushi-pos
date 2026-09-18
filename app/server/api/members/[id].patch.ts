import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { members } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({
  phone: z.string().regex(/^0[0-9]{8,9}$/).optional(),
  name: z.string().trim().min(1).max(150).optional(),
  tier: z.enum(['Silver', 'Gold', 'Platinum']).optional(),
  discountPercent: z.number().min(0).max(100).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'manager', 'admin'])
  const memberId = getRouterParam(event, 'id')
  if (!memberId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสมาชิก' })
  const input = schema.parse(await readBody(event))
  const values = { ...input, discountPercent: input.discountPercent === undefined ? undefined : input.discountPercent.toFixed(2) }
  const result = await useDatabase().update(members).set(values).where(and(eq(members.id, memberId), eq(members.shopId, user.shopId)))
  if (!result[0].affectedRows) throw createError({ statusCode: 404, statusMessage: 'ไม่พบสมาชิก' })
  return { success: true }
})
