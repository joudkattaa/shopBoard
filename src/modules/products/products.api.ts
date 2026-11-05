import { isCategory } from './products.logic.ts'
import { fetchJson } from '../../shared/api/client.ts'
import type { Product } from './products.types.ts'

// Validate untrusted REST data without importing the server-owned catalog.
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}
function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    /^[a-z0-9-]+$/.test(value.id) &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    'category' in value &&
    isCategory(value.category) &&
    value.category !== 'All' &&
    'price' in value &&
    typeof value.price === 'number' &&
    Number.isSafeInteger(value.price) &&
    value.price >= 0 &&
    'image' in value &&
    typeof value.image === 'string' &&
    /^[a-z0-9-]+$/.test(value.image) &&
    'description' in value &&
    typeof value.description === 'string' &&
    value.description.trim().length > 0 &&
    'size' in value &&
    typeof value.size === 'string' &&
    value.size.trim().length > 0
  )
}
function isProductsResponse(value: unknown): value is { items: Product[] } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('items' in value) ||
    !isUnknownArray(value.items) ||
    !value.items.every(isProduct)
  )
    return false
  return new Set(value.items.map((product) => product.id)).size === value.items.length
}
export async function getProducts(
  fetcher: typeof fetch = globalThis.fetch,
  query = '',
): Promise<Product[]> {
  const response = await fetchJson('/products' + query, isProductsResponse, undefined, fetcher)
  return response.items.map((product) => ({ ...product }))
}
