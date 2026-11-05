import test from 'node:test'
import assert from 'node:assert/strict'
import { createCartState } from '../src/modules/cart/cart.state.ts'
import { createState } from '../src/state.ts'
import { products } from '../server/catalog.ts'

function storageWith(entries = []) {
  const values = new Map(entries)
  const writes = []
  return {
    writes,
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      writes.push(key)
      values.set(key, value)
    },
  }
}

test('cart module reads the latest catalog and reconciles without persisting or copying catalog state', () => {
  const saved = { items: [{ id: 'serum', quantity: 2 }], promoCode: 'GLOW20' }
  const storage = storageWith([['roseveil-shopping-bag-v1', JSON.stringify(saved)]])
  let catalog = []
  const bag = createCartState(storage, () => catalog)
  assert.deepEqual(bag.items, saved.items)
  assert.equal(bag.addProduct('serum'), false)
  bag.reconcileCatalog()
  assert.deepEqual(bag.items, saved.items)
  catalog = products
  assert.equal(bag.addProduct('serum'), true)
  assert.equal(bag.items[0].quantity, 3)
  catalog = products.filter((product) => product.id !== 'serum')
  assert.equal(bag.addProduct('serum'), false)
  const writes = storage.writes.length
  bag.reconcileCatalog()
  assert.deepEqual(bag.items, [])
  assert.equal(bag.promoCode, 'GLOW20')
  assert.equal(storage.writes.length, writes)
})

test('bag getters remain live and defensive with no application-level cart aliases', async () => {
  const state = createState(storageWith())
  const bag = state.bag
  for (const key of [
    'cart',
    'promoCode',
    'addProduct',
    'changeQuantity',
    'removeProduct',
    'setPromoCode',
    'clearCart',
  ]) {
    assert.equal(key in state, false)
  }
  await state.loadCatalogProducts(async () => Response.json({ items: products }))
  bag.addProduct('serum')
  bag.setPromoCode('GLOW20')
  const snapshot = bag.items
  snapshot[0].quantity = 99
  snapshot.push({ id: 'cream', quantity: 1 })
  assert.deepEqual(bag.items, [{ id: 'serum', quantity: 1 }])
  bag.clearCart()
  assert.equal(state.bag, bag)
  assert.deepEqual(bag.items, [])
  assert.equal(bag.promoCode, '')
})

test('current saved bag takes priority and legacy data migrates only on a cart edit', () => {
  const current = JSON.stringify({ items: [{ id: 'cream', quantity: 1 }], promoCode: '' })
  const legacy = JSON.stringify({ items: [{ id: 'serum', quantity: 2 }], promoCode: 'GLOW20' })
  const storage = storageWith([
    ['roseveil-shopping-bag-v1', current],
    ['lumiere-shopping-bag-v1', legacy],
  ])
  assert.deepEqual(createCartState(storage, () => products).items, [{ id: 'cream', quantity: 1 }])
  const oldStorage = storageWith([['lumiere-shopping-bag-v1', legacy]])
  const bag = createCartState(oldStorage, () => products)
  bag.reconcileCatalog()
  assert.deepEqual(oldStorage.writes, [])
  bag.clearCart()
  assert.deepEqual(oldStorage.writes, ['roseveil-shopping-bag-v1'])
  assert.deepEqual(JSON.parse(oldStorage.getItem('roseveil-shopping-bag-v1')), {
    items: [],
    promoCode: '',
  })
  assert.equal(oldStorage.getItem('lumiere-shopping-bag-v1'), legacy)
})
