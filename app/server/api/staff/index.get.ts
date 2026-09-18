import { asc, eq } from 'drizzle-orm'
import { staff } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['admin'])
  return useDatabase().select({ id: staff.id, username: staff.username, name: staff.name, role: staff.role, imageUrl: staff.imageUrl, active: staff.active, createdAt: staff.createdAt }).from(staff).where(eq(staff.shopId, user.shopId)).orderBy(asc(staff.name))
})
