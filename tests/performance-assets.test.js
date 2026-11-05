import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { products } from '../server/catalog.ts'

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const metrics = JSON.parse(
  fs.readFileSync(new URL('../docs/image-optimization-metrics.json', import.meta.url), 'utf8'),
)
const asset = (name) => new URL(`../public/roseveil/${name}`, import.meta.url)
const manifest = JSON.parse(
  fs.readFileSync(new URL('../docs/asset-manifest.json', import.meta.url), 'utf8'),
)

// VP8L contains exact intrinsic dimensions, so descriptors cannot silently drift.
function imageSize(file) {
  const bytes = fs.readFileSync(file)
  if (bytes.toString('ascii', 1, 4) === 'PNG') {
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      assert.equal(bytes[offset], 0xff)
      const marker = bytes[offset + 1]
      const length = bytes.readUInt16BE(offset + 2)
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        return [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)]
      }
      offset += 2 + length
    }
    assert.fail('Expected JPEG dimensions')
  }
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
    assert.deepEqual(imageSize(asset(`${item.name}.webp`)), [item.width, item.height])
    assert.equal(fs.statSync(asset(`${item.name}.webp`)).size, item.webpBytes)
    assert.ok(item.webpBytes < item.pngBytes)
    for (const variant of item.variants) {
      assert.deepEqual(imageSize(asset(variant.file)), [variant.width, variant.height])
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

test('every public asset is referenced, intact and dimensionally correct; hero layers preserve alpha', () => {
  const expected = new Set(['roseveil-mark.svg'])
  for (const product of products)
    for (const suffix of ['.webp', '-240.webp', '-480.webp', '-800.webp'])
      expected.add(`roseveil/${product.image}${suffix}`)
  for (const match of html.matchAll(/\/(roseveil\/[a-zA-Z0-9-]+\.(?:jpg|webp))/g))
    expected.add(match[1])
  const actual = fs
    .readdirSync(new URL('../public/', import.meta.url), { recursive: true })
    .filter((file) => fs.statSync(new URL(`../public/${file}`, import.meta.url)).isFile())
    .map((file) => file.replaceAll('\\', '/'))
  assert.deepEqual([...actual].sort(), [...expected].sort())
  assert.deepEqual(manifest.map((entry) => entry.file).sort(), [...actual].sort())
  for (const entry of manifest) {
    const file = new URL(`../public/${entry.file}`, import.meta.url)
    const bytes = fs.readFileSync(file)
    assert.equal(bytes.length, entry.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256)
    if (entry.width) assert.deepEqual(imageSize(file), [entry.width, entry.height])
    if (entry.file.includes('hero-layer-')) {
      assert.equal(entry.hasAlpha, true)
      assert.equal(bytes.toString('ascii', 12, 16), 'VP8L')
      assert.equal((bytes.readUInt32LE(21) >>> 28) & 1, 1)
    }
  }
})

test('static images have valid responsive paths, dimensions and correct loading priority', () => {
  const preload = html.match(/<link\b[^>]*rel="preload"[^>]*>/)[0]
  const hero = html.match(/<img\b[^>]*class="hero-image"[^>]*>/)[0]
  const normalizeSrcset = (value) =>
    value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
  assert.equal(
    normalizeSrcset(preload.match(/imagesrcset="([^"]+)"/)[1]),
    normalizeSrcset(hero.match(/srcset="([^"]+)"/)[1]),
  )
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
        imageSize(new URL(`../public${path}`, import.meta.url))[0],
        Number.parseInt(descriptor),
      )
    }
    if (tag.includes('class="hero-image"')) {
      assert.match(tag, /fetchpriority="high"/)
      assert.doesNotMatch(tag, /loading="lazy"/)
      const [, width, height] = tag.match(/width="(\d+)"\s+height="(\d+)"/)
      assert.deepEqual(imageSize(new URL(`../public${src}`, import.meta.url)), [
        Number(width),
        Number(height),
      ])
    } else if (/\/roseveil\/hero-(?:stage|layer-)/.test(src)) {
      assert.match(tag, /loading="eager"/)
    } else assert.match(tag, /loading="lazy"/)
  }
  assert.match(html, /rel="preconnect" href="https:\/\/fonts.gstatic.com" crossorigin/)
  const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /@import/)
  for (const id of ['main', 'products-title', 'cart-title', 'content-title'])
    assert.ok(html.includes(`id="${id}" tabindex="-1"`))
})
