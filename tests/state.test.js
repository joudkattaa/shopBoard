import { products } from '../server/catalog.ts'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createState as createRawState } from '../src/state.ts'

function memoryStorage(entries = []) {
  const values = new Map(entries)
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test('cart actions persist quantities, promo code and removal across reloads', async () => {
  const storage = memoryStorage()
  const state = await readyState(storage)
  assert.equal(state.bag.addProduct('missing'), false)
  state.bag.addProduct('serum')
  state.bag.addProduct('serum')
  state.bag.changeQuantity('serum', 150)
  assert.equal(state.bag.addProduct('serum'), false)
  state.bag.setPromoCode('GLOW20')
  const reloaded = await readyState(storage)
  assert.deepEqual(reloaded.bag.items, [{ id: 'serum', quantity: 99 }])
  assert.equal(reloaded.bag.promoCode, 'GLOW20')
  reloaded.bag.changeQuantity('serum', -99)
  assert.deepEqual((await readyState(storage)).bag.items, [])
  reloaded.bag.addProduct('cream')
  reloaded.bag.removeProduct('cream')
  assert.deepEqual(reloaded.bag.items, [])
  reloaded.bag.addProduct('serum')
  reloaded.bag.clearCart()
  assert.equal((await readyState(storage)).bag.promoCode, '')
  assert.deepEqual((await readyState(storage)).bag.items, [])
})

test('legacy bags migrate on edit and snapshots cannot mutate owned state', async () => {
  const storage = memoryStorage([
    [
      'lumiere-shopping-bag-v1',
      JSON.stringify({ items: [{ id: 'cream', quantity: 2 }], promoCode: 'GLOW20' }),
    ],
  ])
  const state = await readyState(storage)
  state.bag.items[0].quantity = 50
  assert.equal(state.bag.items[0].quantity, 2)
  state.bag.addProduct('serum')
  assert.equal(JSON.parse(storage.getItem('roseveil-shopping-bag-v1')).items.length, 2)
  state.setProfile({ name: 'Rose' })
  state.profile.name = 'Changed'
  assert.equal(state.profile.name, 'Rose')
  assert.equal((await readyState(storage)).profile, null)
})

test('malformed or blocked storage preserves working in-memory cart and theme', async () => {
  assert.deepEqual(
    (await readyState(memoryStorage([['roseveil-shopping-bag-v1', '{bad']]))).bag.items,
    [],
  )
  const state = await readyState({
    getItem() {
      throw Error('blocked')
    },
    setItem() {
      throw Error('blocked')
    },
  })
  state.bag.addProduct('cream')
  state.setTheme('dark')
  assert.equal(state.bag.items.length, 1)
  assert.equal(state.theme, 'dark')
})

test('valid JSON with an invalid shape cannot populate the persisted bag', async () => {
  for (const saved of [null, false, 42, 'serum', { items: 'serum', promoCode: 20 }]) {
    const storage = memoryStorage([['roseveil-shopping-bag-v1', JSON.stringify(saved)]])
    const state = await readyState(storage)
    assert.deepEqual(state.bag.items, [])
    assert.equal(state.bag.promoCode, '')
    state.bag.addProduct('serum')
    assert.deepEqual((await readyState(storage)).bag.items, [{ id: 'serum', quantity: 1 }])
  }
})

test('architecture keeps data declarative, logic pure, DOM in UI, storage in state modules', async () => {
  const read = (name) => fs.readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
  assert.doesNotMatch(
    fs
      .readFileSync(new URL('../server/catalog.ts', import.meta.url), 'utf8')
      .replace(/^import type[^\n]*\n/gm, ''),
    /\b(?:function|import|document|localStorage)\b/,
  )
  for (const module of ['modules/products/products.logic', 'modules/cart/cart.logic']) {
    assert.doesNotMatch(read(module), /\b(?:document|window|localStorage)\b/)
  }
  assert.doesNotMatch(read('state').replace(/\/\/[^\n]*/g, ''), /\b(?:document|window)\b/)
  assert.doesNotMatch(read('modules/cart/cart.state'), /\b(?:document|window)\b/)
  assert.doesNotMatch(read('modules/cart/cart.state'), /from ['"]\.\.\/\.\.\/state\.ts['"]/)
  assert.doesNotMatch(read('state'), /roseveil-shopping-bag|lumiere-shopping-bag|GLOW20/)
  assert.equal(fs.existsSync(new URL('../src/logic.ts', import.meta.url)), false)
  assert.doesNotMatch(read('ui'), /\blocalStorage\b/)
  assert.doesNotMatch(read('main'), /\b(?:document|window|localStorage|function)\b/)
  assert.doesNotMatch(
    fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
    /<script(?![^>]*\bsrc=)[^>]*>/,
  )
})

test('every non-UI source module is free of DOM queries, mutations and event binding', async () => {
  for (const file of fs.readdirSync(new URL('../src/', import.meta.url), { recursive: true })) {
    if (
      !/\.[jt]s$/.test(file) ||
      ['ui.ts', 'modules/products/products.ui.ts', 'modules/cart/cart.ui.ts'].includes(
        file.replaceAll('\\', '/'),
      )
    )
      continue
    const source = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(
      source,
      /\.(?:innerHTML|textContent|addEventListener|querySelector|querySelectorAll)\b/,
      file,
    )
  }
})

test('feature UI depends on injected helpers without coordinator imports or global routers', () => {
  for (const feature of ['products', 'cart']) {
    const source = fs.readFileSync(
      new URL(`../src/modules/${feature}/${feature}.ui.ts`, import.meta.url),
      'utf8',
    )
    assert.doesNotMatch(
      source,
      /from ['"][^'"]*(?:\.\.\/\.\.\/ui\.ts|cart\.ui\.ts|products\.ui\.ts)['"]/,
    )
    assert.doesNotMatch(source, /\blocalStorage\b|document\.addEventListener/)
    assert.doesNotMatch(
      source,
      /(?:function|const)\s+(?:formatMoney|productMedia|escape|notify|openContent)\b/,
    )
  }
  const cartSource = fs.readFileSync(
    new URL('../src/modules/cart/cart.ui.ts', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(cartSource, /subscribeCatalogProducts|loadCatalogProducts/)
})

async function readyState(storage) {
  const state = createRawState(storage)
  await state.loadCatalogProducts(async () => Response.json({ items: products }))
  return state
}

test('saved bag survives pending, failed and empty API responses, then validates against fetched data', async () => {
  const saved = {
    items: [
      { id: 'serum', quantity: 2 },
      { id: 'retired', quantity: 1 },
    ],
    promoCode: 'GLOW20',
  }
  const storage = memoryStorage([['roseveil-shopping-bag-v1', JSON.stringify(saved)]])
  const state = createRawState(storage)
  assert.deepEqual(state.bag.items, saved.items)
  assert.equal(state.bag.addProduct('serum'), false)
  let resolve
  const pending = new Promise((done) => {
    resolve = done
  })
  const loading = state.loadCatalogProducts(() => pending)
  assert.deepEqual(state.bag.items, saved.items)
  resolve(new Response(null, { status: 500 }))
  await loading
  assert.equal(state.catalogProductsStatus, 'error')
  assert.deepEqual(state.bag.items, saved.items)
  await state.loadCatalogProducts(async () => Response.json({ items: [] }))
  assert.deepEqual(state.bag.items, saved.items)
  assert.equal(storage.getItem('roseveil-shopping-bag-v1'), JSON.stringify(saved))
  await state.loadCatalogProducts(async () => Response.json({ items: products }))
  assert.deepEqual(state.bag.items, [{ id: 'serum', quantity: 2 }])
  assert.equal(state.bag.promoCode, 'GLOW20')
  assert.equal(state.bag.addProduct('serum'), true)
  assert.deepEqual(JSON.parse(storage.getItem('roseveil-shopping-bag-v1')).items, [
    { id: 'serum', quantity: 3 },
  ])
})

test('frontend source cannot import the server catalog or the removed data module', () => {
  assert.equal(fs.existsSync(new URL('../src/data.ts', import.meta.url)), false)
  for (const file of fs.readdirSync(new URL('../src/', import.meta.url), { recursive: true })) {
    if (!file.endsWith('.ts')) continue
    const source = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /(?:from|import)\s*['"][^'"]*(?:server\/|data\.ts)/, file)
  }
})
