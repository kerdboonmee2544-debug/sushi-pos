import { z } from 'zod'
import { ingredients } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ name: z.string().trim().min(1).max(150), unit: z.string().trim().min(1).max(30), quantity: z.number().nonnegative(), minimumQuantity: z.number().nonnegative(), currentPrice: z.number().nonnegative() })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const input = schema.parse(await readBody(event))
  const row = { id: crypto.randomUUID(), shopId: user.shopId, name: input.name, unit: input.unit, quantity: input.quantity.toFixed(3), minimumQuantity: input.minimumQuantity.toFixed(3), currentPrice: input.currentPrice.toFixed(2) }
  await useDatabase().insert(ingredients).values(row)
  return row
})
