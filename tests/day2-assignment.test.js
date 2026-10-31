import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { products } from '../src/data.js'
import { findProducts, cartTotals, productCategories } from '../src/logic.js'
import { createState } from '../src/state.js'
import { setupCounter } from '../src/counter.js'

test('Day 2 uses a data-driven grid with valid product assets and no static product cards', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /<article\b[^>]*class="[^"]*\bproduct-card\b/)
  assert.match(html, /<div id="product-grid" class="product-grid"><\/div>/)
  assert.equal(new Set(products.map((product) => product.id)).size, products.length)
  for (const product of products) {
    assert.ok(Number.isInteger(product.price) && product.price > 0)
    assert.ok(fs.existsSync(new URL(`../public/roseveil/${product.image}.png`, import.meta.url)))
  }
})

test('every category supports case-insensitive search and both immutable price sorts', () => {
  const before = JSON.stringify(products)
  for (const category of productCategories) {
    const name = findProducts(category)[0].name.split(' ')[0]
    for (const sort of ['price-asc', 'price-desc']) {
      const found = findProducts(category, name.toUpperCase(), false, sort)
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

test('refresh-equivalent state recreation restores quantities and totals', () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const first = createState(storage)
  first.addProduct('serum')
  first.addProduct('serum')
  first.addProduct('cream')
  first.setPromoCode('GLOW20')
  const refreshed = createState(storage)
  assert.deepEqual(refreshed.cart, first.cart)
  assert.deepEqual(
    cartTotals(refreshed.cart, refreshed.promoCode),
    cartTotals(first.cart, first.promoCode),
  )
  assert.equal(cartTotals(refreshed.cart).count, 3)
})

test('legacy counter remains callable after moving its DOM implementation into UI', () => {
  const element = {
    innerHTML: '',
    addEventListener(_, handler) {
      this.click = handler
    },
  }
  setupCounter(element)
  assert.equal(element.innerHTML, 'Count is 0')
  element.click()
  assert.equal(element.innerHTML, 'Count is 1')
})
