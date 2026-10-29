export const products = [
  { id: 'serum', name: 'Radiance Facial Serum', category: 'Skin Care', price: 3499, size: '30 ml', image: 'serum', description: 'A little luminosity for your daily ritual. A delicate serum concept in a beautiful rose gold dropper bottle.' },
  { id: 'cream', name: 'Hydrating Day Cream', category: 'Skin Care', price: 2999, size: '50 ml', image: 'cream', description: 'An everyday cream concept with a soft, comforting texture. A quiet moment of care, morning or evening.' },
  { id: 'cleanser', name: 'Gentle Face Wash', category: 'Skin Care', price: 1999, size: '150 ml', image: 'cleanser', description: 'A fresh beginning for your beauty ritual. An elegantly simple facial cleanser concept in a rose gold pump bottle.' },
  { id: 'toner', name: 'Hydrating Toner', category: 'Skin Care', price: 2299, size: '150 ml', image: 'toner', description: 'A refreshing finishing touch for your everyday routine. A lightweight toner concept with a clean, minimal presentation.' },
  { id: 'perfume', name: 'Rose Bloom Perfume', category: 'Fragrance', price: 4999, size: '50 ml', image: 'perfume', description: 'A fragrance concept inspired by a garden at first light. Soft rose, a warm impression, and a little everyday romance.' },
  { id: 'makeup', name: 'The Everyday Makeup Edit', category: 'Makeup', price: 3899, size: 'Palette, lipstick & brush set', image: 'makeup', description: 'Warm neutrals, soft rose, and a hint of champagne. A coordinated makeup set concept for your own expression of beauty.' },
  { id: 'hair', name: 'Botanical Hair Ritual', category: 'Hair Care', price: 4299, size: 'Shampoo, conditioner & hair oil set', image: 'hair', description: 'A botanical-inspired hair care collection in warm amber bottles. A matching set concept to make your everyday ritual feel special.' },
  { id: 'masks', name: 'Botanical Mask Duo', category: 'Face Masks', price: 1499, size: '2 sheet masks', image: 'masks', description: 'Pause, unwind, and enjoy a moment to yourself. Two beautifully presented mask concepts inspired by delicate botanicals.' },
  { id: 'gifts', name: 'The Lumière Gift Collection', category: 'Gift Sets', price: 7499, size: 'Serum, cream & cleanser gift set', image: 'gifts', description: 'A considered collection of little luxuries, nestled in a blush pink gift box. A skincare gift concept for someone special.' },
]

export const formatMoney = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
export const productById = id => products.find(product => product.id === id)

// Revalidate saved cart data so stale or edited browser storage cannot set prices.
export function normalizeCart(value) {
  if (!Array.isArray(value)) return []
  const quantities = new Map()
  for (const item of value) {
    if (!item || !productById(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1) continue
    quantities.set(item.id, Math.min(99, (quantities.get(item.id) || 0) + item.quantity))
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }))
}

export function cartTotals(cart, promoCode = '') {
  const validCart = normalizeCart(cart)
  const subtotal = validCart.reduce((sum, item) => sum + productById(item.id).price * item.quantity, 0)
  const discount = promoCode.trim().toUpperCase() === 'GLOW20' ? Math.round(subtotal * 0.2) : 0
  const merchandise = subtotal - discount
  const shipping = subtotal === 0 || merchandise > 5000 ? 0 : 595
  return { count: validCart.reduce((sum, item) => sum + item.quantity, 0), subtotal, discount, shipping, total: merchandise + shipping, merchandise }
}

export function findProducts(category = 'All', query = '', bestsellersOnly = false) {
  const term = query.trim().toLocaleLowerCase('en-US')
  const compactTerm = term.replaceAll(' ', '')
  return products.filter((product, index) =>
    (!bestsellersOnly || index < 5) &&
    (category === 'All' || product.category === category) &&
    (`${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('en-US').includes(term) ||
      product.category.toLocaleLowerCase('en-US').replaceAll(' ', '').includes(compactTerm)),
  )
}
