import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { productCategories } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ name: z.string().trim().min(1).max(100) })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const input = schema.parse(await readBody(event))
  const database = useDatabase()
  const existing = await database
    .select({ id: productCategories.id })
    .from(productCategories)
    .where(and(eq(productCategories.shopId, user.shopId), eq(productCategories.name, input.name)))
    .limit(1)
  if (existing.length) throw createError({ statusCode: 409, statusMessage: 'มีประเภทสินค้านี้แล้ว' })

  const row = { id: crypto.randomUUID(), shopId: user.shopId, name: input.name }
  await database.insert(productCategories).values(row)
  return row
})
