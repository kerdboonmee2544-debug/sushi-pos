import type { RowDataPacket } from 'mysql2'
import { z } from 'zod'
import { useMySqlPool } from '#server/database/client'

const setupSchema = z.object({
  setupKey: z.string().min(16),
  shopName: z.string().trim().min(1).max(150).default('ร้านซูชิ 10 บาท'),
  adminName: z.string().trim().min(1).max(150).default('ผู้ดูแลระบบ'),
  username: z.string().trim().min(3).max(100).default('admin'),
  password: z.string().min(8).max(100)
})

const starterProducts = [
  ['ข้าวปั้นหน้าแซลมอนสด', 'แซลมอนสดเนื้อนุ่ม', 10, 40, 'ขายดี'],
  ['ข้าวปั้นหน้าไข่หวานย่าง', 'ไข่หวานญี่ปุ่นย่างหอม', 10, 40, 'แนะนำ'],
  ['ข้าวปั้นหน้ายำสาหร่าย', 'สาหร่ายวากาเมะรสกลมกล่อม', 10, 35, null],
  ['ข้าวปั้นหน้าปูอัดมาโย', 'ปูอัดกับมายองเนส', 10, 50, null],
  ['ข้าวปั้นหน้ากุ้งซูชิ', 'กุ้งต้มเนื้อแน่น', 10, 30, 'แนะนำ'],
  ['ข้าวปั้นหน้าทูน่ามาโย', 'ทูน่าคลุกมายองเนส', 10, 35, 'ขายดี']
] as const

export default defineEventHandler(async (event) => {
  const input = setupSchema.parse(await readBody(event))
  const config = useRuntimeConfig(event)
  if (!config.setupKey || input.setupKey !== config.setupKey) {
    throw createError({ statusCode: 403, statusMessage: 'Setup key ไม่ถูกต้อง' })
  }

  const connection = await useMySqlPool().getConnection()
  try {
    await connection.beginTransaction()
    const [existing] = await connection.query<(RowDataPacket & { count: number })[]>('SELECT COUNT(*) AS count FROM shops FOR UPDATE')
    if (Number(existing[0]?.count) > 0) {
      throw createError({ statusCode: 409, statusMessage: 'ระบบถูกตั้งค่าแล้ว' })
    }

    const shopId = crypto.randomUUID()
    const adminId = crypto.randomUUID()
    const passwordHash = await hashPassword(input.password)
    await connection.execute('INSERT INTO shops (id, name, slogan) VALUES (?, ?, ?)', [shopId, input.shopName, 'ซูชิคำโต อร่อยคุ้มทุกคำ'])
    await connection.execute(
      `INSERT INTO staff (id, shop_id, username, name, password_hash, role, active) VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
      [adminId, shopId, input.username, input.adminName, passwordHash]
    )
    for (const [name, description, price, stock, tag] of starterProducts) {
      await connection.execute(
        'INSERT INTO products (id, shop_id, name, description, price, stock, tag, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [crypto.randomUUID(), shopId, name, description, price, stock, tag]
      )
    }
    await connection.commit()
    return { success: true, shopId, username: input.username }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
})
