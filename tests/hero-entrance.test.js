import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeHeroEntrance } from '../src/ui.ts'

function mountHero({ reduced = false, loaded = true } = {}) {
  const node = (initial = {}) => ({
    attributes: { ...initial },
    starts: 0,
    setAttribute(key, value) {
      this.attributes[key] = value
      if (key === 'data-entrance' && value === 'playing') this.starts++
    },
    removeAttribute(key) {
      delete this.attributes[key]
    },
  })
  const images = Array.from({ length: 5 }, () => ({
    complete: loaded,
    naturalWidth: loaded ? 1254 : 0,
    listeners: {},
    addEventListener(name, callback) {
      this.listeners[name] = callback
    },
  }))
  const scene = node({ hidden: '' })
  scene.querySelectorAll = () => images
  const fallback = node()
  const preference = {
    matches: reduced,
    addEventListener(name, callback) {
      this.change = callback
    },
  }
  const observers = []
  const document = {
    querySelector: (selector) => (selector === '.hero-layered-scene' ? scene : fallback),
    defaultView: {
      matchMedia: () => preference,
      IntersectionObserver: class {
        constructor(callback) {
          this.callback = callback
          observers.push(this)
        }
        observe(target) {
          this.target = target
        }
        disconnect() {
          this.disconnected = true
        }
      },
    },
  }
  initializeHeroEntrance(document)
  const visibility = (isIntersecting, intersectionRatio) =>
    observers.at(-1).callback([{ target: scene, isIntersecting, intersectionRatio }])
  return { scene, fallback, images, preference, observers, visibility }
}

test('hero enters once per visit and only rearms after fully leaving the viewport', () => {
  const { scene, fallback, visibility } = mountHero()
  assert.ok('hidden' in fallback.attributes)
  assert.ok(!('hidden' in scene.attributes))
  visibility(true, 0.05)
  assert.equal(scene.starts, 0)
  visibility(true, 0.5)
  assert.equal(scene.starts, 1)
  visibility(true, 0.9)
  visibility(true, 0.05)
  visibility(true, 0.5)
  assert.equal(scene.starts, 1)
  visibility(false, 0)
  visibility(true, 0.5)
  assert.equal(scene.starts, 2)
})

test('hero keeps its static fallback until every layer has loaded', () => {
  const { images, scene, fallback, observers } = mountHero({ loaded: false })
  for (const image of images.slice(0, -1)) {
    image.complete = true
    image.naturalWidth = 1254
    image.listeners.load()
  }
  assert.equal(observers.length, 0)
  assert.ok('hidden' in scene.attributes)
  assert.ok(!('hidden' in fallback.attributes))
  images.at(-1).complete = true
  images.at(-1).naturalWidth = 1254
  images.at(-1).listeners.load()
  assert.equal(observers.length, 1)
})

test('reduced motion remains static and changes are handled while the page is open', () => {
  const { preference, scene, fallback, observers, visibility } = mountHero({ reduced: true })
  assert.equal(observers.length, 0)
  assert.ok(!('hidden' in fallback.attributes))
  preference.matches = false
  preference.change()
  visibility(true, 0.5)
  assert.equal(scene.starts, 1)
  preference.matches = true
  preference.change()
  assert.ok(observers[0].disconnected)
  assert.ok('hidden' in scene.attributes)
  assert.ok(!('hidden' in fallback.attributes))
})

test('a failed layer restores the complete static hero and prevents partial scenes', () => {
  const { images, scene, fallback, observers } = mountHero()
  images[0].listeners.error()
  assert.ok(observers[0].disconnected)
  assert.ok('hidden' in scene.attributes)
  assert.ok(!('hidden' in fallback.attributes))
  images[1].listeners.load()
  assert.equal(observers.length, 1)
})
