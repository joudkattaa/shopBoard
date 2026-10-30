import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createState } from '../src/state.js'

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

test('architecture keeps data declarative, logic pure, DOM in UI, storage in state', () => {
  const read = (name) => fs.readFileSync(new URL(`../src/${name}.js`, import.meta.url), 'utf8')
  assert.doesNotMatch(read('data'), /\b(?:function|import|document|localStorage)\b/)
  assert.doesNotMatch(read('logic'), /\b(?:document|window|localStorage)\b/)
  assert.doesNotMatch(read('state').replace(/\/\/[^\n]*/g, ''), /\b(?:document|window)\b/)
  assert.doesNotMatch(read('ui'), /\blocalStorage\b/)
  assert.doesNotMatch(read('main'), /\b(?:document|window|localStorage|function)\b/)
  assert.doesNotMatch(
    fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
    /<script(?![^>]*\bsrc=)[^>]*>/,
  )
})
