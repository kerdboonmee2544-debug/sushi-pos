import type { StaffRole } from './pos'

declare module '#auth-utils' {
  interface User {
    id: string
    shopId: string
    name: string
    role: StaffRole
  }
}

export {}
