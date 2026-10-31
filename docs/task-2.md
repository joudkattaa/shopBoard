# Task 2 — ROSEVEIL Cosmetics

## Required Functionality

- Render the existing product catalog dynamically from JavaScript data.
- Search product names immediately using the `input` event, case-insensitively.
- Filter products by every available category, including an All Categories option.
- Keep category navigation and the category select synchronized.
- Sort products by Default, Price: Low to High, or Price: High to Low.
- Combine search and category filtering before sorting a copied result array, without mutating the original catalog.
- Use a single `renderProducts` function to update the product grid.
- Display matching product counts and a user-friendly empty state.
- Reset search, category filtering, and sorting together using Clear Filters.

The controls are presented as compact pink circular search, category, and sort buttons beside the collection navigation. Their popups support closing with Escape or clicking outside.

## Architecture

The application follows a modular JavaScript architecture:

- **data.js:** Contains 30 product entries across seven categories, including five gift sets.
- **logic.js:** Contains pure functions for searching, filtering, sorting, price formatting, and cart calculations. Does not access the DOM or localStorage.
- **state.js:** Manages shopping cart actions, discount codes, theme preferences, and browser persistence without accessing the DOM.
- **ui.js:** Handles DOM rendering, event listeners, dialogs, forms, and theme presentation without directly accessing localStorage.
- **main.js:** Connects the modules and initializes the application.

The architecture diagram and detailed function responsibilities are documented in [architecture.md](architecture.md). Both `AGENTS.md` and `CLAUDE.md` describe the architecture rules.

## Additional Improvements

- Custom ROSEVEIL Cosmetics branding with coordinated Rose Dusk product imagery.
- Responsive, mobile-first layout.
- Soft pink light mode and burgundy/rose-gold dark mode with saved theme preferences.
- Reduced-motion support and improved theme-toggle state handling.
- Product detail dialogs with appropriately sized, uncropped images.
- Shopping cart with quantity controls, product removal, and persistent storage.
- `GLOW20` promotional discount, demo shipping calculations, and demonstration checkout.
- Demo registration with labelled, required name, email, and password fields.
- Native form validation with a minimum password length of eight characters.
- No real authentication or account persistence; passwords are not read, saved, or transmitted by application code.
- ESLint, Prettier, Husky, lint-staged, and recommended VS Code settings.
- Performance optimizations including WebP images, responsive image sizes, improved font discovery, and reduced unnecessary product rendering.
- Preservation of the existing visual design, product cards, imagery, and responsive layout.

## Debugging and Code Quality

Two confirmed issues were identified and fixed during the audit:

1. **Theme state issue:** Rapid theme toggling could save an incorrect final selection when view-transition callbacks were delayed. The logic was corrected and covered by regression tests.
2. **Architecture issue:** An unused Vite counter helper accessed the DOM outside `ui.js`. Its DOM implementation was moved into `ui.js`, while preserving its original export and behavior.

Both findings are documented in `debugging-log.md`, including their causes, fixes, verification, and AI assistance.

The instructor's `day2-kit/debug-lab` directory was not available. Therefore, its six planted debugging exercises remain incomplete and are not represented as completed work.

## Automated Verification

The following checks passed:

- `npm run lint` — Passed.
- `npm run format:check` — Passed.
- `npm run build` — Passed.
- `npm test` — **35 automated tests passed, 0 failed.**

Automated coverage includes combined search/filter/sort controls, category synchronization, empty states, filter resetting, immutable sorting, cart persistence, storage failure handling, theme persistence, rapid theme toggling, modular architecture boundaries, asset references, keyboard accessibility regressions, and dark-mode color contrast.

### Security Audit

- Full npm audit: 5 moderate findings in development-tool dependencies.
- Production-only audit: 0 vulnerabilities reported.
- No forced dependency upgrades were applied.

## Manual Verification

The following checks were performed and reported by the student, not by AI browser automation.

- Product search (case-insensitive): **Passed**.
- Category filtering: **Passed**.
- Price sorting (Low to High): **Passed**.
- Price sorting (High to Low): **Passed**.
- Basic website functionality: **Passed**.
- Shopping cart persistence after page refresh: **Passed**.
- Responsive design (mobile, tablet, and desktop): **Passed**.
- Browser DevTools Console: **Passed — no errors or warnings observed**.
- Browser DevTools Breakpoints: **Passed — JavaScript execution successfully paused at a breakpoint**.
- Keyboard navigation and accessibility: **Passed — Tab, Shift+Tab, Enter, and Escape tested successfully**.
- Native form validation: **Passed — required fields, invalid email format, and minimum password length verified**.

### Lighthouse Results

The following Lighthouse results were obtained by the student using the production preview (`http://localhost:4173/`):

- **Performance: 55/100** — Improved compared with the initial development-server measurement of 33/100.
- **Accessibility: 91/100** — Passed the documented target above 90.
- **Best Practices: 100/100**.
- **SEO: 92/100**.

Lighthouse reported that Chrome extensions may have negatively affected page load performance. These scores reflect the observed audit and do not represent an extension-free baseline.

### Pending Exercise

- Instructor's six debugging-lab exercises: **Pending — required files were unavailable**.

The remaining debugging-lab exercise is documented separately.

## Project Limitations

ROSEVEIL Cosmetics is a demonstration storefront. It does not include real user authentication, payment processing, email delivery, or order fulfillment.

The shopping cart, promotional code, and theme preferences are stored locally in the browser. Demo profile information is session-only and is not preserved after refreshing the page.

## Assignment Status

The interactive ShopBoard features and modular architecture requirements have been implemented and verified through automated tests.

The debugging log documents two confirmed project findings with transparent AI attribution. The instructor's separate six-bug debugging lab remains incomplete because the required files were unavailable.

The project has been uploaded to GitHub. All core interactive features, modular architecture requirements, and documented automated tests have been completed successfully. Manual browser verification has also been performed.

Additional performance optimizations have been applied, and the latest Lighthouse results are documented above.
