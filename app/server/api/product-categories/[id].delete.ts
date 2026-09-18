import { and, eq } from 'drizzle-orm'
import { productCategories, products } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const categoryId = getRouterParam(event, 'id')
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสประเภทสินค้า' })
  const database = useDatabase()

  const rows = await database.select().from(productCategories)
    .where(and(eq(productCategories.id, categoryId), eq(productCategories.shopId, user.shopId))).limit(1)
  const category = rows[0]
  if (!category) throw createError({ statusCode: 404, statusMessage: 'ไม่พบประเภทสินค้า' })
  if (category.name === 'อื่น ๆ') throw createError({ statusCode: 400, statusMessage: 'ไม่สามารถลบประเภทสำรอง “อื่น ๆ” ได้' })

  await database.transaction(async (transaction) => {
    const fallback = await transaction.select({ id: productCategories.id }).from(productCategories)
      .where(and(eq(productCategories.shopId, user.shopId), eq(productCategories.name, 'อื่น ๆ'))).limit(1)
    if (!fallback.length) {
      await transaction.insert(productCategories).values({ id: crypto.randomUUID(), shopId: user.shopId, name: 'อื่น ๆ' })
    }
    await transaction.update(products).set({ category: 'อื่น ๆ' })
      .where(and(eq(products.shopId, user.shopId), eq(products.category, category.name)))
    await transaction.delete(productCategories)
      .where(and(eq(productCategories.id, categoryId), eq(productCategories.shopId, user.shopId)))
  })
  return { success: true }
})
