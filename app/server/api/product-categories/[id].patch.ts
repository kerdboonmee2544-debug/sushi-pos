import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { productCategories, products } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ name: z.string().trim().min(1).max(100) })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const categoryId = getRouterParam(event, 'id')
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสประเภทสินค้า' })
  const input = schema.parse(await readBody(event))
  const database = useDatabase()

  const rows = await database.select().from(productCategories)
    .where(and(eq(productCategories.id, categoryId), eq(productCategories.shopId, user.shopId))).limit(1)
  const category = rows[0]
  if (!category) throw createError({ statusCode: 404, statusMessage: 'ไม่พบประเภทสินค้า' })

  const duplicate = await database.select({ id: productCategories.id }).from(productCategories)
    .where(and(eq(productCategories.shopId, user.shopId), eq(productCategories.name, input.name))).limit(1)
  if (duplicate[0]?.id && duplicate[0].id !== categoryId) {
    throw createError({ statusCode: 409, statusMessage: 'มีประเภทสินค้านี้แล้ว' })
  }

  await database.transaction(async (transaction) => {
    await transaction.update(products).set({ category: input.name })
      .where(and(eq(products.shopId, user.shopId), eq(products.category, category.name)))
    await transaction.update(productCategories).set({ name: input.name })
      .where(and(eq(productCategories.id, categoryId), eq(productCategories.shopId, user.shopId)))
  })
  return { success: true, id: categoryId, name: input.name }
})
