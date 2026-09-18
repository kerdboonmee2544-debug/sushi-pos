import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { z } from 'zod'
import { useMySqlPool } from '#server/database/client'

const schema = z.object({
  shopId: z.uuid(),
  tableNumber: z.number().int().min(1).max(999),
  items: z.array(z.object({ productId: z.uuid(), quantity: z.number().int().positive().max(30) })).min(1).max(50)
})
interface ProductRow extends RowDataPacket { id: string, name: string, price: number, stock: number }

export default defineEventHandler(async (event) => {
  const input = schema.parse(await readBody(event))
  const quantities = new Map<string, number>()
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  const ids = [...quantities.keys()].sort()
  const connection = await useMySqlPool().getConnection()
  try {
    await connection.beginTransaction()
    const placeholders = ids.map(() => '?').join(',')
    const [products] = await connection.query<ProductRow[]>(`SELECT id,name,price,stock FROM products WHERE shop_id=? AND active=1 AND id IN (${placeholders}) ORDER BY id FOR UPDATE`, [input.shopId, ...ids])
    if (products.length !== ids.length) throw createError({ statusCode: 400, statusMessage: 'มีเมนูที่ปิดขายหรือไม่พบแล้ว' })
    let total = 0
    for (const product of products) {
      const quantity = quantities.get(product.id)!
      if (product.stock < quantity) throw createError({ statusCode: 409, statusMessage: `${product.name} เหลือเพียง ${product.stock} ชิ้น` })
      total += Number(product.price) * quantity
    }
    const orderId = crypto.randomUUID()
    const orderNumber = `T${input.tableNumber}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
    await connection.execute<ResultSetHeader>(`INSERT INTO orders (id,order_number,shop_id,customer_reference,subtotal,promotion_discount,member_discount,total,status,created_by) VALUES (?,?,?, ?,?,0,0,?,'pending',NULL)`, [orderId, orderNumber, input.shopId, `โต๊ะ ${input.tableNumber}`, total, total])
    for (const product of products) {
      const quantity = quantities.get(product.id)!
      await connection.execute('INSERT INTO order_items (id,order_id,product_id,product_name,unit_price,quantity,line_total) VALUES (?,?,?,?,?,?,?)', [crypto.randomUUID(), orderId, product.id, product.name, product.price, quantity, Number(product.price) * quantity])
      await connection.execute('UPDATE products SET stock=stock-? WHERE id=?', [quantity, product.id])
      await connection.execute(`INSERT INTO stock_movements (id,shop_id,product_id,order_id,type,quantity,created_by) VALUES (?,?,?,?,'sale',?,NULL)`, [crypto.randomUUID(), input.shopId, product.id, orderId, -quantity])
    }
    await connection.commit()
    return { orderNumber, total, tableNumber: input.tableNumber }
  } catch (error) { await connection.rollback(); throw error }
  finally { connection.release() }
})
