import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { products } from '../server/catalog.ts'
import { findProducts, productCategories } from '../src/modules/products/products.logic.ts'
import { cartTotals } from '../src/modules/cart/cart.logic.ts'
import { createState as createRawState } from '../src/state.ts'

test('Day 2 uses a data-driven grid with valid product assets and no static product cards', async () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /<article\b[^>]*class="[^"]*\bproduct-card\b/)
  assert.match(html, /<div id="product-grid" class="product-grid" aria-busy="true"><\/div>/)
  assert.equal(new Set(products.map((product) => product.id)).size, products.length)
  for (const product of products) {
    assert.ok(Number.isInteger(product.price) && product.price > 0)
    assert.ok(fs.existsSync(new URL(`../public/roseveil/${product.image}.webp`, import.meta.url)))
  }
})

test('every category supports case-insensitive search and both immutable price sorts', async () => {
  const before = JSON.stringify(products)
  for (const category of productCategories) {
    const name = findProducts(category, '', false, 'default', products)[0].name.split(' ')[0]
    for (const sort of ['price-asc', 'price-desc']) {
      const found = findProducts(category, name.toUpperCase(), false, sort, products)
      assert.ok(found.length > 0)
      assert.ok(
        found.every(
          (product) =>
            product.category === category &&
            product.name.toLowerCase().includes(name.toLowerCase()),
        ),
      )
      assert.ok(
        found.every(
          (product, index) =>
            index === 0 ||
            (sort === 'price-asc'
              ? found[index - 1].price <= product.price
              : found[index - 1].price >= product.price),
        ),
      )
    }
  }
  assert.equal(JSON.stringify(products), before)
})

test('refresh-equivalent state recreation restores quantities and totals', async () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const first = await readyState(storage)
  first.bag.addProduct('serum')
  first.bag.addProduct('serum')
  first.bag.addProduct('cream')
  first.bag.setPromoCode('GLOW20')
  const refreshed = await readyState(storage)
  assert.deepEqual(refreshed.bag.items, first.bag.items)
  assert.deepEqual(
    cartTotals(refreshed.bag.items, refreshed.bag.promoCode, products),
    cartTotals(first.bag.items, first.bag.promoCode, products),
  )
  assert.equal(cartTotals(refreshed.bag.items, '', products).count, 3)
})

async function readyState(storage) {
  const state = createRawState(storage)
  await state.loadCatalogProducts(async () => Response.json({ items: products }))
  return state
}
