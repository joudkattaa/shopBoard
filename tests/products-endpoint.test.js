import test from 'node:test'
import assert from 'node:assert/strict'
import { productsMiddleware } from '../server/products-api.js'
import { products } from '../server/catalog.ts'

async function request(url, development = false, method = 'GET') {
  const response = {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v
    },
    end(body) {
      this.body = body
    },
  }
  let forwarded = false
  await productsMiddleware(development)({ url, method }, response, () => {
    forwarded = true
  })
  return { ...response, forwarded }
}
test('GET /api/products returns the exact 30 source records with no transformations', async () => {
  const response = await request('/api/products')
  assert.equal(response.statusCode, 200)
  assert.deepEqual(JSON.parse(response.body), { items: products, total: 30 })
  assert.equal(response.headers['Cache-Control'], 'no-store')
})
test('endpoint routes only its exact path and rejects unsupported methods', async () => {
  assert.equal((await request('/api/unknown')).forwarded, true)
  const response = await request('/api/products', false, 'POST')
  assert.equal(response.statusCode, 405)
  assert.equal(response.headers.Allow, 'GET')
})
test('empty and HTTP 500 simulation are available only in development', async () => {
  assert.deepEqual(JSON.parse((await request('/api/products?empty=1', true)).body), {
    items: [],
    total: 0,
  })
  assert.equal((await request('/api/products?error=500', true)).statusCode, 500)
  const production = await request('/api/products?error=500&empty=1&delay=3000')
  assert.equal(production.statusCode, 200)
  assert.deepEqual(JSON.parse(production.body).items, products)
})
test('development delay is capped at three seconds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let done = false
  const pending = request('/api/products?delay=999999', true).then(() => {
    done = true
  })
  t.mock.timers.tick(2999)
  await Promise.resolve()
  assert.equal(done, false)
  t.mock.timers.tick(1)
  await pending
  assert.equal(done, true)
})
