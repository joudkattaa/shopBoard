# Roseveil Cosmetics

A Roseveil beauty storefront using the supplied Rose Dusk palette: blush mist, petal pink, dusty rose, mauve shadow, rose wood, vintage plum, berry wine, mulberry wine, deep raisin, and velvet noir. Keep soft pink and blush dominant in the interface; use mauve, plum and wine only as restrained accents and gentle gradients. Keep product imagery varied within the palette. Shopping and form submissions are demonstrations; no live payment, authentication, email, or delivery service is connected.

## Stack

- Vite with vanilla JavaScript, HTML5, and CSS3.
- Use the existing stack and avoid adding frameworks or dependencies unless requested.

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
- src/main.js: application wiring.
- src/data.js: product catalog.
- src/logic.js: pure functions.
- src/state.js: cart and persistence.
- src/ui.js: DOM rendering and events.
- src/style.css: Website styles.
- public/: Static assets.
- package.json: Project dependencies and scripts.

## Verification

- Run npm run build after changing application code.
- For UI changes, check small and large screen layouts, input labels, native form validation, and keyboard navigation when browser access is available.
- Report checks performed and any checks that could not be completed.

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
