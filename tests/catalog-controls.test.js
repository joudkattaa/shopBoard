import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import * as store from '../src/logic.js'
import { createState } from '../src/state.js'

// Exercise the real event handlers without adding a DOM dependency.
function mountCatalog() {
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
        this.listeners[name] = handler
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
      this.listeners[name] = handler
    },
  }
  const saved = new Map()
  const source =
    fs
      .readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8')
      .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\r?\n/gm, '')
      .replaceAll('export function', 'function') + '\ninitializeUI(state)'
  vm.runInNewContext(source, {
    ...store,
    document,
    state: createState({
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    }),
    localStorage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    },
    setTimeout: () => 1,
    clearTimeout() {},
  })
  const change = (selector, event, value) => {
    const control = get(selector)
    control.value = value
    control.listeners[event]({ target: control })
  }
  const click = (selector, dataset) =>
    document.listeners.click({
      target: { closest: (match) => (match === selector ? { dataset } : null) },
    })
  return { get, change, click, saved, links, tools, document }
}

test('real controls combine, synchronize category links, and clear all state', () => {
  const { get, change, click, links } = mountCatalog()
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

test('catalog popup opening focuses the field and Escape restores the trigger', () => {
  const { tools, document } = mountCatalog()
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

test('header search stays synchronized and adding from filtered results still saves the bag', () => {
  const { get, change, click, saved } = mountCatalog()
  change('#product-search', 'input', 'radiance')
  assert.equal(get('#catalog-search').value, 'radiance')
  assert.match(get('#filter-status').textContent, /^1 product shown/)
  click('[data-add]', { add: 'serum' })
  assert.equal(get('#cart-count').textContent, 1)
  assert.deepEqual(JSON.parse(saved.get('roseveil-shopping-bag-v1')).items, [
    { id: 'serum', quantity: 1 },
  ])
})

test('Escape inside a modal never dismisses or focuses background search tools', () => {
  const { get, tools, document } = mountCatalog()
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

test('Escape affects only the focused search layer and honors consumed keys', () => {
  const { get, tools, document } = mountCatalog()
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

test('resetting from a disappearing control and submitting search focus results', () => {
  const { get, change, document } = mountCatalog()
  change('#catalog-search', 'input', 'nothing matches')
  get('#empty-reset').focus()
  get('#empty-reset').listeners.click()
  assert.equal(get('#empty-state').hidden, true)
  assert.equal(document.activeElement, get('#products-title'))
  get('#product-search').focus()
  get('#search-form').listeners.submit({ preventDefault() {} })
  assert.equal(document.activeElement, get('#products-title'))
})

test('closing mobile navigation restores focus from the link it hides', () => {
  const { get, click, document } = mountCatalog()
  const link = get('#mobile-link')
  get('#main-nav').children = [link]
  link.focus()
  click('[data-category]', { category: 'Hair Care' })
  assert.equal(document.activeElement, get('#menu-toggle'))
})

test('product dialog opening and content replacement focus its stable heading', () => {
  const { get, click, document } = mountCatalog()
  click('[data-product]', { product: 'serum' })
  assert.equal(get('#content-dialog').open, true)
  assert.equal(document.activeElement, get('#content-title'))
  get('#old-dialog-button').focus()
  click('[data-product]', { product: 'serum' })
  assert.equal(document.activeElement, get('#content-title'))
})

test('Tab, Shift+Tab, Enter and Space retain native keyboard behavior', () => {
  const { tools, document } = mountCatalog()
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

test('equivalent search results reuse product nodes while updating filter text', () => {
  const { get, change } = mountCatalog()
  change('#catalog-search', 'input', 'botanical')
  const writes = get('#product-grid').innerHTMLWrites
  change('#catalog-search', 'input', 'BOTANICAL')
  assert.equal(get('#product-grid').innerHTMLWrites, writes)
  assert.equal(get('#product-search').value, 'BOTANICAL')
  assert.match(get('#filter-description').textContent, /BOTANICAL/)
  change('#catalog-search', 'input', 'serum')
  assert.equal(get('#product-grid').innerHTMLWrites, writes + 1)
})

test('product media provides responsive lazy cards and eager dialog images', () => {
  const { get, click } = mountCatalog()
  assert.match(get('#product-grid').innerHTML, /srcset="[^"]+-240\.webp 240w/)
  assert.match(get('#product-grid').innerHTML, /loading="lazy" decoding="async"/)
  click('[data-product]', { product: 'serum' })
  assert.match(get('#content-body').innerHTML, /sizes="280px"/)
  assert.match(get('#content-body').innerHTML, /loading="eager" decoding="async"/)
})
