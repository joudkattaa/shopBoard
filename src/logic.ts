// Public entry point for the pure logic layer.
export {
  productById,
  productCategories,
  findProducts,
  isCategory,
  isSortOrder,
} from './modules/products/products.logic.ts'
export type { SortOrder } from './modules/products/products.types.ts'
export { normalizeCart, cartTotals } from './modules/cart/cart.logic.ts'

export const formatMoney = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
