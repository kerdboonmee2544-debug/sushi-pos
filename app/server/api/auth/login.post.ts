import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase } from '#server/database/client'
import { staff } from '#server/database/schema'

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(4).max(100)
})

export default defineEventHandler(async (event) => {
  const body = loginSchema.parse(await readBody(event))
  const [user] = await useDatabase()
    .select()
    .from(staff)
    .where(and(eq(staff.username, body.username), eq(staff.active, true)))
    .limit(1)

  if (!user || !await verifyPassword(user.passwordHash, body.password)) {
    throw createError({ statusCode: 401, statusMessage: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
  }

  await setUserSession(event, {
    user: { id: user.id, shopId: user.shopId, name: user.name, role: user.role }
  })
  return { success: true }
})
