# Day 2 — JavaScript & the DOM completion report

Project: ShopBoard / ROSEVEIL Cosmetics. Audit date: 2026-10-31.

This audit preserves the existing branding, colors, images, content, layout and features. Most required functionality was already implemented and was verified instead of rewritten. Earlier uncommitted UI changes were present at the start and are not attributed to this audit. No commit, push, deletion, dependency update or forced audit repair was performed.

## 1. Completed requirements

| Requirement                  | Existing implementation and verified evidence                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic products             | 30 entries in `data.js`; `renderProducts` in `ui.js` generates the cards. Asset/ID validation passes.                                                                                                                                                     |
| Case-insensitive name search | `findProducts` normalizes the query and product name; `input` events update the grid. Tests cover uppercase queries and whitespace.                                                                                                                       |
| Category filtering           | Derived category options, select change handler and delegated navigation; tests cover all seven categories and synchronization.                                                                                                                           |
| Ascending/descending prices  | Numeric comparators operate on `[...filteredProducts].sort(compare)`. Both directions are covered.                                                                                                                                                        |
| Combined controls            | Search and category predicates run before sorting; real UI handlers are exercised with a lightweight document test harness.                                                                                                                               |
| Original catalog unchanged   | Snapshot tests compare the catalog before/after sorting, including searches in every category.                                                                                                                                                            |
| Cart quantities and totals   | State actions add, change and remove items; pure calculations cover prices, discount rounding and shipping.                                                                                                                                               |
| Persistence after refresh    | `state.js` uses browser storage with legacy-key migration and failure fallback. Tests recreate state from the same storage adapter and verify restored quantities/code/totals; an actual browser reload remains manual.                                   |
| Event delegation             | A document click handler uses `closest('[data-add]')` and `closest('[data-product]')`; cart actions use a stable cart-container listener. Handler tests confirm adding after filtered renders. Native event propagation still needs browser confirmation. |
| No hardcoded product cards   | `index.html` has an empty product grid and no `article.product-card`; regression passes. Static category links and other editorial articles are intentionally retained.                                                                                   |

### Modular architecture

| Module   | Verified responsibility                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| data.js  | Product data only.                                                                                                            |
| logic.js | Pure search/filter/sort, normalization, formatting and totals; no DOM/storage.                                                |
| state.js | Owned cart, promo/theme/session profile and persistence; defensive snapshots; no DOM.                                         |
| ui.js    | DOM rendering, events, dialogs, theme presentation and the preserved legacy counter implementation; no direct storage access. |
| main.js  | CSS imports, state creation and UI initialization only.                                                                       |

`CLAUDE.md` and `AGENTS.md` already document these rules. `docs/architecture.md` was updated to explain the legacy compatibility export. All source JavaScript modules are now included in the DOM-boundary check, not just the five main modules.

## 2. Requirements still missing

- The instructor's `day2-kit/debug-lab` is unavailable, so its six planted bugs cannot be completed or certified.
- The student's own DevTools investigation and manual evidence have not been produced by this audit.
- The full npm audit is not clean: five moderate development-tool findings remain. npm's suggested major-version repair was not applied.
- Browser/real-device verification and any course-required Lighthouse threshold remain unverified.

No missing implementation was found among the ten functional requirements under the executed automated checks. This is not a claim of exhaustive browser coverage or a guarantee of no other bugs.

## 3. Automated test and code-quality results

| Command                | Actual final outcome                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `npm run lint`         | Exit 0; no ESLint errors.                                                           |
| `npm run format`       | Exit 0; Prettier completed. Existing design/data files required no content changes. |
| `npm run build`        | Exit 0; Vite production build completed.                                            |
| `npm test`             | Exit 0; **25 tests passed**, 0 failed. Starting suite had 19 tests.                 |
| `npm audit`            | Completed with exit 1; **5 moderate findings** in the development tooling chain.    |
| `npm audit --omit=dev` | Additional check: exit 0; **0 vulnerabilities reported**.                           |
| `npm run format:check` | Additional check: exit 0.                                                           |

Audit details: `minimatch <11.0.1`, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), with propagated reports for `@eslint/config-array`, `eslint`, `@eslint-community/eslint-utils` and `@eslint/js`. The JSON audit reported 0 low, 5 moderate, 0 high, 0 critical. npm suggested a forced change to eslint@4.0.0; no repair command or dependency change was made. The initial restricted-network audit failed; only the later successful endpoint response establishes these counts.

New automated coverage includes the confirmed theme race, all-module DOM ownership, counter compatibility, valid dynamic catalog assets/no static cards, immutable combined operations across every category and refresh-equivalent cart restoration.

## 4. Manual checks still required

- Actual browser reload persistence, console errors, DevTools breakpoints and delegated click bubbling.
- Tab/Enter/Escape behavior, focus restoration and native form validation.
- Responsive sizes, horizontal overflow, light/dark presentation, phone keyboard and touch behavior.
- Lighthouse Accessibility if required by the course (no score claimed).
- Student-written observations and six instructor lab investigations after the original kit is supplied.

Browser discovery returned `The browser access host is unavailable`. Node document mocks are not a substitute for these checks. Follow the reproducible checklist in [debugging-log.md](../debugging-log.md).

## 5. Debugging lab status and confirmed findings

No `day2-kit` or `debug-lab` directory was found in the project, including hidden/ignored archives, excluding dependency and Git internals. Nothing was fabricated or intentionally broken.

Two real findings were fixed: a **State** race on rapid deferred theme toggles, and a **Logic/architecture** boundary violation in the dormant counter helper. Each has detection, cause, fix, verification and explicit AI attribution in the root [debugging log](../debugging-log.md). The new regressions were run against the original code, failed for the stated reasons, then passed after the fixes. These are not the instructor's six planted bugs, and no runtime lab bug is claimed.

## 6. Files created or modified by this audit

| File                           | Change                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| debugging-log.md               | New honest finding log, missing-lab note, security note and student manual checklist.                                   |
| docs/day2-completion-report.md | This new assignment report.                                                                                             |
| src/ui.js                      | Fix asynchronous theme selection race; relocate unchanged legacy counter DOM helper here.                               |
| src/counter.js                 | Preserve the original counter export as a compatibility re-export; file not deleted.                                    |
| tests/theme.test.js            | Add failing-before/passing-after rapid-toggle regression.                                                               |
| tests/state.test.js            | Extend DOM-boundary coverage to all source modules.                                                                     |
| tests/day2-assignment.test.js  | Add data/render invariants, every-category combined sorting, persistence-equivalent totals and counter-API regressions. |
| docs/architecture.md           | Document legacy forwarding and the additional UI helper ownership.                                                      |
| README.md                      | Link the current completion report and debugging log.                                                                   |

The existing `index.html`, CSS, product data, images, business logic, persistence implementation, package manifest and lockfile were not changed by this audit. Generated `dist/` output was rebuilt. Pre-existing working-tree changes are retained.

A before/after SHA-256 comparison confirmed all 43 protected files unchanged: the HTML, catalog, logic, state, main wiring, three stylesheets, package manifest/lockfile and every file in `public/roseveil/`.

## 7. Submission readiness

**Application code and automated checks: ready for manual review. Full assignment sign-off: conditional.** Complete your own manual evidence, obtain/complete the missing instructor lab, and review or explicitly disclose the five moderate development-dependency warnings. Do not describe the lab, browser testing or Lighthouse as completed. No changes have been committed or pushed; approval is required before those actions.
