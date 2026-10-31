# Day 2 debugging log — ROSEVEIL Cosmetics

Audit date: 2026-10-31.

## Scope and attribution

This log records confirmed findings in the real project, not invented instructor bugs. Codex (AI) inspected the code, wrote reproductions, implemented the fixes, and ran the automated checks. It does **not** claim that the student personally discovered these issues, used browser DevTools, or completed the manual exercises below.

The starting suite passed 19 tests. Passing that suite did not establish coverage for rapid deferred theme transitions or DOM access in the unused legacy counter.

## Finding 1 — rapid theme toggles saved the wrong final selection

- **What I saw:** In a Node reproduction with deferred `startViewTransition` callbacks, two rapid clicks from light mode left the saved and final visible theme dark. Two toggles should return to light. The new regression initially failed with `'dark' !== 'light'`.
- **Type:** State.
- **How I found it:** AI code inspection identified that the next state came from `root.dataset.theme`, while that DOM value was updated asynchronously. Codex then ran the reproduction and the failing regression in `tests/theme.test.js`. This was a simulated transition queue, not an observed browser session.
- **Cause:** Persistence updated synchronously, but the next click consulted stale DOM state while the earlier transition callback was still queued.
- **Fix:** Derive the next selection from `state.theme`, update state before scheduling presentation, and make deferred presentation read the latest state. No palette or layout change.
- **Verification:** `rapid toggles use current state while view-transition callbacks are deferred` passes after the fix, including deliberately reversed callback execution in the test harness. Existing persistence, blocked-storage and keyboard-toggle paths remain covered by the suite.
- **Did I use AI?** Yes. Codex found, reproduced, fixed and tested this issue. The student must still perform the real-browser check below.

## Finding 2 — legacy counter violated the DOM ownership rule

- **What I saw:** `src/counter.js` contained `element.innerHTML` and `element.addEventListener` even though `CLAUDE.md` permits DOM work only in `ui.js`. It is an unused Vite demo helper, not a confirmed live-store runtime failure.
- **Type:** Logic — architectural boundary violation in dormant code.
- **How I found it:** AI inspected every source module and added a source-boundary regression. It initially failed specifically on `counter.js`.
- **Cause:** The original Vite demo helper remained outside the later modular architecture; earlier boundary tests only checked the five main modules.
- **Fix:** Move the existing counter implementation unchanged into `ui.js`; retain `counter.js` as a compatibility re-export. The helper, its exported API and behavior are preserved; no file was deleted and it was not added to the storefront startup path.
- **Verification:** The all-source DOM-boundary regression passes. A separate test calls the original counter export and checks that it renders `Count is 0`, then `Count is 1` after its click handler runs.
- **Did I use AI?** Yes. Codex identified the boundary violation, changed the ownership and ran the tests. No claim of a student-discovered runtime bug is made.

## Instructor debugging lab — unavailable

`day2-kit/debug-lab` is absent. Directory discovery searched the project, including hidden/ignored local archives, while excluding `node_modules` and `.git`. Neither a `day2-kit` nor a `debug-lab` directory was found.

The required six planted bugs (two runtime, two logic, two state) therefore could not be identified or fixed. No replacement lab was invented and no deliberate bugs were introduced into ShopBoard. The two confirmed findings above are not presented as those six instructor bugs. Obtain the original kit from the instructor and complete/document that exercise separately, preserving its original version.

## Security audit — separate dependency warning

- The first restricted `npm audit --json` attempt failed to reach the advisory endpoint; that failure was not a clean audit result.
- A subsequent network-enabled `npm audit` completed with exit code 1 and **5 moderate findings**, 0 high/critical findings in the JSON report.
- The reported chain involves `minimatch`, `@eslint/config-array`, `eslint`, `@eslint-community/eslint-utils` and `@eslint/js`; these are development tooling. The underlying advisory is [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), potential denial of service via globparts amplification in minimatch.
- npm proposed `npm audit fix --force` and `eslint@4.0.0`, explicitly a breaking change. That command was **not** run; no dependencies or lockfile were changed in this audit.
- Additional `npm audit --omit=dev`: exit code 0, **0 vulnerabilities reported**. This does not cancel the full audit warnings or prove the application is universally secure.

## Manual debugging steps the student must perform

These steps are **not completed by this automated audit**. Record your own observations, screenshots, console output and breakpoint findings before claiming them in your submission.

1. Run `npm run dev`, open the local URL, open DevTools Console, clear it and reload. Record whether there are errors. Enable Pause on exceptions and place a breakpoint in `ui.js`'s `renderProducts`.
2. Search `BOTANICAL`, select Hair Care, then test both price orders. There should be five matches, ordered from $23.99 to $42.99 ascending and the reverse descending. Inspect the `filters` and `matches` values at the breakpoint. Try an impossible query, then Clear Filters and confirm all 30 products return.
3. After those re-renders, add two Radiance Facial Serums and one Hydrating Day Cream using the rendered controls. The subtotal should be $99.97; applying GLOW20 should produce $79.98 merchandise with free demo shipping. Use quantity and remove buttons and inspect the state action calls.
4. Inspect Application > Local Storage for `roseveil-shopping-bag-v1`, refresh the actual browser and compare quantities, code and totals. Repeat with the theme preference. Try rapid pointer clicks on the theme toggle and confirm that the last selection survives reload.
5. Navigate search, category/sort popups, product dialogs and cart with Tab/Enter/Escape. Test registration empty, invalid email and a made-up password shorter than eight characters. Confirm native validation blocks submission. Do not use a real password.
6. Check 360px, 768px and 1280px, light/dark themes, long text, landscape and an actual phone with its keyboard open. Check horizontal overflow and visible focus. Run Lighthouse Accessibility if required by the course; no score is claimed here.
7. Obtain the missing instructor kit. For each genuine planted bug, reproduce it, classify it, record the exception/values/state, identify the root cause, fix it, and record your actual AI assistance. Keep that lab's six-bug exercise separate from the production findings above.

## Automated verification summary

Final suite: **25 passing tests**. Lint, formatting and production-build results, audit warnings, file changes and submission conditions are recorded in [docs/day2-completion-report.md](docs/day2-completion-report.md). Browser access reported `The browser access host is unavailable`; no browser, physical-device or Lighthouse verification is claimed.
