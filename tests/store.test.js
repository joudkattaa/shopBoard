import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../server/catalog.ts'
import { cartTotals, normalizeCart } from '../src/modules/cart/cart.logic.ts'
import { findProducts, productById } from '../src/modules/products/products.logic.ts'

test('untrusted cart lines reject primitive entries and non-numeric quantities', () => {
  assert.deepEqual(
    normalizeCart(
      [
        null,
        42,
        'serum',
        { id: 'serum', quantity: '2' },
        { id: 'serum', quantity: Infinity },
        { id: 'serum', quantity: 1.5 },
        { id: 'missing', quantity: 3 },
        { id: 'serum', quantity: 2 },
      ],
      products,
    ),
    [{ id: 'serum', quantity: 2 }],
  )
})

test('a bag uses catalog prices and computes a 20% discount to the cent', () => {
  const bag = [
    { id: 'serum', quantity: 1 },
    { id: 'cream', quantity: 1 },
  ]
  assert.deepEqual(cartTotals(bag, ' glow20 ', products), {
    count: 2,
    subtotal: 6498,
    discount: 1300,
    merchandise: 5198,
    shipping: 0,
    total: 5198,
  })
})

test('shipping eligibility is recalculated after a discount', () => {
  const bag = [
    { id: 'cream', quantity: 1 },
    { id: 'toner', quantity: 1 },
  ]
  assert.equal(cartTotals(bag, '', products).shipping, 0)
  assert.equal(cartTotals(bag, 'GLOW20', products).shipping, 595)
  assert.equal(cartTotals(bag, 'GLOW20', products).total, 4833)
  assert.equal(cartTotals([{ id: 'perfume', quantity: 1 }], '', products).shipping, 595)
})

test('empty or invalid saved bags never incur a shipping charge', () => {
  assert.deepEqual(cartTotals([], '', products), {
    count: 0,
    subtotal: 0,
    discount: 0,
    merchandise: 0,
    shipping: 0,
    total: 0,
  })
  assert.equal(cartTotals([{ id: 'missing', quantity: 5 }], '', products).total, 0)
  assert.deepEqual(normalizeCart(null, products), [])
})

test('saved bags reject unknown products and invalid quantities, merge duplicates, and cap quantities', () => {
  assert.deepEqual(
    normalizeCart(
      [
        null,
        { id: 'serum', quantity: 2, price: 1 },
        { id: 'serum', quantity: 3 },
        { id: 'cream', quantity: 1000 },
        { id: 'missing', quantity: 2 },
        { id: 'toner', quantity: -1 },
        { id: 'perfume', quantity: 0.5 },
        { id: 'cleanser', quantity: '2' },
      ],
      products,
    ),
    [
      { id: 'serum', quantity: 5 },
      { id: 'cream', quantity: 99 },
    ],
  )
  assert.equal(
    cartTotals([{ id: 'serum', quantity: 1, price: 1 }], '', products).subtotal,
    productById('serum', products).price,
  )
})

test('an unknown code never changes the merchandise price', () => {
  const totals = cartTotals([{ id: 'serum', quantity: 1 }], 'NOT-A-CODE', products)
  assert.equal(totals.discount, 0)
  assert.equal(totals.total, 4094)
})

test('category browsing, search, and the featured preview stay distinct', () => {
  assert.equal(findProducts('All', '', true, 'default', products).length, 5)
  assert.equal(
    new Set(findProducts('All', '', true, 'default', products).map((product) => product.category))
      .size,
    5,
  )
  assert.equal(findProducts('Skin Care', '', false, 'default', products).length, 8)
  assert.equal(findProducts('Body Care', '', false, 'default', products).length, 8)
  assert.deepEqual(
    findProducts('All', 'body mist', false, 'default', products).map((product) => product.id),
    ['body-mist'],
  )
  assert.equal(findProducts('All', 'skincare', false, 'default', products).length, 0)
  assert.deepEqual(
    findProducts('All', '  ROSE BLOOM  ', false, 'default', products).map((product) => product.id),
    ['perfume'],
  )
  assert.equal(findProducts('Makeup', 'serum', false, 'default', products).length, 0)
  assert.equal(findProducts('All', 'not-a-product', false, 'default', products).length, 0)
  assert.deepEqual(
    findProducts('Hair Care', '', false, 'default', products).map((product) => product.id),
    ['shampoo', 'conditioner', 'hair', 'hair-mask', 'hair-oil', 'hair-mist'],
  )
})

test('beauty replacements remove retired fashion items from saved bags', () => {
  assert.equal(products.length, 30)
  assert.ok(
    products.every(
      (product) => product.image && !['Bags', 'Shoes', 'Accessories'].includes(product.category),
    ),
  )
  assert.deepEqual(
    normalizeCart(
      [
        { id: '1', quantity: 1 },
        { id: '12', quantity: 2 },
        { id: 'body-butter', quantity: 1 },
      ],
      products,
    ),
    [{ id: 'body-butter', quantity: 1 }],
  )
  assert.deepEqual(
    findProducts('All', 'night cream', false, 'default', products).map((product) => product.id),
    ['night-cream'],
  )
  assert.equal(
    cartTotals(
      [
        { id: 'body-butter', quantity: 1 },
        { id: 'hand-cream', quantity: 2 },
      ],
      '',
      products,
    ).subtotal,
    5497,
  )
})

test('name search and category filtering combine before price sorting without mutating catalog', () => {
  const original = JSON.stringify(products)
  const ascending = findProducts('Hair Care', '  BOTANICAL  ', false, 'price-asc', products)
  assert.equal(ascending.length, 5)
  assert.ok(
    ascending.every(
      (p) => p.category === 'Hair Care' && p.name.toLowerCase().includes('botanical'),
    ),
  )
  assert.deepEqual(
    ascending.map((p) => p.price),
    [2399, 2499, 2599, 2799, 4299],
  )
  assert.deepEqual(
    findProducts('Hair Care', 'botanical', false, 'price-desc', products).map((p) => p.price),
    [4299, 2799, 2599, 2499, 2399],
  )
  assert.deepEqual(findProducts('Makeup', 'botanical', false, 'price-asc', products), [])
  assert.deepEqual(findProducts('All', 'comforting', false, 'default', products), [])
  assert.deepEqual(
    findProducts('All', '', false, 'default', products).map((p) => p.id),
    products.map((p) => p.id),
  )
  assert.equal(JSON.stringify(products), original)
  assert.notEqual(findProducts('All', '', false, 'default', products), products)
})
