# Task 2 — ROSEVEIL Cosmetics

## Required functionality

- Render the existing product catalog from JavaScript data.
- Search product names immediately using the input event, case-insensitively.
- Filter by every available category, with an All Categories option.
- Keep category navigation and the category select synchronized.
- Sort by Default, Price: Low to High, or Price: High to Low.
- Combine search and category filtering before sorting a copied result array; never mutate the original catalog.
- Use one renderProducts function to refresh the product grid.
- Show matching product counts and a friendly empty state.
- Reset search, category, and sorting together with Clear Filters.

The controls are presented as compact pink circular search, category and sort buttons beside the collection navigation. Their popups support closing with Escape or an outside click.

## Architecture

- data.js: 30 product entries across seven categories, including five gift sets.
- logic.js: pure search, filtering, sorting, price formatting and cart calculations.
- state.js: cart actions, discount code, saved theme and browser persistence; no DOM access.
- ui.js: DOM rendering, event handlers, dialogs, forms and theme presentation; no direct storage access.
- main.js: styles and application wiring only.

The diagram and detailed function ownership are in [architecture.md](architecture.md). Both AGENTS.md and CLAUDE.md document these boundaries.

## Additional improvements

- ROSEVEIL branding and coordinated Rose Dusk product imagery.
- Soft pink light mode and a burgundy/rose-gold dark mode with a sun/moon toggle, stored preference and reduced-motion support.
- Product detail dialogs with smaller, uncropped images.
- Shopping bag quantities, removal, GLOW20 discount, demo shipping and demo checkout.
- Demo registration with labelled, required name/email/password fields and native minimum password length of eight characters. Passwords are not read, stored or sent.
- ESLint, Prettier, Husky, lint-staged and recommended VS Code settings.
- Existing product cards and responsive column layout retained as requested.

## Verification

- npm run lint
- npm run format:check
- npm run build
- npm test (18 automated tests)
- Husky pre-commit runs lint-staged for staged JavaScript and formatting files.

Automated coverage includes combined controls, category synchronization, empty/reset behavior, immutable sorting, cart persistence, legacy bag migration, storage failure handling, theme persistence and core dark-mode color contrast.

Browser layout, keyboard/native validation checks and Lighthouse Accessibility >90 still require manual verification; browser automation was unavailable. This is a demonstration store with no real account, payment or delivery service.
