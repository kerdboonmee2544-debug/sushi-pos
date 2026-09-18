import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { staff } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ username: z.string().trim().min(1).max(100).optional(), name: z.string().trim().min(1).max(150).optional(), role: z.enum(['cashier', 'kitchen', 'manager', 'admin']).optional(), imageUrl: z.string().trim().max(500).nullable().optional(), active: z.boolean().optional(), password: z.string().min(8).max(100).optional() })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['admin'])
  const staffId = getRouterParam(event, 'id')
  if (!staffId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสพนักงาน' })
  const input = schema.parse(await readBody(event))
  if (staffId === user.id && input.active === false) throw createError({ statusCode: 400, statusMessage: 'ปิดบัญชีของตัวเองไม่ได้' })
  const { password, ...values } = input
  const result = await useDatabase().update(staff).set({ ...values, passwordHash: password ? await hashPassword(password) : undefined }).where(and(eq(staff.id, staffId), eq(staff.shopId, user.shopId)))
  if (!result[0].affectedRows) throw createError({ statusCode: 404, statusMessage: 'ไม่พบพนักงาน' })
  return { success: true }
})
