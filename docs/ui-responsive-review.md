# Roseveil UI and mobile refinement

Applied the installed `better-ui`, `emil-design-eng`, and `mobile-native` skills from `.claude/skills/`. No new dependencies or product/image changes were introduced. Data, pure logic and state modules are unchanged. DOM work remains in `ui.js`; `main.js` only imports the responsive stylesheet in addition to its existing wiring.

| Severity | Location                          | Before                                                                                           | After                                                                                                                           | Why                                                                |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| HIGH     | src/style.css; src/theme.css      | Ungated hover styles could latch after touch; selected and hover styles shared a dark-mode rule. | Hover is gated by hover/fine-pointer capabilities; open/selected states remain unconditional. Movement is reduced-motion gated. | Touch must not depend on hover or motion.                          |
| HIGH     | src/responsive.css:49             | Small input fonts and tiny tap targets.                                                          | 16px fields; 44px controls including quantity buttons, navigation tools and actions.                                            | Avoid iOS focus zoom and improve touch accuracy.                   |
| MEDIUM   | src/responsive.css:71             | Crowded header and fixed 150px tiles.                                                            | Reflowing header and fluid grids: two product columns on phones, three at 600px, four at 900px, five at 1200px.                 | Let actual content fit the viewport without hiding overflow.       |
| MEDIUM   | src/responsive.css:158            | Hero text as small as 6px and tiny call to action.                                               | Readable type and 44px CTA over the existing image; horizontal desktop composition retained.                                    | Make the first screen usable on phones while preserving the brand. |
| MEDIUM   | src/responsive.css:331; src/ui.js | Overlay scroll could chain to the page and opening tools left focus on the trigger.              | Contained overlay scrolling, dialog page-scroll lock, field focus on open, Escape restoration retained.                         | Make touch scrolling and keyboard use predictable.                 |
| MEDIUM   | src/responsive.css:245            | Inconsistent nested corner insets and very small product text.                                   | Concentric petal corners, white card surfaces, restrained shadows, readable names and tabular prices.                           | Improve hierarchy without replacing Roseveil's visual identity.    |
| LOW      | index.html; src/ui.js             | No safe-area viewport setup; browser chrome used a brand color rather than the header surface.   | Safe-area/keyboard viewport metadata, search keyboard hints and theme-color matching each header.                               | Better platform integration on phones.                             |

## Verification

- Lint, formatting check, production build and automated regression tests run after implementation.
- Existing combined search/category/sort, reset/count/empty state, cart persistence and theme tests remain in place.
- Added an event-handler regression for popup focus, single-open behavior and Escape restoration.
- Code review covers hover, pressed, selected/open, focus, empty results, disabled controls, dark/light colors and reduced-motion branches.
- Browser automation unavailable: no connected browser host. Responsive screenshots, actual browser overflow measurements, native validation, full keyboard traversal and 10%-speed animation replay: **Not verified**.
- Physical phone testing (iOS input zoom, software keyboard, touch hover, notch/landscape safe areas and scroll bounce): **Not verified**. Emulation cannot establish these results.

Code review of the inspected states: **Approve**. This does not approve the unverified browser/device coverage above.
