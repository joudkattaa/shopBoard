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
      innerHTML: '',
      textContent: '',
      hidden: false,
      attributes: {},
      listeners: {},
      classList: { toggle() {}, remove() {} },
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
    }
  }
  const get = (selector) => {
    if (!elements.has(selector)) elements.set(selector, element())
    return elements.get(selector)
  }
  const document = {
    listeners: {},
    documentElement: element(),
    querySelector: get,
    querySelectorAll: (selector) => (selector.includes('[data-category]') ? links : []),
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
  return { get, change, click, saved, links }
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
