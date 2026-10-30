import { normalizeCart, productById } from './logic.js'

// All persistent state lives here; no document/window UI access is allowed.
function browserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function createState(storage = browserStorage()) {
  const cartKey = 'roseveil-shopping-bag-v1'
  const legacyKey = 'lumiere-shopping-bag-v1'
  const themeKey = 'roseveil-theme'
  let cart = []
  let promoCode = ''
  let theme = 'light'
  let profile = null
  try {
    const saved = JSON.parse(storage?.getItem(cartKey) ?? storage?.getItem(legacyKey) ?? '{}')
    cart = normalizeCart(saved.items)
    promoCode = saved.promoCode === 'GLOW20' ? 'GLOW20' : ''
  } catch {
    /* Invalid or unavailable storage leaves an empty bag. */
  }
  try {
    theme = storage?.getItem(themeKey) === 'dark' ? 'dark' : 'light'
  } catch {
    /* Default light. */
  }
  function saveCart() {
    try {
      storage?.setItem(cartKey, JSON.stringify({ items: cart, promoCode }))
    } catch {
      /* In-memory fallback. */
    }
  }
  return {
    get cart() {
      return cart.map((item) => ({ ...item }))
    },
    get promoCode() {
      return promoCode
    },
    get theme() {
      return theme
    },
    get profile() {
      return profile ? { ...profile } : null
    },
    addProduct(id) {
      if (!productById(id)) return false
      const item = cart.find((line) => line.id === id)
      if (item?.quantity === 99) return false
      if (item) item.quantity++
      else cart.push({ id, quantity: 1 })
      saveCart()
      return true
    },
    changeQuantity(id, delta) {
      if (!Number.isInteger(delta)) return
      const item = cart.find((line) => line.id === id)
      if (!item) return
      item.quantity = Math.min(99, item.quantity + delta)
      cart = cart.filter((line) => line.quantity > 0)
      saveCart()
    },
    removeProduct(id) {
      cart = cart.filter((line) => line.id !== id)
      saveCart()
    },
    setPromoCode(value) {
      promoCode = value === 'GLOW20' ? 'GLOW20' : ''
      saveCart()
    },
    clearCart() {
      cart = []
      promoCode = ''
      saveCart()
    },
    setProfile(value) {
      profile = value ? { name: value.name } : null
    },
    setTheme(value) {
      theme = value === 'dark' ? 'dark' : 'light'
      try {
        storage?.setItem(themeKey, theme)
      } catch {
        /* In-memory fallback. */
      }
    },
  }
}
