import { products } from './catalog.ts'

// Both Vite servers use the same source catalog; no generated catalog is maintained.
export function productsMiddleware(development = false) {
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (url.pathname !== '/api/products') return next()
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    if (request.method !== 'GET') {
      response.statusCode = 405
      response.setHeader('Allow', 'GET')
      response.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }
    if (development) {
      const delay = Number(url.searchParams.get('delay'))
      if (Number.isFinite(delay) && delay > 0)
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 3000)))
      if (url.searchParams.get('error') === '500') {
        response.statusCode = 500
        response.end(JSON.stringify({ error: 'Development test error' }))
        return
      }
    }
    const items = development && url.searchParams.get('empty') === '1' ? [] : products
    response.end(JSON.stringify({ items, total: items.length }))
  }
}
