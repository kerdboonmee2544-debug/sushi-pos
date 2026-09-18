import type { RowDataPacket } from 'mysql2'
import { useMySqlPool } from '#server/database/client'

interface OrderRow extends RowDataPacket { id: string, member_id: string|null, total: number, status: string }
interface ItemRow extends RowDataPacket { product_id: string, quantity: number }

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const orderId = getRouterParam(event, 'id')
  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสออเดอร์' })
  const connection = await useMySqlPool().getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.query<OrderRow[]>('SELECT id, member_id, total, status FROM orders WHERE id=? AND shop_id=? FOR UPDATE', [orderId, user.shopId])
    const order = rows[0]
    if (!order) throw createError({ statusCode: 404, statusMessage: 'ไม่พบออเดอร์' })
    if (order.status === 'cancelled') throw createError({ statusCode: 409, statusMessage: 'ออเดอร์ถูกยกเลิกแล้ว' })
    const [items] = await connection.query<ItemRow[]>('SELECT product_id, quantity FROM order_items WHERE order_id=?', [orderId])
    for (const item of items) {
      if (!item.product_id) continue
      await connection.execute('UPDATE products SET stock=stock+? WHERE id=? AND shop_id=?', [item.quantity, item.product_id, user.shopId])
      await connection.execute(`INSERT INTO stock_movements (id,shop_id,product_id,order_id,type,quantity,note,created_by) VALUES (?,?,?,?, 'void',?,'ยกเลิกบิล',?)`, [crypto.randomUUID(), user.shopId, item.product_id, orderId, item.quantity, user.id])
    }
    await connection.execute(`UPDATE orders SET status='cancelled' WHERE id=?`, [orderId])
    await connection.execute(`UPDATE payments SET status='voided' WHERE order_id=?`, [orderId])
    if (order.member_id) await connection.execute('UPDATE members SET total_spent=GREATEST(0,total_spent-?), points=GREATEST(0,points-?) WHERE id=?', [order.total, Math.floor(Number(order.total)/10), order.member_id])
    await connection.commit()
    return { success: true, status: 'cancelled' }
  } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
})
