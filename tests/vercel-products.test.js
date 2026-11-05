import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import handler from '../api/products.ts'
import { products } from '../server/catalog.ts'

test('Vercel endpoint returns the exact source catalog as uncached JSON', async () => {
  const response = handler.fetch(new Request('https://roseveil.example/api/products'))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { items: products, total: 30 })
})

test('Vercel endpoint ignores every development simulation flag', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  // The synchronous response must be available without advancing any timers.
  const response = handler.fetch(
    new Request('https://roseveil.example/api/products?error=500&empty=1&delay=3000'),
  )
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { items: products, total: 30 })
})

test('Vercel endpoint rejects non-GET methods without returning products', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
    const response = handler.fetch(new Request('https://roseveil.example/api/products', { method }))
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('allow'), 'GET')
    assert.deepEqual(await response.json(), { error: 'Method not allowed' })
  }
})

test('Vercel uses file-based API routing without SPA rewrites or redirects', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.equal(config.framework, 'vite')
  for (const key of ['rewrites', 'redirects', 'routes', 'builds']) {
    assert.equal(config[key], undefined, `${key} must not intercept /api/products`)
  }
})
