import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import * as productLogic from '../src/modules/products/products.logic.ts'
import { cartTotals } from '../src/modules/cart/cart.logic.ts'
import { createState } from '../src/state.ts'
import { products } from '../server/catalog.ts'

const store = { ...productLogic, cartTotals }

// Exercise the real event handlers without adding a DOM dependency.
async function mountCatalog() {
  const listenerCounts = new Map()
  let fetchCalls = 0
  let subscriptions = 0
  const elements = new Map()
  const links = store.productCategories.map((category) => element({ category }))
  function element(dataset = {}) {
    return {
      dataset,
      value: '',
      _innerHTML: '',
      innerHTMLWrites: 0,
      get innerHTML() {
        return this._innerHTML
      },
      set innerHTML(value) {
        this._innerHTML = value
        this.innerHTMLWrites++
        // Replaced dialog contents create new form nodes in the real browser.
        const replaced =
          this === elements.get('#cart-content')
            ? ['#promo-form', '#promo-code', '#promo-status']
            : this === elements.get('#content-body')
              ? ['#checkout-form', '#checkout-first']
              : []
        replaced.forEach((selector) => elements.delete(selector))
      },
      textContent: '',
      hidden: false,
      attributes: {},
      listeners: {},
      classList: { toggle() {}, remove() {} },
      getAttribute(name) {
        return this.attributes[name]
      },
      contains(node) {
        return node === this || this.children?.includes(node) || false
      },
      getClientRects() {
        return [{}]
      },
      close() {
        this.open = false
      },
      replaceChildren() {},
      showModal() {
        this.open = true
      },
      setAttribute(name, value) {
        this.attributes[name] = value
      },
      removeAttribute(name) {
        delete this.attributes[name]
      },
      addEventListener(name, handler) {
        const handlers = (this.handlers ??= {})
        ;(handlers[name] ??= []).push(handler)
        this.listeners[name] = (event) => handlers[name].forEach((fn) => fn(event))
      },
      scrollIntoView() {},
      focus() {
        this.focused = true
        document.activeElement = this
      },
    }
  }
  const tools = Array.from({ length: 3 }, () => {
    const tool = element()
    tool.open = false
    tool.field = element()
    tool.summary = element()
    tool.children = [tool.field, tool.summary]
    tool.querySelectorAll = () => [tool.field]
    tool.querySelector = (selector) => (selector === 'summary' ? tool.summary : tool.field)
    return tool
  })
  const get = (selector) => {
    if (selector === 'dialog[open]')
      return ['#content-dialog', '#cart-dialog'].map(get).find((dialog) => dialog.open) ?? null
    if (!elements.has(selector)) elements.set(selector, element())
    return elements.get(selector)
  }
  const document = {
    listeners: {},
    documentElement: element(),
    querySelector: get,
    querySelectorAll: (selector) => {
      if (selector === '.catalog-tool') return tools
      if (selector === '.catalog-tool[open]') return tools.filter((tool) => tool.open)
      return selector.includes('[data-category]') ? links : []
    },
    addEventListener(name, handler) {
      listenerCounts.set(name, (listenerCounts.get(name) ?? 0) + 1)
      const handlers = (this.handlers ??= {})
      ;(handlers[name] ??= []).push(handler)
      this.listeners[name] = (event) => handlers[name].forEach((fn) => fn(event))
    },
  }
  const saved = new Map()
  const source =
    ['../src/modules/products/products.ui.ts', '../src/modules/cart/cart.ui.ts', '../src/ui.ts']
      .map((file) =>
        stripTypeScriptTypes(fs.readFileSync(new URL(file, import.meta.url), 'utf8'))
          .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\r?\n/gm, '')
          .replaceAll('export function', 'function'),
      )
      .join('\n')
      .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\r?\n/gm, '')
      // Match Vite's production replacement before executing as a VM script.
      .replaceAll('import.meta.env?.DEV', 'false')
      .replaceAll('export function', 'function') + '\ninitializeUI(state)'
  const loadedState = createState({
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  })
  await loadedState.loadCatalogProducts(async () => Response.json({ items: products }))
  const subscribe = loadedState.subscribeCatalogProducts
  loadedState.subscribeCatalogProducts = (listener) => {
    subscriptions++
    return subscribe(listener)
  }
  vm.runInNewContext(source, {
    URLSearchParams,
    fetch: async () => {
      fetchCalls++
      return Response.json({ items: products })
    },
    ...store,
    Element: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLDetailsElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLButtonElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLInputElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLSelectElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLDialogElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    HTMLFormElement: class {
      static [Symbol.hasInstance](value) {
        return value !== null && typeof value === 'object'
      }
    },
    document,
    state: loadedState,
    localStorage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    },
    setTimeout: () => 1,
    clearTimeout() {},
  })
  await new Promise((resolve) => setImmediate(resolve))
  const change = (selector, event, value) => {
    const control = get(selector)
    control.value = value
    control.listeners[event]({ target: control })
  }
  const click = (selector, dataset) =>
    document.listeners.click({
      target: { closest: (match) => (match === selector ? { dataset } : null) },
    })
  return {
    get,
    change,
    click,
    saved,
    links,
    tools,
    document,
    state: loadedState,
    listenerCounts,
    fetchCalls,
    subscriptions,
  }
}

test('Clear Bag empties the real UI, resets totals and promo, and persists across reloads', async () => {
  const { get, click, saved, state, document } = await mountCatalog()
  click('[data-add]', { add: 'serum' })
  click('[data-add]', { add: 'cream' })
  state.bag.setPromoCode('GLOW20')
  get('#cart-button').listeners.click()
  const before = get('#cart-content').innerHTML
  assert.ok(before.indexOf('id="clear-bag"') > before.indexOf('</ul>'))
  assert.ok(before.indexOf('id="clear-bag"') < before.indexOf('id="promo-form"'))
  assert.match(before, /data-remove="serum"/)
  assert.match(before, /data-quantity="cream"/)
  assert.match(before, /GLOW20 applied/)
  assert.match(before, /id="checkout-button"/)
  get('#cart-content').listeners.click({
    target: { closest: (selector) => (selector === '#clear-bag' ? get('#clear-bag') : null) },
  })
  assert.deepEqual(state.bag.items, [])
  assert.equal(state.bag.promoCode, '')
  assert.equal(get('#cart-count').textContent, '0')
  assert.equal(get('#cart-heading-count').textContent, '')
  assert.match(get('#cart-content').innerHTML, /Your shopping bag is empty/)
  assert.doesNotMatch(get('#cart-content').innerHTML, /id="clear-bag"|id="checkout-button"/)
  assert.equal(document.activeElement, get('#cart-title'))
  assert.equal(get('#cart-dialog').open, true)
  const reloaded = createState({
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  })
  await reloaded.loadCatalogProducts(async () => Response.json({ items: products }))
  assert.deepEqual(reloaded.bag.items, [])
  assert.equal(reloaded.bag.promoCode, '')
  assert.deepEqual(
    store.cartTotals(reloaded.bag.items, reloaded.bag.promoCode, reloaded.catalogProducts),
    {
      count: 0,
      subtotal: 0,
      discount: 0,
      merchandise: 0,
      shipping: 0,
      total: 0,
    },
  )
})

test('Clear Bag is also available when API data is unavailable but saved items remain', async () => {
  const { get, click, state } = await mountCatalog()
  click('[data-add]', { add: 'serum' })
  await state.loadCatalogProducts(async () => Response.json({ items: [] }))
  get('#cart-button').listeners.click()
  assert.match(get('#cart-content').innerHTML, /Product prices are unavailable/)
  assert.match(get('#cart-content').innerHTML, /id="clear-bag"/)
  get('#cart-content').listeners.click({
    target: { closest: (selector) => (selector === '#clear-bag' ? get('#clear-bag') : null) },
  })
  assert.deepEqual(state.bag.items, [])
  assert.match(get('#cart-content').innerHTML, /Your shopping bag is empty/)
  assert.equal(get('#cart-count').textContent, '0')
})

test('collection starts with five varied products and View All expands the catalog', async () => {
  const { get, change } = await mountCatalog()
  const preview = get('#product-grid').innerHTML
  assert.equal((preview.match(/class="product-card"/g) ?? []).length, 5)
  assert.equal(get('#products-title').textContent, 'The Roseveil Collection')
  for (const id of ['body-cream', 'shampoo', 'serum', 'perfume', 'makeup'])
    assert.ok(preview.includes('data-product="' + id + '"'))
  assert.ok(get('#view-all').innerHTML.includes('VIEW ALL PRODUCTS'))
  get('#view-all').listeners.click()
  assert.equal((get('#product-grid').innerHTML.match(/class="product-card"/g) ?? []).length, 30)
  change('#catalog-search', 'input', 'night cream')
  assert.match(get('#filter-status').textContent, /^1 product/)
  assert.ok(get('#product-grid').innerHTML.includes('Moonlight Night Cream'))
})

test('real controls combine, synchronize category links, and clear all state', async () => {
  const { get, change, click, links } = await mountCatalog()
  for (const category of store.productCategories)
    assert.ok(get('#category-select').innerHTML.includes(category))
  change('#catalog-search', 'input', 'BOTANICAL')
  change('#category-select', 'change', 'Hair Care')
  change('#price-sort', 'change', 'price-desc')
  assert.match(get('#filter-status').textContent, /^5 products/)
  assert.equal(get('#product-search').value, 'BOTANICAL')
  assert.equal(
    links.find((link) => link.dataset.category === 'Hair Care').attributes['aria-current'],
    'true',
  )
  const grid = get('#product-grid').innerHTML
  assert.ok(grid.indexOf('Botanical Hair Ritual') < grid.indexOf('Botanical Shampoo'))
  click('[data-category]', { category: 'Skin Care' })
  assert.equal(get('#category-select').value, 'Skin Care')
  assert.equal(get('#price-sort').value, 'price-desc')
  assert.equal(get('#catalog-search').value, 'BOTANICAL')
  assert.equal(get('#empty-state').hidden, false)
  get('#clear-filters').listeners.click()
  assert.equal(get('#catalog-search').value, '')
  assert.equal(get('#product-search').value, '')
  assert.equal(get('#category-select').value, 'All')
  assert.equal(get('#price-sort').value, 'default')
  assert.match(get('#filter-status').textContent, /^30 products/)
  assert.equal(get('#empty-state').hidden, true)
})

test('catalog popup opening focuses the field and Escape restores the trigger', async () => {
  const { tools, document } = await mountCatalog()
  tools[0].open = true
  tools[0].listeners.toggle()
  assert.equal(tools[0].field.focused, true)
  tools[1].open = true
  tools[1].listeners.toggle()
  assert.equal(tools[0].open, false)
  assert.equal(tools[1].field.focused, true)
  tools[1].field.focused = false
  document.listeners.keydown({ key: 'Escape', preventDefault() {} })
  assert.equal(tools[1].open, false)
  assert.equal(document.activeElement, tools[1].summary)
})

test('header search stays synchronized and adding from filtered results still saves the bag', async () => {
  const { get, change, click, saved } = await mountCatalog()
  change('#product-search', 'input', 'radiance')
  assert.equal(get('#catalog-search').value, 'radiance')
  assert.match(get('#filter-status').textContent, /^1 product shown/)
  click('[data-add]', { add: 'serum' })
  assert.equal(get('#cart-count').textContent, '1')
  assert.deepEqual(JSON.parse(saved.get('roseveil-shopping-bag-v1')).items, [
    { id: 'serum', quantity: 1 },
  ])
})

test('Escape inside a modal never dismisses or focuses background search tools', async () => {
  const { get, tools, document } = await mountCatalog()
  tools[0].open = true
  get('#search-panel').hidden = false
  get('#cart-button').listeners.click()
  assert.equal(document.activeElement, get('#cart-title'))
  document.listeners.keydown({
    key: 'Escape',
    preventDefault() {
      assert.fail('Native dialog Escape must remain available')
    },
  })
  assert.equal(tools[0].open, true)
  assert.equal(get('#search-panel').hidden, false)
  assert.equal(document.activeElement, get('#cart-title'))
})

test('Escape affects only the focused search layer and honors consumed keys', async () => {
  const { get, tools, document } = await mountCatalog()
  get('#search-panel').hidden = false
  tools[0].open = true
  tools[0].field.focus()
  document.listeners.keydown({ key: 'Escape', defaultPrevented: true })
  assert.equal(tools[0].open, true)
  document.listeners.keydown({ key: 'Escape', preventDefault() {} })
  assert.equal(document.activeElement, tools[0].summary)
  assert.equal(get('#search-panel').hidden, false)
  get('#search-panel').children = [get('#product-search')]
  get('#product-search').focus()
  document.listeners.keydown({ key: 'Escape', preventDefault() {} })
  assert.equal(get('#search-panel').hidden, true)
  assert.equal(document.activeElement, get('#search-toggle'))
})

test('resetting from a disappearing control and submitting search focus results', async () => {
  const { get, change, document } = await mountCatalog()
  change('#catalog-search', 'input', 'nothing matches')
  get('#empty-reset').focus()
  get('#empty-reset').listeners.click()
  assert.equal(get('#empty-state').hidden, true)
  assert.equal(document.activeElement, get('#products-title'))
  get('#product-search').focus()
  get('#search-form').listeners.submit({ preventDefault() {} })
  assert.equal(document.activeElement, get('#products-title'))
})

test('closing mobile navigation restores focus from the link it hides', async () => {
  const { get, click, document } = await mountCatalog()
  const link = get('#mobile-link')
  get('#main-nav').children = [link]
  link.focus()
  click('[data-category]', { category: 'Hair Care' })
  assert.equal(document.activeElement, get('#menu-toggle'))
})

test('product dialog opening and content replacement focus its stable heading', async () => {
  const { get, click, document } = await mountCatalog()
  click('[data-product]', { product: 'serum' })
  assert.equal(get('#content-dialog').open, true)
  assert.equal(document.activeElement, get('#content-title'))
  get('#old-dialog-button').focus()
  click('[data-product]', { product: 'serum' })
  assert.equal(document.activeElement, get('#content-title'))
})

test('Tab, Shift+Tab, Enter and Space retain native keyboard behavior', async () => {
  const { tools, document } = await mountCatalog()
  tools[0].open = true
  tools[0].field.focus()
  for (const event of [
    { key: 'Tab' },
    { key: 'Tab', shiftKey: true },
    { key: 'Enter' },
    { key: ' ' },
  ]) {
    document.listeners.keydown({
      ...event,
      preventDefault() {
        assert.fail('Native key intercepted')
      },
    })
    assert.equal(document.activeElement, tools[0].field)
    assert.equal(tools[0].open, true)
  }
})

test('equivalent search results reuse product nodes while updating filter text', async () => {
  const { get, change } = await mountCatalog()
  change('#catalog-search', 'input', 'botanical')
  const writes = get('#product-grid').innerHTMLWrites
  change('#catalog-search', 'input', 'BOTANICAL')
  assert.equal(get('#product-grid').innerHTMLWrites, writes)
  assert.equal(get('#product-search').value, 'BOTANICAL')
  assert.match(get('#filter-description').textContent, /BOTANICAL/)
  change('#catalog-search', 'input', 'serum')
  assert.equal(get('#product-grid').innerHTMLWrites, writes + 1)
})

test('product media provides responsive lazy cards and eager dialog images', async () => {
  const { get, click } = await mountCatalog()
  assert.match(get('#product-grid').innerHTML, /srcset="[^"]+-240\.webp 240w/)
  assert.match(get('#product-grid').innerHTML, /loading="lazy" decoding="async"/)
  click('[data-product]', { product: 'serum' })
  assert.match(get('#content-body').innerHTML, /sizes="280px"/)
  assert.match(get('#content-body').innerHTML, /loading="eager" decoding="async"/)
})

test('feature initialization registers one router, one Escape listener and one catalog subscription', async () => {
  const { get, click, state, listenerCounts, fetchCalls, subscriptions } = await mountCatalog()
  assert.equal(listenerCounts.get('click'), 1)
  assert.equal(listenerCounts.get('keydown'), 1)
  assert.equal(subscriptions, 1)
  assert.equal(fetchCalls, 1)
  assert.equal(get('#cart-content').handlers.click.length, 1)
  assert.equal(get('#cart-button').handlers.click.length, 1)
  assert.equal(get('#catalog-retry').handlers.click.length, 1)
  click('[data-add]', { add: 'serum' })
  assert.deepEqual(state.bag.items, [{ id: 'serum', quantity: 1 }])
  click('[data-product]', { product: 'serum' })
  click('[data-add]', { add: 'serum' })
  assert.deepEqual(state.bag.items, [{ id: 'serum', quantity: 2 }])
})

test('real extracted checkout handler clears the persisted bag and promo exactly once', async () => {
  const { get, click, state, saved, document } = await mountCatalog()
  click('[data-add]', { add: 'serum' })
  state.bag.setPromoCode('GLOW20')
  get('#cart-button').listeners.click()
  assert.equal(get('#promo-form').handlers.submit.length, 1)
  get('#cart-content').listeners.click({
    target: { closest: (selector) => (selector === '#checkout-button' ? {} : null) },
  })
  assert.equal(get('#cart-dialog').open, false)
  assert.equal(get('#content-dialog').open, true)
  assert.equal(get('#checkout-form').handlers.submit.length, 1)
  get('#checkout-first').value = 'Demo'
  get('#checkout-form').listeners.submit({ preventDefault() {} })
  assert.deepEqual(state.bag.items, [])
  assert.equal(state.bag.promoCode, '')
  assert.equal(get('#cart-count').textContent, '0')
  assert.equal(document.activeElement, get('#content-title'))
  assert.match(get('#content-body').innerHTML, /Your demo order is complete/)
  const reloaded = createState({
    getItem: (key) => saved.get(key) ?? null,
    setItem() {},
  })
  assert.deepEqual(reloaded.bag.items, [])
  assert.equal(reloaded.bag.promoCode, '')
})

test('rerendered promo forms bind one handler and retain apply/remove focus behavior', async () => {
  const { get, click, state, document } = await mountCatalog()
  click('[data-add]', { add: 'serum' })
  get('#cart-button').listeners.click()
  const originalForm = get('#promo-form')
  get('#promo-code').value = ' glow20 '
  originalForm.listeners.submit({ preventDefault() {} })
  assert.equal(state.bag.promoCode, 'GLOW20')
  assert.notEqual(get('#promo-form'), originalForm)
  assert.equal(get('#promo-form').handlers.submit.length, 1)
  assert.equal(document.activeElement, get('#promo-code'))
  get('#promo-form').listeners.submit({ preventDefault() {} })
  assert.equal(state.bag.promoCode, '')
  assert.equal(get('#promo-form').handlers.submit.length, 1)
  assert.equal(document.activeElement, get('#promo-code'))
})
