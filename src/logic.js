import { products } from './data.js'

const bestsellerIds = new Set([
  'serum',
  'cream',
  'cleanser',
  'toner',
  'perfume',
  'body-cream',
  'body-lotion',
  'body-mist',
  'body-wash',
  'shampoo',
  'conditioner',
])

export const formatMoney = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
export const productById = (id) => products.find((product) => product.id === id)

// Revalidate saved cart data so stale or edited browser storage cannot set prices.
export function normalizeCart(value) {
  if (!Array.isArray(value)) return []
  const quantities = new Map()
  for (const item of value) {
    if (!item || !productById(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1)
      continue
    quantities.set(item.id, Math.min(99, (quantities.get(item.id) || 0) + item.quantity))
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }))
}

export function cartTotals(cart, promoCode = '') {
  const validCart = normalizeCart(cart)
  const subtotal = validCart.reduce(
    (sum, item) => sum + productById(item.id).price * item.quantity,
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

export const productCategories = [...new Set(products.map((product) => product.category))]

export function findProducts(
  category = 'All',
  query = '',
  bestsellersOnly = false,
  sort = 'default',
) {
  const term = query.trim().toLocaleLowerCase('en-US')
  const filteredProducts = products.filter(
    (product) =>
      (!bestsellersOnly || bestsellerIds.has(product.id)) &&
      (category === 'All' || product.category === category) &&
      product.name.toLocaleLowerCase('en-US').includes(term),
  )
  const compare =
    sort === 'price-asc'
      ? (a, b) => a.price - b.price
      : sort === 'price-desc'
        ? (a, b) => b.price - a.price
        : () => 0
  return [...filteredProducts].sort(compare)
}
