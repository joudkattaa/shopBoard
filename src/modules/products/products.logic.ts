import type { Product, Category, SortOrder } from './products.types.ts'
import { products } from '../../data.ts'

const featuredIds = new Set(['body-cream', 'shampoo', 'serum', 'perfume', 'makeup'])

export const productById = (id: string | undefined): Product | undefined =>
  products.find((product) => product.id === id)

export const productCategories = [...new Set(products.map((product) => product.category))]

export function findProducts(
  category: Category | 'All' = 'All',
  query = '',
  featuredOnly = false,
  sort: SortOrder = 'default',
) {
  const term = query.trim().toLocaleLowerCase('en-US')
  const filteredProducts = products.filter(
    (product) =>
      (!featuredOnly || featuredIds.has(product.id)) &&
      (category === 'All' || product.category === category) &&
      product.name.toLocaleLowerCase('en-US').includes(term),
  )
  const compare =
    sort === 'price-asc'
      ? (a: Product, b: Product) => a.price - b.price
      : sort === 'price-desc'
        ? (a: Product, b: Product) => b.price - a.price
        : () => 0
  return [...filteredProducts].sort(compare)
}

export function isCategory(value: unknown): value is Category | 'All' {
  return value === 'All' || productCategories.some((category) => category === value)
}
export function isSortOrder(value: unknown): value is SortOrder {
  return value === 'default' || value === 'price-asc' || value === 'price-desc'
}
