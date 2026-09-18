import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm'
import { promotions } from '#server/database/schema'
import { useDatabase } from '#server/database/client'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['cashier', 'manager', 'admin'])
  const now = new Date()

  return useDatabase()
    .select({
      id: promotions.id,
      name: promotions.name,
      type: promotions.type,
      value: promotions.value,
      minSpend: promotions.minSpend,
      startsAt: promotions.startsAt,
      endsAt: promotions.endsAt
    })
    .from(promotions)
    .where(and(
      eq(promotions.shopId, user.shopId),
      eq(promotions.active, true),
      or(isNull(promotions.startsAt), lte(promotions.startsAt, now)),
      or(isNull(promotions.endsAt), gte(promotions.endsAt, now))
    ))
    .orderBy(asc(promotions.name))
})
