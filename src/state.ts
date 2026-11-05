import type { Theme, Profile, StorageAdapter } from './modules/state/state.types.ts'

import { createCartState } from './modules/cart/cart.state.ts'
import { getProducts } from './modules/products/products.api.ts'
import type { Product } from './modules/products/products.types.ts'
import { ApiError } from './shared/api/client.ts'

// Coordinate catalog, bag, theme and profile; no DOM access is allowed.
function browserStorage(): StorageAdapter | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function createState(storage: StorageAdapter | undefined = browserStorage()) {
  const themeKey = 'roseveil-theme'
  let theme: Theme = 'light'
  let profile: Profile | null = null
  let catalogProducts: Product[] = []
  let catalogProductsStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle'
  let catalogProductsError: ApiError | null = null
  const catalogProductListeners = new Set<() => void>()
  const notifyCatalogProducts = () => catalogProductListeners.forEach((listener) => listener())
  const bag = createCartState(storage, () => catalogProducts)
  try {
    theme = storage?.getItem(themeKey) === 'dark' ? 'dark' : 'light'
  } catch {
    /* Default light. */
  }
  return {
    bag,
    subscribeCatalogProducts(listener: () => void) {
      catalogProductListeners.add(listener)
      return () => catalogProductListeners.delete(listener)
    },
    get catalogProducts() {
      return catalogProducts.map((product) => ({ ...product }))
    },
    get catalogProductsStatus() {
      return catalogProductsStatus
    },
    get catalogProductsError() {
      return catalogProductsError
    },
    async loadCatalogProducts(fetcher: typeof fetch = globalThis.fetch, query = '') {
      if (catalogProductsStatus === 'loading') return
      catalogProductsStatus = 'loading'
      catalogProductsError = null
      notifyCatalogProducts()
      try {
        catalogProducts = await getProducts(fetcher, query)
        bag.reconcileCatalog()
        catalogProductsStatus = 'ready'
      } catch (cause) {
        catalogProductsError =
          cause instanceof ApiError
            ? cause
            : new ApiError('The ROSEVEIL catalog could not be loaded.', 0, { cause })
        catalogProductsStatus = 'error'
      }
      notifyCatalogProducts()
    },
    get theme() {
      return theme
    },
    get profile() {
      return profile ? { ...profile } : null
    },
    setProfile(value: Profile | null) {
      profile = value ? { name: value.name } : null
    },
    setTheme(value: string) {
      theme = value === 'dark' ? 'dark' : 'light'
      try {
        storage?.setItem(themeKey, theme)
      } catch {
        /* In-memory fallback. */
      }
    },
  }
}
