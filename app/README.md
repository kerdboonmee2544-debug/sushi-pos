# Sushi POS — Nuxt 4 + MySQL

Nuxt ทำหน้าที่ทั้ง frontend และ backend ข้อมูลหลักทั้งหมดอยู่ใน MySQL เว็บ HTML รุ่นเดิมยังอยู่ที่ `../sushi-pos/index.html` สำหรับอ้างอิงระหว่างย้ายฟีเจอร์

## เริ่มต้นใช้งาน

1. เครื่องนี้มี `.env` สำหรับ local development แล้ว ก่อนขึ้น production ต้องเปลี่ยนรหัสผ่านและ secret ทุกค่า
2. MySQL local ใช้ฐานข้อมูล `sushi_pos` และเก็บ data directory ไว้ใน `.mysql/data` (ไม่ถูกนำเข้า Git)
3. รัน migration และเปิด development server:

```powershell
npm run db:migrate
npm run dev
```

4. สำหรับฐานข้อมูลใหม่ ให้ตั้งค่าร้านและบัญชี admin ครั้งแรก:

```powershell
$body = @{
  setupKey = 'ค่าเดียวกับ NUXT_SETUP_KEY'
  shopName = 'ร้านซูชิ 10 บาท'
  adminName = 'ผู้ดูแลระบบ'
  username = 'admin'
  password = 'รหัสผ่านอย่างน้อย 8 ตัว'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/api/setup -ContentType 'application/json' -Body $body
```

`/api/setup` ทำงานได้เพียงครั้งเดียว เมื่อมีร้านแล้วจะตอบ HTTP 409 ฐาน local ในเครื่องนี้ตั้งค่าแล้ว เข้าระบบที่ `http://127.0.0.1:3000/login` ด้วย `admin` / `admin1234` และควรเปลี่ยนรหัสก่อนใช้งานจริง

## คำสั่งสำคัญ

```powershell
npm run dev
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
npm run db:studio
```

## สิ่งที่พร้อมแล้ว

- Schema ร้าน พนักงาน สินค้า สมาชิก โปรโมชัน บิล การชำระ สต็อก และวัตถุดิบ
- ตั้งค่าร้านและ admin ครั้งแรก
- ล็อกอินด้วย password hash และ sealed cookie session
- หน้าขาย ตะกร้า และรับชำระเงิน
- หน้าครัวและเปลี่ยนสถานะออเดอร์
- จัดการสินค้าและเปิด/ปิดการขาย
- สมัครสมาชิกและใช้ส่วนลดสมาชิกตอนขาย
- วัตถุดิบและประวัติการปรับสต็อก
- สร้างและเปิด/ปิดโปรโมชัน
- รายงานยอดรายวัน รายเดือน ยอดสะสม และสินค้าขายดี
- ออกบิล ตัดสต็อก บันทึก stock movement และเพิ่มแต้มใน transaction เดียว
- ตรวจราคา ส่วนลด และสต็อกจากฐานข้อมูลฝั่ง server

ส่วนที่ยังต่อยอดได้คือหน้าจัดการบัญชีพนักงาน การยกเลิก/คืนเงิน อัปโหลดรูป และสูตรตัดวัตถุดิบตามเมนู
