import type { RowDataPacket } from 'mysql2'
import { z } from 'zod'
import { useMySqlPool } from '#server/database/client'

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'admin'])
  const { start, end } = querySchema.parse(getQuery(event))
  if (start > end) throw createError({ statusCode: 400, statusMessage: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' })
  const pool = useMySqlPool()

  const [shopRows] = await pool.query<RowDataPacket[]>('SELECT name, slogan FROM shops WHERE id = ? LIMIT 1', [user.shopId])
  const [totals] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS bills,
      COALESCE(SUM(total),0) AS sales,
      COALESCE(SUM(subtotal),0) AS subtotal,
      COALESCE(SUM(promotion_discount + member_discount),0) AS discounts,
      COALESCE(AVG(total),0) AS averageBill
     FROM orders
     WHERE shop_id=? AND status <> 'cancelled' AND DATE(created_at) BETWEEN ? AND ?`,
    [user.shopId, start, end]
  )
  const [orderRows] = await pool.query<RowDataPacket[]>(
    `SELECT o.order_number AS orderNumber, o.created_at AS createdAt,
      COALESCE(s.name,'-') AS staffName, COALESCE(m.name,'ลูกค้าทั่วไป') AS memberName,
      COALESCE(SUM(oi.quantity),0) AS itemQuantity,
      o.subtotal, (o.promotion_discount + o.member_discount) AS discount, o.total,
      COALESCE(p.method,'other') AS paymentMethod
     FROM orders o
     LEFT JOIN staff s ON s.id=o.created_by
     LEFT JOIN members m ON m.id=o.member_id
     LEFT JOIN order_items oi ON oi.order_id=o.id
     LEFT JOIN payments p ON p.order_id=o.id
     WHERE o.shop_id=? AND o.status <> 'cancelled' AND DATE(o.created_at) BETWEEN ? AND ?
     GROUP BY o.id,o.order_number,o.created_at,s.name,m.name,o.subtotal,o.promotion_discount,o.member_discount,o.total,p.method
     ORDER BY o.created_at ASC`,
    [user.shopId, start, end]
  )
  const [topProducts] = await pool.query<RowDataPacket[]>(
    `SELECT oi.product_name AS name, SUM(oi.quantity) AS quantity, SUM(oi.line_total) AS sales
     FROM order_items oi JOIN orders o ON o.id=oi.order_id
     WHERE o.shop_id=? AND o.status <> 'cancelled' AND DATE(o.created_at) BETWEEN ? AND ?
     GROUP BY oi.product_name ORDER BY quantity DESC LIMIT 10`,
    [user.shopId, start, end]
  )
  const [payments] = await pool.query<RowDataPacket[]>(
    `SELECT p.method, COUNT(*) AS bills, COALESCE(SUM(p.amount),0) AS amount
     FROM payments p JOIN orders o ON o.id=p.order_id
     WHERE o.shop_id=? AND o.status <> 'cancelled' AND p.status='paid' AND DATE(o.created_at) BETWEEN ? AND ?
     GROUP BY p.method ORDER BY amount DESC`,
    [user.shopId, start, end]
  )

  return { shop: shopRows[0], range: { start, end }, totals: totals[0], orders: orderRows, topProducts, payments }
})
