import type { RowDataPacket } from 'mysql2'
import { z } from 'zod'
import { useMySqlPool } from '#server/database/client'

const querySchema = z.object({ shop: z.uuid() })
interface ProductRow extends RowDataPacket { id: string, name: string, category: string, description: string|null, price: number, stock: number, image_url: string|null, shop_name: string }

export default defineEventHandler(async (event) => {
  const { shop } = querySchema.parse(getQuery(event))
  const [rows] = await useMySqlPool().query<ProductRow[]>(
    `SELECT p.id,p.name,p.category,p.description,p.price,p.stock,p.image_url,s.name shop_name
     FROM products p JOIN shops s ON s.id=p.shop_id
     WHERE p.shop_id=? AND p.active=1 AND p.stock>0 ORDER BY p.category,p.name`, [shop]
  )
  return { shopName: rows[0]?.shop_name ?? 'ร้านอาหาร', products: rows.map(row => ({ id: row.id, name: row.name, category: row.category, description: row.description, price: row.price, stock: row.stock, imageUrl: row.image_url })) }
})
