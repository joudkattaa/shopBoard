import test from 'node:test'
import assert from 'node:assert/strict'
import { cartTotals, normalizeCart, findProducts, productById } from '../src/store.js'

test('a bag uses catalog prices and computes a 20% discount to the cent', () => {
  const bag = [{ id: 'serum', quantity: 1 }, { id: 'cream', quantity: 1 }]
  assert.deepEqual(cartTotals(bag, ' glow20 '), {
    count: 2, subtotal: 6498, discount: 1300, merchandise: 5198, shipping: 0, total: 5198,
  })
})

test('shipping eligibility is recalculated after a discount', () => {
  const bag = [{ id: 'cream', quantity: 1 }, { id: 'toner', quantity: 1 }]
  assert.equal(cartTotals(bag).shipping, 0)
  assert.equal(cartTotals(bag, 'GLOW20').shipping, 595)
  assert.equal(cartTotals(bag, 'GLOW20').total, 4833)
  assert.equal(cartTotals([{ id: 'perfume', quantity: 1 }]).shipping, 595)
})

test('empty or invalid saved bags never incur a shipping charge', () => {
  assert.deepEqual(cartTotals([]), { count: 0, subtotal: 0, discount: 0, merchandise: 0, shipping: 0, total: 0 })
  assert.equal(cartTotals([{ id: 'missing', quantity: 5 }]).total, 0)
  assert.deepEqual(normalizeCart(null), [])
})

test('saved bags reject unknown products and invalid quantities, merge duplicates, and cap quantities', () => {
  assert.deepEqual(normalizeCart([
    null, { id: 'serum', quantity: 2, price: 1 }, { id: 'serum', quantity: 3 },
    { id: 'cream', quantity: 1000 }, { id: 'missing', quantity: 2 },
    { id: 'toner', quantity: -1 }, { id: 'perfume', quantity: 0.5 }, { id: 'cleanser', quantity: '2' },
  ]), [{ id: 'serum', quantity: 5 }, { id: 'cream', quantity: 99 }])
  assert.equal(cartTotals([{ id: 'serum', quantity: 1, price: 1 }]).subtotal, productById('serum').price)
})

test('an unknown code never changes the merchandise price', () => {
  const totals = cartTotals([{ id: 'serum', quantity: 1 }], 'NOT-A-CODE')
  assert.equal(totals.discount, 0)
  assert.equal(totals.total, 4094)
})

test('category browsing, search, and the initial five bestsellers stay distinct', () => {
  assert.equal(findProducts('All', '', true).length, 5)
  assert.equal(findProducts('Skin Care').length, 4)
  assert.equal(findProducts('All', 'skincare').length, 5)
  assert.deepEqual(findProducts('All', '  ROSE BLOOM  ').map(product => product.id), ['perfume'])
  assert.equal(findProducts('Makeup', 'serum').length, 0)
  assert.equal(findProducts('All', 'not-a-product').length, 0)
  assert.deepEqual(findProducts('Hair Care').map(product => product.id), ['hair'])
})
