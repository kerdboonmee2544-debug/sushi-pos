import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { products } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  tag: z.string().trim().max(50).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const productId = getRouterParam(event, 'id')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })
  const input = schema.parse(await readBody(event))
  const values = { ...input, price: input.price === undefined ? undefined : input.price.toFixed(2) }
  const result = await useDatabase().update(products).set(values).where(and(eq(products.id, productId), eq(products.shopId, user.shopId)))
  if (!result[0].affectedRows) throw createError({ statusCode: 404, statusMessage: 'ไม่พบสินค้า' })
  return { success: true }
})
