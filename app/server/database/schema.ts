import {
  bigint,
  boolean,
  char,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/mysql-core'

const id = (name?: string) => name ? char(name, { length: 36 }) : char({ length: 36 })
const money = (name?: string) => name
  ? decimal(name, { precision: 12, scale: 2 })
  : decimal({ precision: 12, scale: 2 })

export const shops = mysqlTable('shops', {
  id: id().primaryKey(),
  name: varchar({ length: 150 }).notNull(),
  slogan: varchar({ length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const staff = mysqlTable('staff', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  username: varchar({ length: 100 }).notNull(),
  name: varchar({ length: 150 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum(['cashier', 'kitchen', 'manager', 'admin']).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  active: boolean().default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  uniqueIndex('staff_username_uq').on(table.username)
])

export const products = mysqlTable('products', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  name: varchar({ length: 150 }).notNull(),
  category: varchar({ length: 100 }).default('อื่น ๆ').notNull(),
  description: text(),
  price: money().notNull(),
  stock: int().default(0).notNull(),
  minimumStock: int('minimum_stock').default(0).notNull(),
  tag: varchar({ length: 50 }),
  imageUrl: varchar('image_url', { length: 500 }),
  active: boolean().default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
}, table => [index('products_shop_idx').on(table.shopId)])

export const productCategories = mysqlTable('product_categories', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  name: varchar({ length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  uniqueIndex('product_categories_shop_name_uq').on(table.shopId, table.name)
])

export const members = mysqlTable('members', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  phone: varchar({ length: 20 }).notNull(),
  name: varchar({ length: 150 }).notNull(),
  tier: mysqlEnum(['Silver', 'Gold', 'Platinum']).default('Silver').notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0').notNull(),
  totalSpent: money('total_spent').default('0').notNull(),
  points: int().default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [uniqueIndex('members_shop_phone_uq').on(table.shopId, table.phone)])

export const promotions = mysqlTable('promotions', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  name: varchar({ length: 150 }).notNull(),
  type: mysqlEnum(['percent', 'fixed']).notNull(),
  value: money().notNull(),
  minSpend: money('min_spend').default('0').notNull(),
  active: boolean().default(true).notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at')
}, table => [index('promotions_shop_active_idx').on(table.shopId, table.active)])

export const orders = mysqlTable('orders', {
  id: id().primaryKey(),
  orderNumber: varchar('order_number', { length: 40 }).notNull(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  memberId: id('member_id').references(() => members.id),
  customerReference: varchar('customer_reference', { length: 100 }),
  subtotal: money().notNull(),
  promotionDiscount: money('promotion_discount').default('0').notNull(),
  memberDiscount: money('member_discount').default('0').notNull(),
  total: money().notNull(),
  status: mysqlEnum(['pending', 'preparing', 'completed', 'cancelled']).default('pending').notNull(),
  createdBy: id('created_by').references(() => staff.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  uniqueIndex('orders_number_uq').on(table.orderNumber),
  index('orders_shop_created_idx').on(table.shopId, table.createdAt)
])

export const orderItems = mysqlTable('order_items', {
  id: id().primaryKey(),
  orderId: id('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: id('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 150 }).notNull(),
  unitPrice: money('unit_price').notNull(),
  quantity: int().notNull(),
  lineTotal: money('line_total').notNull()
}, table => [index('order_items_order_idx').on(table.orderId)])

export const payments = mysqlTable('payments', {
  id: id().primaryKey(),
  orderId: id('order_id').notNull().references(() => orders.id),
  method: mysqlEnum(['cash', 'promptpay', 'card', 'other']).notNull(),
  amount: money().notNull(),
  receivedAmount: money('received_amount'),
  changeAmount: money('change_amount').default('0').notNull(),
  status: mysqlEnum(['pending', 'paid', 'refunded', 'voided']).default('paid').notNull(),
  receivedBy: id('received_by').references(() => staff.id),
  paidAt: timestamp('paid_at').defaultNow().notNull()
}, table => [index('payments_order_idx').on(table.orderId)])

export const stockMovements = mysqlTable('stock_movements', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  productId: id('product_id').notNull().references(() => products.id),
  orderId: id('order_id').references(() => orders.id),
  type: mysqlEnum(['sale', 'receive', 'adjustment', 'void', 'waste']).notNull(),
  quantity: int().notNull(),
  note: varchar({ length: 255 }),
  createdBy: id('created_by').references(() => staff.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [index('stock_movements_product_idx').on(table.productId, table.createdAt)])

export const ingredients = mysqlTable('ingredients', {
  id: id().primaryKey(),
  shopId: id('shop_id').notNull().references(() => shops.id),
  name: varchar({ length: 150 }).notNull(),
  unit: varchar({ length: 30 }).notNull(),
  quantity: decimal({ precision: 12, scale: 3 }).default('0').notNull(),
  minimumQuantity: decimal('minimum_quantity', { precision: 12, scale: 3 }).default('0').notNull(),
  currentPrice: money('current_price').default('0').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
}, table => [index('ingredients_shop_idx').on(table.shopId)])

export const ingredientMovements = mysqlTable('ingredient_movements', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  ingredientId: id('ingredient_id').notNull().references(() => ingredients.id),
  quantity: decimal({ precision: 12, scale: 3 }).notNull(),
  type: mysqlEnum(['receive', 'use', 'adjustment', 'waste']).notNull(),
  note: varchar({ length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
