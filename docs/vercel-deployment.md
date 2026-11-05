# Vercel deployment preparation

Preparation is local only. No deployment, account connection, commit or push has been performed.

## Architecture and routing

- `server/catalog.ts` remains the only product data source: all 30 records are unchanged.
- Vite development and preview use `server/products-api.js`; Vercel uses `api/products.ts`, a Node.js Web Standard function importing the catalog directly.
- Both return `{ items, total }` from `GET /api/products`. Other methods return JSON with status 405 and `Allow: GET`. Responses use `Cache-Control: no-store`.
- The frontend retains its same-origin `/api/products` URL and runtime response validation. No API host, environment variables, secrets or CORS configuration are needed.
- `vercel.json` selects the Vite preset only. Vercel discovers the root `api/products.ts` function separately from the static `dist/` output. There are no rewrites, redirects or legacy builds rules. The current site uses hash navigation, so a catch-all SPA fallback is unnecessary and cannot intercept the API.
- Development simulations stay in Vite middleware. The production handler never imports that middleware or reads simulation flags. Vite removes development-only frontend query handling from production builds. Preview also ignores simulations. Loading, error/retry, empty and success rendering remain available for actual API responses.
- The handler is included in strict TypeScript checks and ESLint. No dependencies were added. Node 24 is pinned through `package.json` and its lockfile to match local testing.
- `.vercel/` is ignored to keep future local account/project metadata outside version control.

## Exact project settings

When you choose to deploy later, supply the entire project root, including `api/`, `server/`, `public/`, `src/`, the package files and `vercel.json`. Do not upload only `dist/`.

| Setting               | Value                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Root Directory        | Directory containing this project's `package.json` (`.` if repository root) |
| Framework Preset      | Vite                                                                        |
| Install Command       | `npm ci`                                                                    |
| Build Command         | `npm run build`                                                             |
| Output Directory      | `dist`                                                                      |
| Node.js Version       | `24.x` (also pinned in `package.json`)                                      |
| Environment Variables | None required                                                               |
| Development Command   | `npm run dev` for local Vite work                                           |

Do not configure `npm run preview` as a production server. Vercel serves static assets and the function itself. Keep development dependencies available during installation because Vite and TypeScript are build tools.

## Remaining manual steps

1. Review the existing uncommitted work together with these preparation changes. When ready, separately authorize and perform your preferred Vercel account/project setup and deployment workflow.
2. Confirm the settings above before deploying. Do not add a catch-all rewrite to `/index.html`.
3. After a future deployment, open `/api/products` directly: expect HTTP 200, JSON content type, `total: 30` and the exact catalog records. Repeat with `?error=500&empty=1&delay=3000`; expect the same immediate successful catalog. A POST should return 405.
4. Open the storefront on narrow and wide screens. Check images, search, filters, sorting, product dialogs, bag persistence, GLOW20, theme switching and hero animations. Block the API request in browser developer tools to check error/retry; throttle the network to observe loading. Simulated empty responses remain available locally through `npm run dev`.

Local tests validate the handler and configuration; hosted routing must still be checked after a separately authorized deployment. Initial preparation did not use the Vercel CLI. The later production incident investigation used the existing CLI login for read-only runtime logs and ran the cached Node function builder locally; it did not deploy or connect an account.

## Local verification performed

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` and `npm test` passed (63 tests).
- HTTP checks against local development (5173) and production preview (4173) confirmed the page loads, `/api/products` returns JSON matching all 30 catalog records, and POST returns 405. Preview ignored all simulation flags.
- The production JavaScript bundle was checked to confirm simulation query handling was removed.
- Regression coverage includes catalog states/retry, cart persistence and pricing, search/filter/sort controls, theme transitions, animations and image integrity. The VM-based UI harness now applies Vite's production environment replacement.
- No visual styling, markup, image or animation changes were made. Interactive browser layout, native validation and keyboard checks were not performed during this preparation; retain the manual browser checks above.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node.js functions and Web Standard handlers](https://vercel.com/docs/functions/runtimes/node-js), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Production API incident: November 5, 2026

Read-only CLI runtime logs for the existing production deployment confirmed Node.js 24 failed before invoking the handler:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/catalog.ts'
imported from /var/task/api/products.js
```

The emitted ESM handler retained the source `.ts` import path. The production function needs the emitted JavaScript catalog. `allowImportingTsExtensions` allows source imports during no-emit typechecking; it does not itself rewrite them for deployment. Node 24, the Web Standard handler export, Vite routing and product contents did not require changes.

The fix adds `rewriteRelativeImportExtensions: true` to `tsconfig.json`. The handler source and single catalog source remain unchanged. Using the already cached Vercel CLI 65.11.0's `@vercel/node` builder locally with dependency installation skipped confirmed the function packages both `api/products.js` and `server/catalog.js`, and the former imports `../server/catalog.js`. No `includeFiles` workaround or additional dependency is needed. See [TypeScript's compiler option reference](https://www.typescriptlang.org/tsconfig/rewriteRelativeImportExtensions.html).

`tests/production-api.test.js` emits the real API dependency graph using the project's TypeScript settings into an isolated temporary directory containing no `.ts` sources. It imports that JavaScript handler, serves it through a local HTTP adapter and asserts status 200, JSON content type, `total: 30` and deep equality with every source product, including with development simulation parameters. The test failed before the compiler fix and passed afterward. Existing source-only handler tests could not detect this emission problem.

Files changed for this incident: `tsconfig.json` (compiler fix), `tests/production-api.test.js` (production-emission and HTTP regression) and this guide (diagnosis and verification). No frontend, handler, catalog, image, Vite or Vercel routing changes were needed.

After the fix, typecheck, lint, repository formatting checks, Vite build and all 64 tests passed. The frontend build retained the same asset names and sizes as before the fix.

After manually deploying the reviewed files, verify the live response against the source catalog from the project root in PowerShell:

```powershell
@'
import assert from 'node:assert/strict'
import { products } from './server/catalog.ts'
const base = 'https://roseveil-cosmetics.vercel.app/api/products'
for (const query of ['', '?error=500&empty=1&delay=3000']) {
  const response = await fetch(base + query)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await response.json(), { items: products, total: 30 })
}
console.log('Production API verified: HTTP 200 and exact 30-product catalog')
'@ | node --input-type=module
```

Review Vercel runtime logs after the requests to confirm the module-resolution error is gone. Local verification cannot change the currently deployed failure; manual redeployment is required.
