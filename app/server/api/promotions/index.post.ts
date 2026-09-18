import { z } from 'zod'
import { promotions } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ name: z.string().trim().min(1).max(150), type: z.enum(['percent', 'fixed']), value: z.number().positive(), minSpend: z.number().nonnegative() })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const input = schema.parse(await readBody(event))
  const row = { id: crypto.randomUUID(), shopId: user.shopId, name: input.name, type: input.type, value: input.value.toFixed(2), minSpend: input.minSpend.toFixed(2), active: true }
  await useDatabase().insert(promotions).values(row)
  return row
})
