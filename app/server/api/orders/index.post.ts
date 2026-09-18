import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { z } from 'zod'
import { useMySqlPool } from '#server/database/client'

const orderSchema = z.object({
  memberId: z.uuid().nullable().optional(),
  promotionId: z.uuid().nullable().optional(),
  paymentMethod: z.enum(['cash', 'promptpay', 'card', 'other']),
  receivedAmount: z.number().nonnegative().optional(),
  items: z.array(z.object({
    productId: z.uuid(),
    quantity: z.number().int().positive().max(999)
  })).min(1).max(100)
})

interface LockedProduct extends RowDataPacket {
  id: string
  name: string
  price: number
  stock: number
}

interface MemberRow extends RowDataPacket {
  id: string
  discount_percent: number
}

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'manager', 'admin'])
  const input = orderSchema.parse(await readBody(event))
  const quantities = new Map<string, number>()
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  }
  const productIds = [...quantities.keys()].sort()
  const pool = useMySqlPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const placeholders = productIds.map(() => '?').join(',')
    const [locked] = await connection.query<LockedProduct[]>(
      `SELECT id, name, price, stock FROM products WHERE shop_id = ? AND active = 1 AND id IN (${placeholders}) ORDER BY id FOR UPDATE`,
      [user.shopId, ...productIds]
    )
    if (locked.length !== productIds.length) throw createError({ statusCode: 400, statusMessage: 'มีสินค้าที่ไม่พบหรือปิดขายแล้ว' })

    let subtotal = 0
    for (const product of locked) {
      const quantity = quantities.get(product.id)!
      if (product.stock < quantity) throw createError({ statusCode: 409, statusMessage: `${product.name} เหลือเพียง ${product.stock} ชิ้น` })
      subtotal += Number(product.price) * quantity
    }

    let promo: RowDataPacket | undefined
    if (input.promotionId) {
      const [promoRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, type, value FROM promotions WHERE id = ? AND shop_id = ? AND active = 1 AND min_spend <= ? AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()) LIMIT 1`,
        [input.promotionId, user.shopId, subtotal]
      )
      promo = promoRows[0]
      if (!promo) throw createError({ statusCode: 400, statusMessage: 'โปรโมชั่นที่เลือกใช้ไม่ได้หรือยอดซื้อยังไม่ถึงขั้นต่ำ' })
    }
    const promotionDiscount = promo ? Math.min(subtotal, promo.type === 'percent' ? Math.round(subtotal * Number(promo.value) / 100) : Number(promo.value)) : 0

    let memberDiscount = 0
    let member: MemberRow | undefined
    if (input.memberId) {
      const [memberRows] = await connection.query<MemberRow[]>(
        'SELECT id, discount_percent FROM members WHERE id = ? AND shop_id = ? FOR UPDATE',
        [input.memberId, user.shopId]
      )
      member = memberRows[0]
      if (!member) throw createError({ statusCode: 400, statusMessage: 'ไม่พบสมาชิก' })
      memberDiscount = Math.round((subtotal - promotionDiscount) * Number(member.discount_percent) / 100)
    }

    const total = Math.max(0, subtotal - promotionDiscount - memberDiscount)
    const received = input.paymentMethod === 'cash' ? (input.receivedAmount ?? 0) : total
    if (received < total) throw createError({ statusCode: 400, statusMessage: 'จำนวนเงินที่รับไม่เพียงพอ' })

    const orderId = crypto.randomUUID()
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
    await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (id, order_number, shop_id, member_id, customer_reference, subtotal, promotion_discount, member_discount, total, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [orderId, orderNumber, user.shopId, member?.id ?? null, null, subtotal, promotionDiscount, memberDiscount, total, user.id]
    )

    for (const product of locked) {
      const quantity = quantities.get(product.id)!
      await connection.execute(
        'INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), orderId, product.id, product.name, product.price, quantity, Number(product.price) * quantity]
      )
      await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product.id])
      await connection.execute(
        `INSERT INTO stock_movements (id, shop_id, product_id, order_id, type, quantity, created_by) VALUES (?, ?, ?, ?, 'sale', ?, ?)`,
        [crypto.randomUUID(), user.shopId, product.id, orderId, -quantity, user.id]
      )
    }

    await connection.execute(
      `INSERT INTO payments (id, order_id, method, amount, received_amount, change_amount, status, received_by) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?)`,
      [crypto.randomUUID(), orderId, input.paymentMethod, total, received, received - total, user.id]
    )
    if (member) {
      await connection.execute('UPDATE members SET total_spent = total_spent + ?, points = points + ? WHERE id = ?', [total, Math.floor(total / 10), member.id])
    }
    await connection.commit()
    return { id: orderId, orderNumber, subtotal, promotionName: promo?.name ?? null, promotionDiscount, memberDiscount, total, change: received - total }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
})
