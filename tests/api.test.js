import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, BASE_URL, fetchJson } from '../src/shared/api/client.ts'
import { getProducts } from '../src/modules/products/products.api.ts'
import { createState } from '../src/state.ts'
import { products } from '../server/catalog.ts'
import { cartTotals } from '../src/modules/cart/cart.logic.ts'
import { findProducts } from '../src/modules/products/products.logic.ts'

const item = products[0]
const jsonFetcher = (value) => async () => Response.json(value)

test('local API returns exact catalog records and cents without inventing products', async () => {
  const result = await getProducts(async (url) => {
    assert.equal(url, BASE_URL + '/products')
    return Response.json({ items: products, total: 30 })
  })
  assert.deepEqual(result, products)
  assert.equal(result.length, 30)
  assert.deepEqual(await getProducts(jsonFetcher({ items: [] })), [])
})

test('API rejects malformed envelopes and products before exposing a partial catalog', async () => {
  const invalidItems = [
    null,
    12,
    { ...item, id: 1 },
    { ...item, id: 1.5 },
    { ...item, name: ' ' },
    { ...item, category: null },
    { ...item, price: -1 },
    { ...item, price: 8.5 },
    { ...item, image: '../missing-image' },
    { id: 1 },
  ]
  const invalidResponses = [null, [], { items: null }, { products: [item] }]
  for (const value of [
    ...invalidResponses,
    ...invalidItems.map((bad) => ({ items: [item, bad] })),
    { items: [item, item] },
  ]) {
    await assert.rejects(getProducts(jsonFetcher(value)), (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 200)
      return true
    })
  }
})

test('HTTP, unreadable JSON and network failures retain meaningful API error information', async () => {
  const networkError = new TypeError('Failed to fetch')
  for (const [fetcher, status, cause] of [
    [async () => new Response('unavailable', { status: 503 }), 503],
    [async () => new Response('{invalid', { status: 200 }), 200],
    [
      async () => {
        throw networkError
      },
      0,
      networkError,
    ],
  ]) {
    await assert.rejects(getProducts(fetcher), (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, status)
      if (cause) assert.equal(error.cause, cause)
      return true
    })
  }
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    fetchJson(
      '/products',
      () => true,
      { signal: controller.signal },
      async (_url, options) => {
        assert.equal(options.signal, controller.signal)
        throw options.signal.reason
      },
    ),
    (error) => error instanceof ApiError && error.status === 0,
  )
})

test('startup API state is defensive and never replaces cosmetics or changes cart totals', async () => {
  const state = createState({ getItem: () => null, setItem() {} })
  await state.loadCatalogProducts(jsonFetcher({ items: products }))
  state.bag.addProduct('serum')
  state.bag.setPromoCode('GLOW20')
  state.setTheme('dark')
  const before = {
    catalog: JSON.stringify(products),
    matches: findProducts('All', '', false, 'default', products),
    totals: cartTotals(state.bag.items, state.bag.promoCode, products),
  }
  let resolveResponse
  const pending = new Promise((resolve) => {
    resolveResponse = resolve
  })
  const loading = state.loadCatalogProducts(() => pending)
  assert.equal(state.catalogProductsStatus, 'loading')
  resolveResponse(Response.json({ items: products }))
  await loading
  assert.equal(state.catalogProductsStatus, 'ready')
  state.catalogProducts[0].name = 'Changed'
  assert.equal(state.catalogProducts[0].name, item.name)
  assert.equal(JSON.stringify(products), before.catalog)
  assert.deepEqual(findProducts('All', '', false, 'default', products), before.matches)
  assert.deepEqual(cartTotals(state.bag.items, state.bag.promoCode, products), before.totals)
  assert.equal(state.bag.addProduct('1'), false)
  assert.equal(state.theme, 'dark')
  await state.loadCatalogProducts(async () => {
    throw new TypeError('offline')
  })
  assert.equal(state.catalogProductsStatus, 'error')
  assert.equal(state.catalogProductsError.status, 0)
  assert.deepEqual(cartTotals(state.bag.items, state.bag.promoCode, products), before.totals)
  await state.loadCatalogProducts(jsonFetcher({ items: [] }))
  assert.equal(state.catalogProductsStatus, 'ready')
  assert.equal(state.catalogProductsError, null)
  assert.deepEqual(state.catalogProducts, [])
})
