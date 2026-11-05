import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('collection search, category and sort use compact in-flow controls with associated labels', () => {
  const html = read('index.html')
  const tools = [...html.matchAll(/<details class="([^"]+)">([\s\S]*?)<\/details>/g)].filter(
    ([, classes]) => classes.split(' ').includes('catalog-tool'),
  )
  assert.equal(tools.length, 3)
  assert.match(tools[0][1], /\bcatalog-search-tool\b/)
  assert.match(tools[0][2], /class="catalog-popup catalog-search-popup"/)
  assert.match(tools[0][2], /label for="catalog-search"/)
  assert.match(tools[0][2], /id="catalog-search"/)
  for (const tool of tools.slice(1)) {
    assert.doesNotMatch(tool[1] + tool[2], /catalog-search-(?:tool|popup)/)
    assert.match(tool[2], /class="catalog-popup"/)
  }
  const css = read('src/responsive.css')
  assert.match(css, /\.catalog-tools \.catalog-popup\s*\{[^}]*position:\s*static;/)
  assert.match(css, /\.catalog-tool\[open\]\s*\{[^}]*min-width:\s*0;/)
  assert.match(css, /\.catalog-tools\s*\{[^}]*max-width:\s*100%;/)
  assert.match(css, /\.catalog-tool\[open\]\s*\{[^}]*align-items:\s*center;/)
  assert.match(tools[1][2], /label for="category-select"/)
  assert.match(tools[2][2], /label for="price-sort"/)
})
