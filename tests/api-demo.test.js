import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeCatalogLoading } from '../src/modules/products/products.ui.ts'
import { createState } from '../src/state.ts'
import { products } from '../server/catalog.ts'

function mount(fetcher, savedCart = [], search = '') {
  const document = {
    activeElement: null,
    defaultView: { location: { search } },
    querySelector: (selector) => nodes[selector],
  }
  const element = () => ({
    attributes: {},
    listeners: {},
    textContent: '',
    setAttribute(k, v) {
      this.attributes[k] = v
    },
    removeAttribute(k) {
      delete this.attributes[k]
    },
    replaceChildren() {},
    addEventListener(k, fn) {
      this.listeners[k] = fn
    },
    focus() {
      document.activeElement = this
    },
  })
  const nodes = Object.fromEntries(
    ['catalog-status', 'catalog-retry', 'product-grid', 'products-title'].map((id) => [
      '#' + id,
      element(),
    ]),
  )
  const state = createState({
    getItem: (key) =>
      key === 'roseveil-shopping-bag-v1'
        ? JSON.stringify({ items: savedCart, promoCode: 'GLOW20' })
        : null,
    setItem() {},
  })
  const renders = []
  initializeCatalogLoading(
    state,
    () => renders.push(state.catalogProductsStatus === 'ready' ? state.catalogProducts : []),
    document,
    fetcher,
  )
  return {
    state,
    document,
    renders,
    status: nodes['#catalog-status'],
    retry: nodes['#catalog-retry'],
    grid: nodes['#product-grid'],
    heading: nodes['#products-title'],
  }
}
const flush = () => new Promise((done) => setImmediate(done))

test('outside Vite development the UI never forwards simulation query flags', async () => {
  const urls = []
  mount(
    async (url) => {
      urls.push(url)
      return Response.json({ items: products })
    },
    [],
    '?api-error=500&api-empty=1&api-delay=3000',
  )
  await flush()
  assert.deepEqual(urls, ['/api/products'])
})

test('catalog shows loading, then renders fetched cosmetic data and clears busy state', async () => {
  let resolve
  const pending = new Promise((done) => {
    resolve = done
  })
  const { state, status, grid, renders, retry } = mount(() => pending)
  assert.match(status.textContent, /Loading ROSEVEIL/)
  assert.equal(grid.attributes['aria-busy'], 'true')
  assert.deepEqual(renders.at(-1), [])
  resolve(Response.json({ items: products }))
  await flush()
  assert.deepEqual(renders.at(-1), products)
  assert.equal(status.textContent, '')
  assert.equal(grid.attributes['aria-busy'], 'false')
  assert.ok('hidden' in retry.attributes)
  assert.equal(state.catalogProducts.length, 30)
})
test('empty API results render no cards and announce an empty catalog', async () => {
  const { status, renders } = mount(async () => Response.json({ items: [] }))
  await flush()
  assert.match(status.textContent, /No products/)
  assert.deepEqual(renders.at(-1), [])
})
test('failed catalog request retries once, restores focus and preserves saved cosmetics', async () => {
  let calls = 0,
    resolve
  const pending = new Promise((done) => {
    resolve = done
  })
  const { state, status, retry, document, heading, renders } = mount(
    () => (++calls === 1 ? Promise.resolve(new Response(null, { status: 500 })) : pending),
    [{ id: 'serum', quantity: 1 }],
  )
  state.bag.setPromoCode('GLOW20')
  await flush()
  assert.match(status.textContent, /Unable to load/)
  assert.ok(!('hidden' in retry.attributes))
  retry.focus()
  retry.listeners.click()
  retry.listeners.click()
  assert.equal(calls, 2)
  assert.match(status.textContent, /Loading/)
  resolve(Response.json({ items: products }))
  await flush()
  assert.equal(calls, 2)
  // Initial render, first loading/error, retry loading/success: one render each.
  assert.equal(renders.length, 5)
  assert.deepEqual(renders.at(-1), products)
  assert.equal(document.activeElement, heading)
  assert.deepEqual(state.bag.items, [{ id: 'serum', quantity: 1 }])
  assert.equal(state.bag.promoCode, 'GLOW20')
})
test('repeat failures keep retry available and focused', async () => {
  const { retry, status, document } = mount(async () => {
    throw new TypeError('offline')
  })
  await flush()
  retry.focus()
  retry.listeners.click()
  await flush()
  assert.match(status.textContent, /Unable/)
  assert.equal(document.activeElement, retry)
  assert.ok(!('hidden' in retry.attributes))
})
