import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createState } from '../src/state.ts'

function memoryStorage(entries = []) {
  const values = new Map(entries)
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test('cart actions persist quantities, promo code and removal across reloads', () => {
  const storage = memoryStorage()
  const state = createState(storage)
  assert.equal(state.addProduct('missing'), false)
  state.addProduct('serum')
  state.addProduct('serum')
  state.changeQuantity('serum', 150)
  assert.equal(state.addProduct('serum'), false)
  state.setPromoCode('GLOW20')
  const reloaded = createState(storage)
  assert.deepEqual(reloaded.cart, [{ id: 'serum', quantity: 99 }])
  assert.equal(reloaded.promoCode, 'GLOW20')
  reloaded.changeQuantity('serum', -99)
  assert.deepEqual(createState(storage).cart, [])
  reloaded.addProduct('cream')
  reloaded.removeProduct('cream')
  assert.deepEqual(reloaded.cart, [])
  reloaded.addProduct('serum')
  reloaded.clearCart()
  assert.equal(createState(storage).promoCode, '')
  assert.deepEqual(createState(storage).cart, [])
})

test('legacy bags migrate on edit and snapshots cannot mutate owned state', () => {
  const storage = memoryStorage([
    [
      'lumiere-shopping-bag-v1',
      JSON.stringify({ items: [{ id: 'cream', quantity: 2 }], promoCode: 'GLOW20' }),
    ],
  ])
  const state = createState(storage)
  state.cart[0].quantity = 50
  assert.equal(state.cart[0].quantity, 2)
  state.addProduct('serum')
  assert.equal(JSON.parse(storage.getItem('roseveil-shopping-bag-v1')).items.length, 2)
  state.setProfile({ name: 'Rose' })
  state.profile.name = 'Changed'
  assert.equal(state.profile.name, 'Rose')
  assert.equal(createState(storage).profile, null)
})

test('malformed or blocked storage preserves working in-memory cart and theme', () => {
  assert.deepEqual(createState(memoryStorage([['roseveil-shopping-bag-v1', '{bad']])).cart, [])
  const state = createState({
    getItem() {
      throw Error('blocked')
    },
    setItem() {
      throw Error('blocked')
    },
  })
  state.addProduct('cream')
  state.setTheme('dark')
  assert.equal(state.cart.length, 1)
  assert.equal(state.theme, 'dark')
})

test('valid JSON with an invalid shape cannot populate the persisted bag', () => {
  for (const saved of [null, false, 42, 'serum', { items: 'serum', promoCode: 20 }]) {
    const storage = memoryStorage([['roseveil-shopping-bag-v1', JSON.stringify(saved)]])
    const state = createState(storage)
    assert.deepEqual(state.cart, [])
    assert.equal(state.promoCode, '')
    state.addProduct('serum')
    assert.deepEqual(createState(storage).cart, [{ id: 'serum', quantity: 1 }])
  }
})

test('architecture keeps data declarative, logic pure, DOM in UI, storage in state', () => {
  const read = (name) => fs.readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
  assert.doesNotMatch(
    read('data').replace(/^import type[^\n]*\n/gm, ''),
    /\b(?:function|import|document|localStorage)\b/,
  )
  for (const module of ['logic', 'modules/products/products.logic', 'modules/cart/cart.logic']) {
    assert.doesNotMatch(read(module), /\b(?:document|window|localStorage)\b/)
  }
  assert.doesNotMatch(read('state').replace(/\/\/[^\n]*/g, ''), /\b(?:document|window)\b/)
  assert.doesNotMatch(read('ui'), /\blocalStorage\b/)
  assert.doesNotMatch(read('main'), /\b(?:document|window|localStorage|function)\b/)
  assert.doesNotMatch(
    fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
    /<script(?![^>]*\bsrc=)[^>]*>/,
  )
})

test('every non-UI source module is free of DOM queries, mutations and event binding', () => {
  for (const file of fs.readdirSync(new URL('../src/', import.meta.url), { recursive: true })) {
    if (!/\.[jt]s$/.test(file) || file === 'ui.ts') continue
    const source = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(
      source,
      /\.(?:innerHTML|textContent|addEventListener|querySelector|querySelectorAll)\b/,
      file,
    )
  }
})
