# ROSEVEIL performance optimization report

## Investigation and limits

The supplied Lighthouse results were Performance 33, Accessibility 91, Best Practices 100, SEO 92. Lighthouse warned about extensions. These are student-supplied results, not a controlled baseline measured by AI. Extensions, device load, network conditions and a Vite development server can affect a run; their contribution cannot be quantified from the scores alone.

Confirmed site findings:

- The 31 distinct images referenced by the catalog and page totaled 54,693,783 bytes as PNGs. Many individual product/category images were 1.5-2.6 MB although cards display much smaller. Lazy loading existed, but nearby offscreen images can still compete for bandwidth as the browser approaches them.
- The hero alone was 1,947,827 bytes. It already had high fetch priority and was not lazy loaded. Its HTML dimensions were 2048 by 1024, while the actual file is 1774 by 887; both have the same 2:1 ratio, so this mismatch was not evidence of a measured layout shift.
- Fonts were discovered through a Google Fonts CSS `@import`, adding a stylesheet discovery dependency. Existing font families, weights and `display=swap` were retained.
- The grid was rebuilt on every input event even if the ordered result IDs were unchanged. This was avoidable DOM work, but there is no measured evidence that it caused a poor INP score.
- The pre-change production JavaScript was 29,582 bytes and CSS 41,286 bytes (uncompressed). No third-party application framework or analytics runtime was found. CSS contains layered responsive/theme overrides; removing them without visual browser verification risks changing appearance, so they were preserved.

Browser access returned �The browser access host is unavailable.� No Lighthouse runs, network waterfall, long-task profile, visual comparisons, LCP, CLS or INP measurements were possible in this session. No claim is made that all of the score of 33 came from the website or that a target score has been achieved.

## Implemented changes

1. Generated full-resolution **lossless WebP** copies of all 31 used images. The generator decoded each full-size result and compared every pixel with its source; all matched, including alpha. Original PNGs remain intact. No product or image was removed.
2. Generated 240/480/800-pixel delivery variants for square images and a 960-pixel hero variant. They preserve composition and aspect ratio, use Lanczos resizing, and lossless encoding after resizing. Full resolution remains available for high-density screens. Visual browser comparison is still pending; only the full-size variants are pixel-identical to the originals.
3. Added `srcset` and `sizes` to static and dynamic images. Card sizes follow the existing grid breakpoints. Bag thumbnails and dialog images advertise their smaller display sizes. The hero sizing accounts for its existing mobile crop, avoiding an undersized source based only on viewport width.
4. Preloaded the hero with the same responsive candidates and sizing used by its image, retaining `fetchpriority="high"` and eager default loading. All below-the-fold category/about/card images remain lazy. User-opened product/bag images load eagerly. All images decode asynchronously.
5. Preserved explicit dimensions and corrected the hero to its actual dimensions. Existing CSS dimensions, layout, colors, animations, image composition and focus styles were not altered.
6. Moved the identical font stylesheet request from CSS import to HTML and added preconnects to Google Fonts and its font origin. Fonts and their weights were not changed or self-hosted.
7. Reused grid nodes when search/filter changes yield the same ordered product IDs, while still updating the search fields, counts, headings and filter state. Changed results still use the existing delegated product/cart events. State, storage and pure business logic modules were untouched.

## Actual measurements

File sizes are raw bytes, not gzip transfer estimates or observed page loads. The combined image total represents all distinct used images, **not initial page transfer**; most images are lazy or user-opened.

| Asset              | Before PNG | After full-size WebP |         Smaller responsive alternative |
| ------------------ | ---------: | -------------------: | -------------------------------------: |
| All 31 used images | 54,693,783 |           34,634,966 | Varies with viewport and pixel density |
| Hero               |  1,947,827 |            1,323,504 |                      440,224 at 960 px |
| Serum              |  1,602,815 |              981,970 |                      161,890 at 480 px |
| Gift collection    |  2,406,746 |            1,624,082 |                      262,340 at 480 px |

Full-size image bytes fell **36.7%**. The browser chooses responsive candidates; the table does not imply every device downloads the smallest file. There are 31 full-size WebP files and 91 smaller variants. Originals are still shipped as unused static files because deletion was not authorized; they increase deployment storage, but normal page markup no longer requests them.

Production CSS changed from 41,286 to 41,150 bytes. JavaScript changed from 29,582 to 29,886 bytes due to responsive-image markup and the result identity check. The intent is reduced image transfer and redundant DOM work, not a claim of a smaller JavaScript bundle. Lighthouse before/after and Core Web Vitals remain unmeasured.

Per-image dimensions, source bytes, output bytes and variants are recorded in [image-optimization-metrics.json](image-optimization-metrics.json).

## Validation

- `npm run lint`: passed.
- `npm run format`: passed.
- `npm run build`: passed.
- `npm test`: 35 passed, 0 failed.
- All static image sources, responsive candidates and catalog image files exist. WebP intrinsic dimensions match their width descriptors and recorded metrics.
- Production HTML asset references and all responsive image files were checked in `dist` after building.
- Hero preload candidates/sizes match the image candidates/sizes in regression coverage.
- Full-resolution pixel equivalence was asserted during generation.
- Existing architecture, immutable filtering/sorting, cart/persistence, theme and keyboard handler tests continue passing. Native keyboard navigation, form validation, visual focus and responsive appearance still require real-browser testing; no new manual accessibility pass is claimed.
- No dependencies, package versions, storage keys or business rules changed for this task. No commit or push was performed.

## Changed files

- `index.html`: responsive WebP sources, hero priority/preload, corrected hero dimensions, font discovery/preconnects.
- `src/style.css`: removed the now-duplicate font import; other styles preserved.
- `src/ui.js`: responsive dynamic images and skip equivalent grid renders; all DOM work remains in UI.
- `public/roseveil/*.webp`: 122 generated delivery images, originals preserved.
- `scripts/optimize-images.py`: reproducible generation and full-size pixel verification. Requires Python and Pillow as an offline asset tool; neither is an application dependency.
- `tests/catalog-controls.test.js`: grid-write instrumentation and two new behavior regressions.
- `tests/performance-assets.test.js`: two asset/priority/dimension/accessibility-preservation regressions.
- `docs/image-optimization-metrics.json`: measured image outputs.
- `docs/performance-optimization.md`: this report.

## Exact manual production test

1. In the project terminal run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173`. On PowerShell systems that block npm.ps1, use `npm.cmd` for both commands. Open `http://127.0.0.1:4173/` (not the Vite dev server).
2. Use a clean Chrome profile with all extensions disabled. Incognito alone is insufficient if any extension is allowed in Incognito. Close unrelated tabs and use the same machine, power settings and network for every comparison.
3. Open DevTools ? Lighthouse. Select Navigation mode, Mobile device, and the same categories/settings for every run. Enable Clear storage for consistent cold-load tests. Run three times and record the median Performance score, FCP, LCP, CLS, Speed Index and TBT. Repeat separately for Desktop; do not combine mobile and desktop results. Save the HTML or JSON reports.
4. Treat the earlier score of 33 as an uncontrolled reference. A valid before/after comparison requires the previous version under identical settings; do not describe a new clean-profile result as purely code-caused improvement. Keep production server compression and hosting conditions consistent too.
5. In Network, disable cache and reload. Confirm only one hero candidate downloads, its priority is high, product/category images request WebP, no image/font requests return 404, and `currentSrc` selects a suitable source at 390, 768 and 1440 px widths and high pixel density. Scroll the page to check lazy loading and compare image sharpness, cropping and transparency with the originals.
6. Record a Performance trace while typing in search, opening filters/sort, scrolling and changing cart quantities. Inspect long tasks and layout shifts. Lighthouse navigation does not establish field INP: use a local interaction trace for diagnosis and real-user data for field INP when available. TBT is a lab diagnostic, not an INP replacement.
7. Verify all products, combined search/filter/sort, empty/reset states, cart quantity/promo/refresh persistence, theme persistence, keyboard dialogs and native form validation. Compare light/dark mobile/tablet/desktop appearance and animations. Follow [the keyboard checklist](keyboard-accessibility-audit.md).

Remaining limits: the hero is still 1.32 MB at original resolution because lossless quality was prioritized; external font timing, real hosting compression/cache headers, extension overhead, visual quality of resized variants and actual CWV outcomes remain to be checked in the browser. There is no evidence here to justify removing animations, changing fonts/layout, adding a framework, or forcing dependency updates.
