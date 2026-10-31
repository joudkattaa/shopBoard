import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { products } from '../src/data.js'

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const metrics = JSON.parse(
  fs.readFileSync(new URL('../docs/image-optimization-metrics.json', import.meta.url), 'utf8'),
)
const asset = (name) => new URL(`../public/roseveil/${name}`, import.meta.url)

// VP8L contains exact intrinsic dimensions, so descriptors cannot silently drift.
function webpSize(file) {
  const bytes = fs.readFileSync(file)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset + 4)
    if (bytes.toString('ascii', offset, offset + 4) === 'VP8L') {
      const bits = bytes.readUInt32LE(offset + 9)
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)]
    }
    offset += 8 + length + (length % 2)
  }
  assert.fail('Expected a lossless WebP image')
}

test('all delivered image variants exist with accurate dimensions and smaller full-size bytes', () => {
  for (const item of metrics) {
    assert.deepEqual(webpSize(asset(`${item.name}.webp`)), [item.width, item.height])
    assert.equal(fs.statSync(asset(`${item.name}.webp`)).size, item.webpBytes)
    assert.ok(item.webpBytes < item.pngBytes)
    assert.ok(fs.existsSync(asset(`${item.name}.png`)), 'Preserve original image')
    for (const variant of item.variants) {
      assert.deepEqual(webpSize(asset(variant.file)), [variant.width, variant.height])
      assert.equal(fs.statSync(asset(variant.file)).size, variant.bytes)
    }
  }
  for (const product of products) {
    const item = metrics.find((entry) => entry.name === product.image)
    assert.ok(item)
    assert.deepEqual([item.width, item.height], [1254, 1254])
    assert.deepEqual(
      item.variants.map((entry) => entry.width),
      [240, 480, 800],
    )
  }
})

test('static images have valid responsive paths, dimensions and correct loading priority', () => {
  const preload = html.match(/<link\b[^>]*rel="preload"[^>]*>/)[0]
  const hero = html.match(/<img\b[^>]*class="hero-image"[^>]*>/)[0]
  assert.equal(preload.match(/imagesrcset="([^"]+)"/)[1], hero.match(/srcset="([^"]+)"/)[1])
  assert.equal(preload.match(/imagesizes="([^"]+)"/)[1], hero.match(/sizes="([^"]+)"/)[1])
  for (const [tag] of html.matchAll(/<img\b[\s\S]*?>/g)) {
    const src = tag.match(/src="([^"]+)"/)[1]
    assert.ok(fs.existsSync(new URL(`../public${src}`, import.meta.url)))
    assert.match(tag, /width="\d+"/)
    assert.match(tag, /height="\d+"/)
    assert.match(tag, /decoding="async"/)
    const srcset = tag.match(/srcset="([^"]+)"/)[1]
    for (const entry of srcset.split(',')) {
      const [path, descriptor] = entry.trim().split(/\s+/)
      assert.equal(
        webpSize(new URL(`../public${path}`, import.meta.url))[0],
        Number.parseInt(descriptor),
      )
    }
    if (tag.includes('class="hero-image"')) {
      assert.match(tag, /fetchpriority="high"/)
      assert.doesNotMatch(tag, /loading="lazy"/)
      assert.match(tag, /width="1774"\s+height="887"/)
    } else assert.match(tag, /loading="lazy"/)
  }
  assert.match(html, /rel="preconnect" href="https:\/\/fonts.gstatic.com" crossorigin/)
  const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /@import/)
  for (const id of ['main', 'products-title', 'cart-title', 'content-title'])
    assert.ok(html.includes(`id="${id}" tabindex="-1"`))
})
