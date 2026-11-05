import { products } from '../server/catalog.ts'

// Vercel's Web Standard handler; development simulations stay in Vite middleware.
export default {
  fetch(request: Request): Response {
    const headers = { 'Cache-Control': 'no-store' }
    if (request.method !== 'GET') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405, headers: { ...headers, Allow: 'GET' } },
      )
    }
    return Response.json({ items: products, total: products.length }, { headers })
  },
}
