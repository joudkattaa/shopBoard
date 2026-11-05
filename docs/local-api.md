# ROSEVEIL local products API

Use Node 24 and run `npm install`, then `npm run dev`. One Vite process serves the website at http://127.0.0.1:5173/ and `GET http://127.0.0.1:5173/api/products`.

`server/catalog.ts` is the only maintained catalog. The server middleware imports it directly and returns `{ items, total }` with the exact 30 products. IDs, image stems, categories, names, descriptions, sizes and prices in cents are unchanged. No instructor products or external API requests are used.

The frontend validates the response schema, category values, safe IDs/image stems and integer prices, rejects duplicate IDs and exposes defensive snapshots through application state and `state.bag`. No browser module imports the server catalog. The UI passes fetched products into the existing pure lookup, search, filter, sort and cart functions. Saved bag IDs and quantities are shape-validated before loading and reconciled against a non-empty fetched catalog afterward. Failures and empty responses leave persisted selections intact; if no catalog has loaded, the bag explains that prices are unavailable and checkout is blocked. There is no duplicate maintained catalog.

## Development checks

| State            | Website URL                           | Direct API URL                                |
| ---------------- | ------------------------------------- | --------------------------------------------- |
| Success          | http://127.0.0.1:5173/                | http://127.0.0.1:5173/api/products            |
| Delayed response | http://127.0.0.1:5173/?api-delay=1500 | http://127.0.0.1:5173/api/products?delay=1500 |
| HTTP 500         | http://127.0.0.1:5173/?api-error=500  | http://127.0.0.1:5173/api/products?error=500  |
| Empty response   | http://127.0.0.1:5173/?api-empty=1    | http://127.0.0.1:5173/api/products?empty=1    |

Delay is capped at 3000 milliseconds. These query switches affect only the current development request; they do not edit product data. Retry uses the same URL, so an error simulation deliberately keeps failing until the flag is removed and the page reloaded. To test recovery with the same Try again button, use the normal page, block `/api/products` in Chrome DevTools, reload, unblock the request and activate Try again. Check keyboard focus, light/dark themes, narrow/wide layouts and existing bag persistence after reload.

## Build and preview

Run `npm run build`, then `npm run preview`. The website is http://127.0.0.1:4173/ and its endpoint is http://127.0.0.1:4173/api/products. Preview ignores all delay/error/empty switches. It serves the real catalog even if test query parameters are present.

The Vite middleware handles local development/preview. On Vercel, `api/products.ts` serves the same endpoint from the same catalog. Production frontend builds omit simulation query handling, and the Vercel endpoint ignores simulation parameters even when called directly. The `dist/` directory alone cannot serve this endpoint on a static host: Vercel needs the project root, including `api/` and `server/`. See [Vercel deployment preparation](vercel-deployment.md). No deployment is performed here.
