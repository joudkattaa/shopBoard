# ROSEVEIL Cosmetics — ShopBoard

An educational beauty storefront with a blush, beige, burgundy and rose-gold identity. ROSEVEIL combines an interactive product catalog with a layered, animated hero and a compact responsive footer.

## Stack

Vite, strict TypeScript, semantic HTML5 and mobile-first CSS3; no UI framework or animation library. Cormorant Garamond and DM Sans are loaded through Google Fonts. Development tools include ESLint, Prettier, Husky, lint-staged and Node's built-in test runner.

## Getting started

Use **Node.js 24 with npm**, matching the environment used for the TypeScript-based regression tests.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Installation also runs the Husky prepare script.

| Command                | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`          | Start the Vite development server                                             |
| `npm run typecheck`    | Run strict TypeScript checks without emitting files                           |
| `npm run build`        | Create the production build in `dist/`                                        |
| `npm run preview`      | Serve the production build locally after building                             |
| `npm run lint`         | Run ESLint for TypeScript source and JavaScript tooling/tests, then typecheck |
| `npm run format`       | Format supported project files with Prettier                                  |
| `npm run format:check` | Check formatting without rewriting files                                      |
| `npm test`             | Run `node --test tests/*.test.js`                                             |

ESLint checks frontend TypeScript, the server catalog and the Vercel function through `src/**/*.ts`, `server/**/*.ts` and `api/**/*.ts` using `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`. The lint command runs `eslint .` followed by `npm run typecheck`; typecheck runs `tsc --noEmit` for strict compiler checks.

The pre-commit hook runs the configured lint-staged tasks. Formatting and staged-file tasks may rewrite files; typecheck does not.

## Working features

- **Catalog:** 30 products across seven categories, with five varied products initially shown and a View All control.
- **Discovery:** immediate case-insensitive name search, synchronized category controls, ascending/descending price sorting, result counts, empty states and Clear Filters.
- **Product dialogs:** existing imagery, descriptions, sizes and Add to Bag actions.
- **Shopping bag:** quantity changes, removal, totals and a maximum of 99 per item. Bag contents and the promo code persist in localStorage when available; invalid stored entries are revalidated.
- **Promotions:** `GLOW20` deducts 20% from merchandise. Demo shipping is $5.95 for non-empty bags, or free when merchandise exceeds $50 after discounts.
- **Themes and layout:** saved light/dark preference, responsive navigation and grids, visible keyboard focus and native dialogs.
- **Layered hero:** four transparent product layers over a beige marble/floral background enter in sequence, settle and replay after the artwork fully leaves and re-enters the viewport. Reduced motion, image failures or unsupported observer APIs retain a complete static image.

## Demonstration scope

The cosmetics catalog is fetched from the REST endpoint `GET /api/products`, backed directly by `server/catalog.ts`. Vite middleware serves the endpoint in local development and preview; a Vercel Function serves it in production. The endpoint returns the exact 30 ROSEVEIL products with unchanged IDs, prices, categories and image references. The existing grid shows loading, error/retry, empty and success states. Cart validation uses the fetched catalog; saved IDs and quantities survive pending, failed and empty requests. Prices and checkout become available once product data has loaded. No external instructor API, payment processor, authentication, email delivery or fulfillment service is connected.

Checkout, registration, contact and newsletter forms provide local demonstrations with native validation. Newsletter signup validates a required email address and displays a local confirmation; it sends and saves no address. Demo checkout clears the bag but places no order. Registration keeps only a name in memory until refresh; its password is not read, saved or transmitted by application code. Use a made-up password.

Only bag selections, the promo code and theme preference are persisted. Google Fonts makes external font-loading requests. `src/shared/api/client.ts` handles HTTP/network errors and validated JSON; `products.api.ts` validates the catalog response. The shared toast file remains an empty placeholder. See [local API setup and test URLs](docs/local-api.md) for development simulations and preview, and [Vercel deployment preparation](docs/vercel-deployment.md) for exact settings and manual deployment checks. Vercel's `api/products.ts` imports the same catalog without development simulations. ROSEVEIL is deployed on Vercel at [roseveil-cosmetics.vercel.app](https://roseveil-cosmetics.vercel.app).

## Project structure

```text
index.html                         Semantic page markup and entry point
src/
  main.ts                          Imports styles, creates state, initializes UI
  state.ts                         Catalog coordination, state.bag, theme and session profile
  ui.ts                            Shared UI helpers, dialogs, general forms, theme and hero
  style.css                        Base visual styles
  theme.css                        Theme presentation
  responsive.css                   Responsive layouts, hero and footer refinements
  modules/
    products/products.ui.ts        Catalog states, cards, details, search/filter/sort
    products/products.api.ts       Catalog API fetch and response validation
    products/products.logic.ts     Product lookup, search, filtering and sorting
    products/products.types.ts     Product, category and sort contracts
    cart/cart.ui.ts                Bag, quantities, promo forms and demo checkout
    cart/cart.state.ts             Bag actions, promo, persistence and legacy migration
    cart/cart.logic.ts             Cart validation and totals
    cart/cart.types.ts             Cart and totals contracts
    state/state.types.ts           State, profile, theme and storage contracts
  shared/                          Typed API client, UI helper types and reserved toast
server/catalog.ts                  Sole server-owned product catalog
server/products-api.js             Local REST middleware using server/catalog.ts
api/products.ts                    Production Vercel Function using the shared catalog
vite.config.js                     Development/preview API registration
vercel.json                        Vercel framework configuration
public/                            Static images and brand assets
tests/                             Behavior, architecture, asset and hero regression tests
docs/                              Architecture, design details and coursework evidence
```

DOM work belongs to `ui.ts`, `products.ui.ts` and `cart.ui.ts`. Shared formatting, escaping, responsive media and DOM helpers are implemented once in `ui.ts` and injected into feature initializers through the type-only `shared/ui/ui.types.ts` contract. One document click router and Escape coordinator stay in `ui.ts`; products UI owns the single catalog subscription. `state.ts` coordinates the catalog, theme and session profile; its `state.bag` references the cart module directly with live getters. `cart.state.ts` owns bag persistence, promo codes and actions, reads the current catalog through a callback, and never imports application state. Product/cart logic stays pure and is imported directly. See [architecture](docs/architecture.md).

## Design and documentation

Product imagery and hero layers were generated/edited using OpenAI ImageGen for this concept store. Product cards use responsive lossless WebP images; the hero combines JPEG backgrounds/fallbacks with transparent lossless WebP layers. Unused original PNGs and the retired flattened hero were removed after decoded-pixel verification. See [the shipped asset manifest](docs/asset-manifest.json).

- [Design rationale and process](DESIGN.md)
- [Architecture and module ownership](docs/architecture.md)
- [Palette and image attribution](docs/rose-dusk-palette.md)
- [TypeScript migration](docs/typescript-migration.md)
- [Historical performance report](docs/performance-optimization.md)
- [Debugging log](debugging-log.md)

Historical coursework reports retain their original file names and results; they are not current verification reports. The separate instructor debugging lab remains documented as incomplete because its files were unavailable.

Run the checks above for the current checkout. Automated tests cover catalog interactions, cart persistence, focus handling, assets, themes and hero replay/fallbacks. Browser checks are still needed for visual layouts, native form validation, complete keyboard traversal and animation appearance; passing tests do not establish cross-device or full accessibility conformance.
