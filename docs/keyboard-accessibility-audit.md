# Keyboard accessibility audit

## Scope and confirmed fixes

AI inspected `index.html`, the UI event handlers, focus styles in the base/responsive/theme stylesheets, and the existing control tests. Branding, colors, images, layout, catalog, state and business logic were preserved. No dependencies were added.

- **Escape crossed interaction boundaries:** the previous document handler closed every catalog popup, closed navigation, and focused header search even when a modal was open. It now ignores already-consumed events and open modal dialogs, dismisses only the focused catalog/search layer, and returns focus to its trigger. Mobile navigation Escape returns focus to the menu button.
- **Hidden reset controls retained focus:** clearing filters or resetting an empty result hides the focused reset button. The UI now focuses the collection heading when that button initiated the reset.
- **Mobile navigation could hide its focused link:** closing navigation now returns focus to its visible menu button when focus was inside navigation. Desktop navigation keeps its normal behavior.
- **Search submission only scrolled:** submitting header search now also focuses the collection heading. Continuing shopping likewise focuses the collection after closing the dialog and resetting results.
- **Dialog content replacement lacked a focus destination:** product/account/checkout content can replace the currently focused control inside an already-open dialog. Content dialogs now focus their stable title after rendering, and the shopping bag focuses its title when opened.

`main` and the collection/dialog headings have `tabindex="-1"`: they support focus as destinations without adding extra stops to the ordinary Tab order. The existing light/dark focus-ring rules now include these destinations, using the same colors and outline treatment.

All DOM changes remain in `src/ui.js`; HTML provides semantic focus destinations. Native buttons, links, details/summary, selects and modal dialogs remain in use. No custom Tab trap or duplicate Enter/Space activation handler was introduced. The existing cart quantity/remove handlers already restore focus after rendering; they were retained.

## Automated verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `npm test`: 31 passed, 0 failed.
- Six new mock-DOM event-handler regression tests cover modal/background Escape isolation, consumed Escape and focused-layer dismissal, reset/search destinations, mobile menu focus recovery, dialog heading focus on opening/replacement, and non-interception of Tab/Shift+Tab/Enter/Space.
- The existing popup test now distinguishes the summary trigger from its input and asserts the actual focus destination.

These tests exercise application handlers, not native browser tab order, native select menus, dialog focus trapping/restoration, screen-reader output or visual rendering. Browser automation was unavailable: the browser access host returned an unavailable error. No browser keyboard pass is claimed.

## Manual retest required

1. In light and dark themes, Tab from the top: use the skip link with Enter, then continue with Tab and Shift+Tab. Check a visible focus ring and logical order; no hidden content should receive focus.
2. At a mobile viewport, activate navigation with Enter and Space. Tab through its links; press Escape and confirm focus returns to the menu button. Activate a category or information link and confirm focus remains usable.
3. Open each catalog summary with Enter and Space. Search by typing; use native select arrow keys and Enter for category/sort. Escape from an expanded native select should dismiss its native menu first; then Escape from the popup should return to its summary. Check Shift+Tab back to the summary and Tab onward.
4. Open header search, type, submit with Enter, and confirm focus reaches the collection heading. Reopen and use Escape inside search to return to its toggle.
5. Open a product with Enter or Space: focus should reach its title. Tab and Shift+Tab must stay inside the native modal. Add to bag, close using the close button and Escape, and check focus returns to the opening product button. Background controls must remain inaccessible while the dialog is open.
6. Open the bag; test quantity changes, the quantity limit, removing the final item, promo apply/remove, and checkout using only keys. Focus must stay usable after every render. Close the bag with Escape and confirm return to its opener.
7. Complete a demo account/checkout form and check focus reaches the updated dialog heading. Use Continue Shopping and confirm focus reaches the collection heading. Check required/email/password validation without a mouse.
8. Produce empty search results and activate Explore All Products; also activate Clear Filters. Confirm the collection heading receives focus and subsequent Tab reaches usable controls.

Report any remaining issue with browser/version, viewport, starting control, exact keys, expected result and observed focus destination. Native select Escape, modal focus trapping/restoration, actual visible focus and native form validation remain unverified here.

## Files changed for this audit

- `src/ui.js`: scoped Escape and focus management.
- `index.html`: programmatic focus destinations.
- `src/responsive.css`, `src/theme.css`: extend existing focus styles to those destinations.
- `tests/catalog-controls.test.js`: improve focus mocks and add regressions.
- `docs/task-2.md`: keyboard status points to this audit; manual retest remains pending.
- `docs/keyboard-accessibility-audit.md`: this report.

No commit or push was performed.
