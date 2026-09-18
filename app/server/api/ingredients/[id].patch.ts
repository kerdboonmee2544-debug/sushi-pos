import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { ingredients, ingredientMovements } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ name: z.string().trim().min(1).max(150).optional(), unit: z.string().trim().min(1).max(30).optional(), quantity: z.number().nonnegative().optional(), minimumQuantity: z.number().nonnegative().optional(), currentPrice: z.number().nonnegative().optional(), note: z.string().trim().max(255).optional() })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const ingredientId = getRouterParam(event, 'id')
  if (!ingredientId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสวัตถุดิบ' })
  const input = schema.parse(await readBody(event))
  const db = useDatabase()
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(ingredients).where(and(eq(ingredients.id, ingredientId), eq(ingredients.shopId, user.shopId))).limit(1)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'ไม่พบวัตถุดิบ' })
    const nextQuantity = input.quantity ?? Number(current.quantity)
    const delta = nextQuantity - Number(current.quantity)
    await tx.update(ingredients).set({ name: input.name, unit: input.unit, quantity: input.quantity === undefined ? undefined : input.quantity.toFixed(3), minimumQuantity: input.minimumQuantity === undefined ? undefined : input.minimumQuantity.toFixed(3), currentPrice: input.currentPrice === undefined ? undefined : input.currentPrice.toFixed(2) }).where(eq(ingredients.id, ingredientId))
    if (delta !== 0) await tx.insert(ingredientMovements).values({ ingredientId, quantity: delta.toFixed(3), type: 'adjustment', note: input.note || 'ปรับยอดคงเหลือ' })
    return { success: true }
  })
})
