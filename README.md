# Lumière Cosmetics

A responsive cosmetics storefront inspired by the supplied reference, built with Vite, vanilla JavaScript, semantic HTML, and mobile-first CSS.

## Run

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
node --test tests/store.test.js
```

## Features

- Six category collections, product search, and product detail dialogs.
- A shopping bag with quantity controls, removal, and browser storage.
- GLOW20: 20% off merchandise. Demo shipping is $5.95, or free for merchandise totals above $50 after discounts.
- A validated demo checkout, contact form, newsletter form, and session-only demo profile.
- Responsive navigation, keyboard focus styles, native dialog behavior, and reduced-motion support.

This is a concept store. Products, prices, and packaging are illustrative. Forms do not submit personal information, and checkout does not place a real order or collect payment. Cart selections and the discount code are the only information persisted to browser storage.

Images were generated with the built-in ImageGen tool and saved in `public/lumiere/`. Exact prompts are in [docs/lumiere-image-prompts.md](docs/lumiere-image-prompts.md).

The previous portfolio source is preserved in `.local-backup/mariana/`. The earlier shoe storefront is in `.local-backup/shopboard/`.
