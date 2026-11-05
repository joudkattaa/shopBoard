# ROSEVEIL TypeScript migration

## Purpose and fixes

Initially only main.ts had been migrated; the remaining application modules were JavaScript and were not fully checked. Migration exposed untyped parameters, nullable DOM lookups, optional product lookup results and unvalidated stored JSON. The draft cart type also used productId, while the application and persisted cart use id.

All application modules now use TypeScript. The migration preserved the catalog, CSS, interface templates, shopping behavior and storage keys. Product and cart logic were subsequently separated by responsibility inside the existing pure logic layer.

## Current ownership

| File                                   | Responsibility                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| server/catalog.ts                      | Catalog typed as readonly Product[]                                          |
| src/modules/products/products.logic.ts | Product lookup, search, filtering, sorting and control-value validation      |
| src/modules/cart/cart.logic.ts         | Validation of untrusted cart entries and calculation of totals               |
| src/modules/cart/cart.state.ts         | Cart actions, live defensive getters, promo handling and browser persistence |
| src/state.ts                           | Application coordination, catalog loading, theme and session profile         |
| src/modules/products/products.ui.ts    | Catalog presentation, controls, details and loading states                   |
| src/modules/cart/cart.ui.ts            | Bag presentation, actions, promo forms and demo checkout                     |
| src/shared/ui/ui.types.ts              | Type-only injected helper contracts                                          |
| src/ui.ts                              | Shared helpers, routing, dialogs, general forms, theme and hero              |
| src/main.ts                            | Styles and state/UI initialization                                           |

See [the architecture documentation](architecture.md) for import boundaries and function ownership.

## Type contracts

- src/modules/products/products.types.ts: Product, the seven actual Category values, and SortOrder.
- src/modules/cart/cart.types.ts: CartItem, Cart and CartTotals. Each cart entry has a string id and numeric quantity.
- src/modules/state/state.types.ts: Theme, Profile, StorageAdapter and AppState. AppState is derived from createState so action signatures stay synchronized.

Product lookup returns Product or undefined. Callers check the result before rendering it. Stored JSON enters as unknown and is validated before accessing properties. UI helpers use constructor checks and generic narrowing to return correctly typed elements; event handlers validate targets before accessing element-specific properties. Category and sort values are checked before updating filters. These checks avoid any, type assertions, non-null assertions and compiler-suppression comments.

## Compiler and test setup

tsconfig.json includes all of src, enables strict, noUnusedLocals and noEmit, and uses ES2022, DOM libraries and Bundler module resolution. TypeScript checks contracts during development; Vite removes types and delivers JavaScript to browsers. Runtime validation remains necessary for stored data and DOM events.

The tests use Node 24 native type stripping. The existing VM-based catalog event harness strips types through node:module before exercising real UI handlers. Node may print an experimental warning for stripTypeScriptTypes; that warning is not a test failure. Additional regressions cover invalid stored JSON shapes and invalid cart entries.

`npm run lint` runs `eslint .` followed by `npm run typecheck`. ESLint checks frontend TypeScript, the server catalog and the Vercel function through `src/**/*.ts`, `server/**/*.ts` and `api/**/*.ts` using `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`, as well as JavaScript tooling/tests. Typecheck runs `tsc --noEmit` for strict compiler checks.

## Verification and coursework scope

Run npm run typecheck, npm run build, npm test and npm run lint. Use npm run dev to start Vite and open the printed address.

Check product rendering, images and prices; combined search/category/sort controls; reset and empty results; adding products; changing quantities; removal; totals; the GLOW20 code; empty-cart behavior; and persistence after refresh. Check small and large layouts, Tab/Enter/Escape navigation and native required/email/password validation.

Automated behavior checks do not establish visual or physical-device results. Browser automation was unavailable during migration, so responsive layout and native browser form validation were not claimed as verified by AI.

Debugging evidence remains in [the debugging log](../debugging-log.md). Day 3 now fetches the exact ROSEVEIL catalog from the local /api/products endpoint backed by server/catalog.ts, with loading, error/retry, empty and success states in the existing grid. See [local API setup](local-api.md). The shared toast file remains an empty placeholder.
