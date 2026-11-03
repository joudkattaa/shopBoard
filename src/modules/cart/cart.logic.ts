import type { Cart, CartTotals } from './cart.types.ts'
import { productById } from '../products/products.logic.ts'

// Revalidate saved cart data so stale or edited browser storage cannot set prices.
export function normalizeCart(value: unknown): Cart {
  if (!isUnknownArray(value)) return []
  const quantities = new Map<string, number>()
  for (const item of value) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('id' in item) ||
      typeof item.id !== 'string' ||
      !productById(item.id) ||
      !('quantity' in item) ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    )
      continue
    quantities.set(item.id, Math.min(99, (quantities.get(item.id) || 0) + item.quantity))
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }))
}

export function cartTotals(cart: unknown, promoCode = ''): CartTotals {
  const validCart = normalizeCart(cart)
  const subtotal = validCart.reduce(
    (sum, item) => sum + (productById(item.id)?.price ?? 0) * item.quantity,
    0,
  )
  const discount = promoCode.trim().toUpperCase() === 'GLOW20' ? Math.round(subtotal * 0.2) : 0
  const merchandise = subtotal - discount
  const shipping = subtotal === 0 || merchandise > 5000 ? 0 : 595
  return {
    count: validCart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discount,
    shipping,
    total: merchandise + shipping,
    merchandise,
  }
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}
