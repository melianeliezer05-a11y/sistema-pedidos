export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface Extra { id: string; name: string; price: number }
export interface Removable { id: string; name: string }

export interface Product {
  id: string
  name: string
  emoji: string
  price: number
  description: string
  active: boolean
  removable: Removable[]
  extras: (Extra & { ingredient: string; qty: number })[]
  availableUnits: number
  recipeDetail?: { id: string; qty: number; name: string; emoji: string }[]
}

export interface Settings { restaurantName: string; clientAlertUnits: number }

export interface OrderLine {
  productId: string
  name: string
  emoji: string
  unitPrice: number
  quantity: number
  removed: string[]
  removedNames?: string[]
  extras: Extra[]
  comments: string
  lineTotal: number
}

export interface Order {
  id: string
  createdAt: string
  updatedAt: string
  customerName: string
  source: 'web' | 'voice'
  items: OrderLine[]
  total: number
  status: OrderStatus
  printedAt: string | null
}

export interface OrderStatusView {
  id: string
  status: OrderStatus
  createdAt: string
  total: number
  items: { name: string; emoji: string; quantity: number }[]
}

export interface Ingredient { id: string; name: string; emoji: string; stock: number; min_stock: number; unit: string }

export interface Movement {
  id: number
  ingredient_id: string
  ingredient_name: string | null
  ingredient_emoji: string | null
  unit: string | null
  delta: number
  reason: string
  order_id: string | null
  created_at: string
}

export interface CartLine {
  lineId: string
  productId: string
  name: string
  emoji: string
  unitPrice: number
  quantity: number
  removed: string[]
  removedNames: string[]
  extras: string[]
  extraNames: string[]
  comments: string
}
