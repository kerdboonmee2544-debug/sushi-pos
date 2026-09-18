import { randomUUID } from 'node:crypto'
import mysql from 'mysql2/promise'

const menu = [
  ['ดงบุริ', 'ข้าวหน้าหมู', 'ข้าวญี่ปุ่นหน้าหมูนุ่มปรุงซอส', 69],
  ['ดงบุริ', 'ข้าวหน้าเนื้อผัดซอส', 'เนื้อผัดซอสญี่ปุ่นเสิร์ฟบนข้าวร้อน ๆ', 79],
  ['ดงบุริ', 'ข้าวหน้าคัตสึโทจิ', 'หมูทอดตุ๋นไข่ในซอสญี่ปุ่น', 89],
  ['ดงบุริ', 'ข้าวหน้าไก่เทอริยากิ', 'ไก่ย่างซอสเทอริยากิเสิร์ฟพร้อมข้าวญี่ปุ่น', 69],
  ['ดงบุริ', 'ข้าวหน้าสเต๊กหมูซอสญี่ปุ่น', 'สเต๊กหมูนุ่มราดซอสญี่ปุ่น', 89],
  ['ดงบุริ', 'ข้าวหน้าหมูทอดทงคัตสึ', 'หมูทอดกรอบพร้อมซอสทงคัตสึ', 89],
  ['ดงบุริ', 'ข้าวหน้ากุ้งทอด', 'กุ้งทอดกรอบเสิร์ฟบนข้าวญี่ปุ่น', 89],
  ['แกงกะหรี่ญี่ปุ่น', 'แกงกะหรี่หมูทอด', 'ข้าวแกงกะหรี่ญี่ปุ่นพร้อมหมูทอด', 89],
  ['แกงกะหรี่ญี่ปุ่น', 'แกงกะหรี่ไก่คาราเกะ', 'ข้าวแกงกะหรี่ญี่ปุ่นพร้อมไก่คาราเกะ', 89],
  ['แกงกะหรี่ญี่ปุ่น', 'แกงกะหรี่ไข่ข้น', 'ข้าวแกงกะหรี่ญี่ปุ่นพร้อมไข่ข้น', 89],
  ['แกงกะหรี่ญี่ปุ่น', 'แกงกะหรี่ไข่ข้นชีส', 'ข้าวแกงกะหรี่ญี่ปุ่นพร้อมไข่ข้นและชีส', 99],
  ['เส้น', 'ยากิโซบะ', 'เส้นยากิโซบะผัดซอสสไตล์ญี่ปุ่น', 79],
  ['เส้น', 'อุด้งร้อนน้ำใส', 'อุด้งเส้นนุ่มในน้ำซุปใสร้อน ๆ', 79],
  ['เส้น', 'อุด้งแกงกะหรี่', 'อุด้งเส้นนุ่มในซุปแกงกะหรี่ญี่ปุ่น', 89],
  ['ของกินเล่น', 'ไก่ทอดคาราเกะ', 'ไก่หมักทอดกรอบสไตล์ญี่ปุ่น', 69],
  ['ของกินเล่น', 'เกี๊ยวซ่า', 'เกี๊ยวซ่าไส้หมูทอด', 59],
  ['ของกินเล่น', 'ทาโกะยากิ', 'ทาโกะยากิไส้ปลาหมึก', 59],
  ['ของกินเล่น', 'ยำสาหร่าย', 'ยำสาหร่ายญี่ปุ่นปรุงรส', 49],
  ['ของกินเล่น', 'ถั่วแระญี่ปุ่น', 'ถั่วแระญี่ปุ่นต้มพร้อมเกลือ', 49],
  ['ของกินเล่น', 'สลัดงาขาวญี่ปุ่น', 'สลัดผักสดพร้อมน้ำสลัดงาขาว', 59]
]

const pool = mysql.createPool(process.env.NUXT_DATABASE_URL)
const connection = await pool.getConnection()

try {
  await connection.beginTransaction()
  const [shops] = await connection.query('SELECT id FROM shops ORDER BY created_at LIMIT 1')
  if (!shops.length) throw new Error('ไม่พบร้านค้าในฐานข้อมูล')
  const shopId = shops[0].id

  await connection.execute(
    'UPDATE shops SET name=?, slogan=? WHERE id=?',
    ['ญี่ปุ่นตามสั่ง', 'อาหารญี่ปุ่นจานโปรด อร่อยสดใหม่ทุกจาน', shopId]
  )

  await connection.execute('UPDATE products SET active=0 WHERE shop_id=?', [shopId])

  for (const [category, name, description, price] of menu) {
    const [existing] = await connection.execute(
      'SELECT id FROM products WHERE shop_id=? AND name=? LIMIT 1',
      [shopId, name]
    )
    if (existing.length) {
      await connection.execute(
        'UPDATE products SET category=?,description=?,price=?,stock=GREATEST(stock,50),minimum_stock=5,tag=NULL,active=1 WHERE id=?',
        [category, description, price, existing[0].id]
      )
    } else {
      await connection.execute(
        'INSERT INTO products (id,shop_id,name,category,description,price,stock,minimum_stock,tag,image_url,active) VALUES (?,?,?,?,?,?,?,?,NULL,NULL,1)',
        [randomUUID(), shopId, name, category, description, price, 50, 5]
      )
    }
  }

  await connection.commit()
  console.log(`อัปเดตร้านและเมนูสำเร็จ ${menu.length} รายการ`)
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
  await pool.end()
}
