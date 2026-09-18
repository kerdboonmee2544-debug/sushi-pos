import { z } from 'zod'
import { members } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({
  phone: z.string().regex(/^0[0-9]{8,9}$/),
  name: z.string().trim().min(1).max(150),
  tier: z.enum(['Silver', 'Gold', 'Platinum']),
  discountPercent: z.number().min(0).max(100)
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'manager', 'admin'])
  const input = schema.parse(await readBody(event))
  const row = { id: crypto.randomUUID(), shopId: user.shopId, ...input, discountPercent: input.discountPercent.toFixed(2) }
  await useDatabase().insert(members).values(row)
  return row
})
