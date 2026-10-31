import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeTheme } from '../src/ui.js'
import { createState } from '../src/state.js'

function mount(saved, blocked = false) {
  const values = new Map(saved === undefined ? [] : [['roseveil-theme', saved]])
  const toggle = {
    attributes: {},
    setAttribute(key, value) {
      this.attributes[key] = value
    },
    addEventListener(event, handler) {
      this[event] = handler
    },
  }
  const meta = {
    setAttribute(key, value) {
      this[key] = value
    },
  }
  const document = {
    documentElement: { dataset: {} },
    querySelector: (selector) => (selector === '#theme-toggle' ? toggle : meta),
  }
  const storage = {
    getItem: (key) => {
      if (blocked) throw Error('Storage unavailable')
      return values.get(key) ?? null
    },
    setItem: (key, value) => {
      if (blocked) throw Error('Storage unavailable')
      values.set(key, value)
    },
  }
  initializeTheme(createState(storage), document)
  return { document, toggle, values, meta }
}

test('light is the default; the toggle persists dark and restores light', () => {
  const { document, toggle, values, meta } = mount()
  assert.equal(document.documentElement.dataset.theme, 'light')
  assert.equal(toggle.attributes['aria-pressed'], 'false')
  toggle.click()
  assert.equal(document.documentElement.dataset.theme, 'dark')
  assert.equal(values.get('roseveil-theme'), 'dark')
  assert.equal(toggle.attributes['aria-label'], 'Switch to light mode')
  assert.equal(toggle.attributes['aria-pressed'], 'true')
  assert.equal(meta.content, '#4B101F')
  toggle.click()
  assert.equal(values.get('roseveil-theme'), 'light')
  assert.equal(meta.content, '#fffafb')
})

test('saved dark preference loads and unknown preferences default to light', () => {
  assert.equal(mount('dark').document.documentElement.dataset.theme, 'dark')
  assert.equal(mount('invalid').document.documentElement.dataset.theme, 'light')
})

test('rapid toggles use current state while view-transition callbacks are deferred', () => {
  const { document, toggle, values } = mount()
  const pending = []
  document.startViewTransition = (callback) => pending.push(callback)
  toggle.click({ detail: 1 })
  toggle.click({ detail: 1 })
  assert.equal(values.get('roseveil-theme'), 'light')
  // Even if the browser runs callbacks late, they must paint the latest selection.
  pending.reverse().forEach((callback) => callback())
  assert.equal(document.documentElement.dataset.theme, 'light')
  assert.equal(toggle.attributes['aria-pressed'], 'false')
})

test('theme switching remains usable when localStorage reads and writes fail', () => {
  const { document, toggle } = mount(undefined, true)
  assert.equal(document.documentElement.dataset.theme, 'light')
  assert.doesNotThrow(() => toggle.click())
  assert.equal(document.documentElement.dataset.theme, 'dark')
})

test('dark palette text and accent combinations meet normal-text contrast', () => {
  const luminance = (hex) =>
    hex
      .match(/../g)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
      .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0)
  for (const [foreground, background] of [
    ['f9eae5', '21070d'],
    ['f9eae5', '4b101f'],
    ['e5b4aa', '4b101f'],
    ['d7b5b2', '4b101f'],
    ['21070d', 'e5b4aa'],
  ]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b)
    assert.ok((values[1] + 0.05) / (values[0] + 0.05) >= 4.5, `${foreground} on ${background}`)
  }
})
