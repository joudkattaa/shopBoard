# Roseveil Cosmetics

A Roseveil beauty storefront using the supplied Rose Dusk palette: blush mist, petal pink, dusty rose, mauve shadow, rose wood, vintage plum, berry wine, mulberry wine, deep raisin, and velvet noir. Keep soft pink and blush dominant in the interface; use mauve, plum and wine only as restrained accents and gentle gradients. Keep product imagery varied within the palette. Shopping and form submissions are demonstrations; no live payment, authentication, email, or delivery service is connected.

## Stack

- Vite with vanilla TypeScript, HTML5, and CSS3.
- Use the existing stack and avoid adding frameworks or dependencies unless requested.
- TypeScript uses strict checking through `tsconfig.json`; Vite serves and builds the application. ESLint, Prettier, Node's test runner, Husky and lint-staged support development checks.
- Current features include category browsing, product search and details, a browser-persisted demo bag, GLOW20 discounts and demo forms. Product imagery lives in `public/roseveil/`. No live API is connected.

## Rules

- Semantic HTML first: use appropriate elements such as header, nav, main, section, article, form, and footer.
- Give every input an associated label using matching for and id attributes. Placeholders do not replace labels.
- Use native HTML form validation, including appropriate input types and required attributes.
- Write mobile-first CSS and use min-width media queries for larger screens.
- Never use !important.
- Keep keyboard navigation and visible focus styles accessible.
- Explain every change in the response, including its purpose and any validation performed.

## Project Structure

- index.html: Main HTML page.
- src/main.ts: application wiring.
- src/data.ts: product catalog.
- src/logic.ts: public entry point for pure functions and shared price formatting.
- src/modules/products/products.logic.ts: pure product lookup, search, filtering and sorting.
- src/modules/products/products.types.ts: product, category and sort-order types.
- src/modules/cart/cart.logic.ts: pure cart validation and totals.
- src/modules/cart/cart.types.ts: cart item and totals types.
- src/modules/state/state.types.ts: state, actions and snapshot contracts.
- src/state.ts: cart and persistence.
- src/ui.ts: DOM rendering and events.
- src/counter.ts: compatibility re-export of setupCounter from ui.ts; not a place for new features.
- src/style.css: base website styles.
- src/theme.css: theme colors and presentation.
- src/responsive.css: responsive layouts and component refinements. Styles load after style.css and theme.css.
- src/shared/api/client.ts: empty, reserved API client for upcoming coursework; no current API integration.
- src/shared/ui/toast.ts: empty, reserved UI helper for upcoming coursework; does not override the current DOM boundary.
- public/: Static assets.
- tests/: Node regression tests, including architecture, catalog, cart, theme, hero and asset checks.
- docs/: architecture, coursework evidence, design details and verification reports.
- README.md and DESIGN.md: project setup, features and design rationale.
- package.json: Project dependencies and scripts.
- tsconfig.json and eslint.config.js: TypeScript and JavaScript lint configuration.

## Where New Features Belong

- Add catalog entries in `src/data.ts` and their contracts in `products.types.ts`.
- Add pure product behavior in `products.logic.ts`, cart validation and pricing in `cart.logic.ts`, and related contracts in their type files. Export public functions through `src/logic.ts`, which primarily re-exports module functions and owns shared price formatting.
- Add state transitions, persistence and preference handling in `src/state.ts`; update `modules/state/state.types.ts` for changed contracts.
- Add DOM rendering, event handlers, dialogs, form interactions and animation observers in `src/ui.ts`. Add semantic markup in `index.html` and styles in the appropriate CSS file above.
- Keep `src/main.ts` limited to startup wiring. Keep the reserved shared files empty until their coursework feature is implemented; any future shared UI helper must be reconciled with the documented DOM boundary first.
- Add regression coverage in `tests/`, supporting evidence in `docs/`, and reusable static assets in `public/`. Update relevant documentation when behavior or architecture changes.

## Verification

- Run npm run build after changing application code.
- Run `npm run typecheck`, `npm run build`, `npm test` and `npm run lint` for application changes. `npm test` runs `node --test tests/*.test.js`; `npm run lint` runs `eslint .` and then `npm run typecheck`. ESLint checks all 13 current TypeScript source files through `src/**/*.ts` using `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`, as well as JavaScript tooling/tests. Typecheck runs `tsc --noEmit` for strict compiler checks.
- Run `npm run format:check` to check repository formatting. `npm run format` rewrites files across the repository; use it only within an authorized scope and avoid unrelated formatting changes.
- Use `npm run dev` for development and `npm run preview` to inspect the production build after building. These start servers rather than automated checks.
- `npm run prepare` configures Husky hooks; it is setup, not a verification command.
- For UI changes, check small and large screen layouts, input labels, native form validation, and keyboard navigation when browser access is available.
- Report checks performed and any checks that could not be completed.

## Architecture

- src/data.ts: product data only. Add or edit catalog entries here.
- src/logic.ts and its product/cart modules form the pure logic box. The entry point re-exports functions and formats prices; calculations, search, filtering and sorting belong in the corresponding modules. No DOM, localStorage, browser globals, or mutation of product data or caller inputs.
- Product and cart logic modules belong to the same pure logic box. Cart logic may import product logic; product logic imports data. Neither module imports the `logic.ts` entry point. UI and state continue importing public functions through `logic.ts`.
- src/state.ts: owns cart, promo code, theme preference and session profile. All browser storage access belongs here. No DOM access. Expose actions and defensive snapshots; never mutate the cart from UI code.
- src/ui.ts: the only application file that touches the DOM. Owns rendering, events, dialogs, forms and theme presentation. Calls state actions and pure logic functions; never reads or writes localStorage.
- src/main.ts: imports styles, creates state and initializes the UI only. No rendering, DOM access, persistence or business rules.
- index.html: semantic markup only; no inline scripts that bypass the UI/state boundary.
- Keep import direction one-way: logic -> data; state -> logic; UI -> logic; main -> state + UI. Pass state into the UI.
- Architecture diagram and function ownership: docs/architecture.md.
- Before adding a function, assign it to one of the four boxes. Preserve current design and behavior when changing architecture.
- Verify with npm run build and node --test tests/*.test.js.

## Personal AI-Development Rules

1. Test animations in the browser. When AI adds an animation or visual feature, I must test it in the browser before calling it finished. In my project, the animated product section was added, but the animation was not initially visible.
2. Check file references after renaming. When converting JavaScript files to TypeScript, I must check imports, configuration files and development tools for outdated paths. In my project, ESLint still referenced `src/ui.js`, and lint-staged initially did not include `.ts` files.
3. Use the latest application state. When updating the theme during delayed animations or transitions, the code must use the current application state instead of outdated DOM values. My project had a documented bug during rapid theme switching. This is a lesson from AI-assisted development, not a claim that AI introduced the bug.
