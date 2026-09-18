import { z } from 'zod'
import { products } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100).optional().default('อื่น ๆ'),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  minimumStock: z.number().int().nonnegative().optional().default(0),
  tag: z.string().trim().max(50).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const input = schema.parse(await readBody(event))
  const row = { id: crypto.randomUUID(), shopId: user.shopId, ...input, price: input.price.toFixed(2), active: true }
  await useDatabase().insert(products).values(row)
  return row
})
