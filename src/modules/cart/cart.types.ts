export interface CartItem {
  id: string
  quantity: number
}
export type Cart = CartItem[]
export interface CartTotals {
  count: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  merchandise: number
}
