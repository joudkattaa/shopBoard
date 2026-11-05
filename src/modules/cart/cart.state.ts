import type { Cart } from './cart.types.ts'
import type { Product } from '../products/products.types.ts'
import type { StorageAdapter } from '../state/state.types.ts'
import { normalizeCart } from './cart.logic.ts'
import { productById } from '../products/products.logic.ts'

// Own bag state and persistence; read the current catalog without storing a copy.
export function createCartState(
  storage: StorageAdapter | undefined,
  getCatalog: () => readonly Product[],
) {
  const cartKey = 'roseveil-shopping-bag-v1'
  const legacyKey = 'lumiere-shopping-bag-v1'
  let cart: Cart = []
  let promoCode = ''
  try {
    const saved: unknown = JSON.parse(
      storage?.getItem(cartKey) ?? storage?.getItem(legacyKey) ?? '{}',
    )
    if (typeof saved === 'object' && saved !== null) {
      cart = normalizeCart('items' in saved ? saved.items : undefined)
      promoCode = 'promoCode' in saved && saved.promoCode === 'GLOW20' ? 'GLOW20' : ''
    }
  } catch {
    /* Invalid or unavailable storage leaves an empty bag. */
  }
  function saveCart() {
    try {
      storage?.setItem(cartKey, JSON.stringify({ items: cart, promoCode }))
    } catch {
      /* In-memory fallback. */
    }
  }
  return {
    get items() {
      return cart.map((item) => ({ ...item }))
    },
    get promoCode() {
      return promoCode
    },
    reconcileCatalog() {
      const catalog = getCatalog()
      if (catalog.length) cart = normalizeCart(cart, catalog)
    },
    addProduct(id: string) {
      if (!productById(id, getCatalog())) return false
      const item = cart.find((line) => line.id === id)
      if (item?.quantity === 99) return false
      if (item) item.quantity++
      else cart.push({ id, quantity: 1 })
      saveCart()
      return true
    },
    changeQuantity(id: string, delta: number) {
      if (!Number.isInteger(delta)) return
      const item = cart.find((line) => line.id === id)
      if (!item) return
      item.quantity = Math.min(99, item.quantity + delta)
      cart = cart.filter((line) => line.quantity > 0)
      saveCart()
    },
    removeProduct(id: string) {
      cart = cart.filter((line) => line.id !== id)
      saveCart()
    },
    setPromoCode(value: string) {
      promoCode = value === 'GLOW20' ? 'GLOW20' : ''
      saveCart()
    },
    clearCart() {
      cart = []
      promoCode = ''
      saveCart()
    },
  }
}
