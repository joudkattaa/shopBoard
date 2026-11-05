import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import ts from 'typescript'
import { products } from '../server/catalog.ts'

test('emitted production ESM endpoint serves HTTP 200 and the exact catalog without TS sources', async (t) => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const output = await mkdtemp(path.join(tmpdir(), 'roseveil-api-'))
  t.after(() => rm(output, { recursive: true, force: true }))
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile)
  assert.equal(config.error, undefined)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  assert.deepEqual(parsed.errors, [])
  const program = ts.createProgram([path.join(root, 'api/products.ts')], {
    ...parsed.options,
    noEmit: false,
    rootDir: root,
    outDir: output,
  })
  const result = program.emit()
  const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics]
  assert.deepEqual(
    diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')),
    [],
  )
  await writeFile(path.join(output, 'package.json'), '{"type":"module"}')
  // Import emitted JS in isolation: the source catalog.ts does not exist here.
  const { default: handler } = await import(
    pathToFileURL(path.join(output, 'api/products.js')).href
  )
  const server = createServer(async (request, response) => {
    try {
      const result = await handler.fetch(
        new Request('http://localhost' + request.url, { method: request.method }),
      )
      response.writeHead(result.status, Object.fromEntries(result.headers))
      response.end(Buffer.from(await result.arrayBuffer()))
    } catch {
      response.writeHead(500).end()
    }
  })
  t.after(() => new Promise((resolve) => server.close(resolve)))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}/api/products`
  for (const query of ['', '?error=500&empty=1&delay=3000']) {
    const response = await fetch(url + query)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /application\/json/)
    assert.deepEqual(await response.json(), { items: products, total: 30 })
  }
})
