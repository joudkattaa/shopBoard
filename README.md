# Roseveil Cosmetics

A responsive Rose Dusk cosmetics storefront in muted blush, mauve, plum and wine tones, built with Vite, vanilla JavaScript, semantic HTML, and mobile-first CSS.

## Run

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
node --test tests/*.test.js
```

## Task 2 additions

Live name search, synchronized category filters, price sorting, matching counts and Clear Filters are implemented in the existing Roseveil storefront. The project is split into data, pure logic, state/persistence and UI modules, with main.js used only for wiring. Additional work includes gift sets, dark mode and code-quality tools. See [Task 2 details and checks](docs/task-2.md).

## Features

- Seven category collections, product search, and product detail dialogs.
- A shopping bag with quantity controls, removal, and browser storage.
- GLOW20: 20% off merchandise. Demo shipping is $5.95, or free for merchandise totals above $50 after discounts.
- A validated demo checkout, contact form, newsletter form, and session-only demo profile.
- Responsive navigation, keyboard focus styles, native dialog behavior, and reduced-motion support.

This is a concept store. Products, prices, and packaging are illustrative. Forms do not submit personal information, and checkout does not place a real order or collect payment. Cart selections, the discount code, and the selected light/dark theme are persisted to browser storage. The sun/moon button switches between the unchanged light colorway and a burgundy/rose-gold dark colorway.

Images were generated with the built-in ImageGen tool and saved in `public/roseveil/`. Current palette and image edit details: [docs/rose-dusk-palette.md](docs/rose-dusk-palette.md). Rebranding prompts and the asset manifest are in [docs/roseveil-rebrand.md](docs/roseveil-rebrand.md).

The previous portfolio source is preserved in `.local-backup/mariana/`. The earlier shoe storefront is in `.local-backup/shopboard/`.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the four-box diagram, function ownership and team rules. Product entries now live in `src/data.js`; `main.js` only connects state and UI.

## Code quality

Run `npm run lint`, `npm run format`, and `npm run format:check` for ESLint and Prettier. `npm test` runs the regression suite. `npm install` runs the Husky prepare script; `.husky/pre-commit` runs lint-staged, which applies ESLint fixes and Prettier only to staged files. ESLint rejects undefined variables and loose equality. VS Code recommendations and format-on-save settings are in `.vscode/`.

The account button opens a demo registration form with required name, email and an eight-character minimum password. Use a made-up password: it is never read by application code, saved or transmitted, and the form is reset on completion. Product data, imagery and grid column layout are unchanged by this quality setup.

## Day 2 completion audit

See [the current completion report](docs/day2-completion-report.md) and [debugging log](debugging-log.md) for verified requirements, confirmed fixes, actual command results, missing instructor exercises, dependency warnings and manual steps. Manual browser/student evidence and the missing instructor lab are not claimed as complete.
