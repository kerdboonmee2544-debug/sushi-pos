export type StaffRole = 'cashier' | 'kitchen' | 'manager' | 'admin'

export interface ProductDto {
  id: string
  name: string
  category: string
  description: string | null
  price: string
  stock: number
  minimumStock: number
  active: boolean
  tag: string | null
  imageUrl: string | null
}

export interface CartLine {
  productId: string
  name: string
  price: number
  quantity: number
  availableStock: number
}
