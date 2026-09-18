import type { H3Event } from 'h3'
import type { StaffRole } from '#shared/types/pos'

export async function requireRole(event: H3Event, allowed: StaffRole[]) {
  const session = await requireUserSession(event)
  if (!allowed.includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์ใช้งานส่วนนี้' })
  }
  return session.user
}
