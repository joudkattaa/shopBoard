# Roseveil Cosmetics

A Rose Dusk cosmetics storefront in muted blush, dusty rose, mauve, plum, and wine tones with category browsing, product search, product details, a browser-persisted demo bag, GLOW20 discounts, and demo forms. Product imagery is in public/roseveil/. No live payments, email delivery, or account service is connected.

## Stack

Vite (Vanilla JavaScript), HTML5, CSS3

## Rules

1. Use semantic HTML elements to organize the page.
2. Add a proper label to every form input.
3. Start with mobile styles and use min-width media queries for larger screens.
4. Keep CSS clean and avoid using !important.
5. Explain code changes so I can understand them.

## Project Structure

- index.html: Main HTML page.
- src/main.js: application wiring.
- src/data.js: product catalog.
- src/logic.js: pure functions.
- src/state.js: cart and persistence.
- src/ui.js: DOM rendering and events.
- src/style.css: Website styles.
- public/: Static assets.
- package.json: Project dependencies and scripts.

## Architecture

- src/data.js: product data only. Add or edit catalog entries here.
- src/logic.js: pure calculations, search, filtering and sorting. No DOM, localStorage, browser globals, or mutation of product data or caller inputs.
- src/state.js: owns cart, promo code, theme preference and session profile. All browser storage access belongs here. No DOM access. Expose actions and defensive snapshots; never mutate the cart from UI code.
- src/ui.js: the only JavaScript file that touches the DOM. Owns rendering, events, dialogs, forms and theme presentation. Calls state actions and pure logic functions; never reads or writes localStorage.
- src/main.js: imports styles, creates state and initializes the UI only. No rendering, DOM access, persistence or business rules.
- index.html: semantic markup only; no inline scripts that bypass the UI/state boundary.
- Keep import direction one-way: logic -> data; state -> logic; UI -> logic; main -> state + UI. Pass state into the UI.
- Architecture diagram and function ownership: docs/architecture.md.
- Before adding a function, assign it to one of the four boxes. Preserve current design and behavior when changing architecture.
- Verify with npm run build and node --test tests/*.test.js.
