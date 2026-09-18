import { z } from 'zod'
import { staff } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

const schema = z.object({ username: z.string().trim().min(1).max(100), name: z.string().trim().min(1).max(150), password: z.string().min(8).max(100), role: z.enum(['cashier', 'kitchen', 'manager', 'admin']), imageUrl: z.string().trim().max(500).nullable().optional() })

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['admin'])
  const input = schema.parse(await readBody(event))
  const row = { id: crypto.randomUUID(), shopId: user.shopId, username: input.username, name: input.name, passwordHash: await hashPassword(input.password), role: input.role, imageUrl: input.imageUrl, active: true }
  await useDatabase().insert(staff).values(row)
  return { id: row.id, username: row.username, name: row.name, role: row.role, active: row.active }
})
