import mysql from 'mysql2/promise'

const pool = mysql.createPool(process.env.NUXT_DATABASE_URL)
const connection = await pool.getConnection()

try {
  await connection.beginTransaction()
  const [shops] = await connection.query('SELECT id FROM shops ORDER BY created_at LIMIT 1')
  if (!shops.length) throw new Error('ไม่พบร้านค้าในฐานข้อมูล')
  const shopId = shops[0].id

  await connection.execute(
    "UPDATE products SET category='ข้าวปั้น', stock=GREATEST(stock,50), minimum_stock=5, active=1 WHERE shop_id=? AND name LIKE 'ข้าวปั้น%'",
    [shopId]
  )
  await connection.execute(
    "UPDATE products SET category='ซูชิ', stock=GREATEST(stock,50), minimum_stock=5, active=1 WHERE shop_id=? AND name LIKE 'ข้าวซูชิ%'",
    [shopId]
  )

  await connection.commit()
  console.log('เพิ่มหมวดข้าวปั้นและซูชิสำเร็จ')
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
  await pool.end()
}
