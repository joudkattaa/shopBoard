# ROSEVEIL Cosmetics — Design Rationale

## Inspiration and development

The design process began with inspiration found on Pinterest, as described by the project author. No specific pin URL or original reference is supplied, so this document records the author's customizations and the implemented design rather than claiming a verified comparison with a particular reference.

The initial direction was developed into ROSEVEIL's own beauty-store identity through a customized palette, replacement product imagery, revised product presentation and a floral brand mark. Search, category filtering and ascending/descending price sorting were added to make the storefront interactive. Later iterations refined the hero composition, mobile text placement and footer proportions.

Repository history records the storefront foundation in `5a70a26` and the ROSEVEIL search/filter/sort and modular architecture work in `69880ec`. The current layered hero and compact footer are subsequent working-tree changes; this document does not imply they have been committed.

## Visual identity

Blush and soft pink lead the interface. Warm beige gives the hero a quieter backdrop, while mauve, burgundy and rose-gold details connect the packaging, accents and optional dark theme.

| Element         | Current treatment                                            |
| --------------- | ------------------------------------------------------------ |
| Light surfaces  | Near-white blush `#fffafb` and soft pink `#fff1f5`           |
| Hero surface    | Warm beige `#f5ece4`, blended into the photographic scene    |
| Primary accents | Dusty rose `#a95570` and deeper rose `#88485f`               |
| Text            | Deep raisin `#36242d`, with muted rose-brown supporting text |
| Dark theme      | Burgundy surfaces, pale text and rose-gold accents           |

Cormorant Garamond provides expressive headings and the serif wordmark; DM Sans supports navigation, product details, controls and body copy. Italic heading accents, restrained letter spacing, subtle borders and rounded controls create hierarchy without adding visual clutter. The header/footer wordmark and floral icon establish consistent branding; the favicon is `public/roseveil-mark.svg`.

## Product presentation and hero

The catalog contains 30 products across seven categories. Five varied products appear initially, with a View All control revealing the complete catalog. Search, category selection and price sorting work together, and product details reuse the existing dialog and shopping-bag actions.

The final hero is a full-width beige composition rather than a separate framed image card. A marble/travertine platform, ceramic vase and blush blossoms support a compact, tiered group of four products: mauve tube, dark serum, cream jar and rose-gold pump. The tube and pump sit behind the foreground products, with light overlap and space for stationary copy on the left.

The product artwork was generated and edited with OpenAI ImageGen. Four transparent PNG layers were prepared from the original ROSEVEIL hero; generated extraction can introduce small edge or reflection differences. A product-free background prevents duplicate products beneath the moving layers. A matching complete photograph provides a static fallback. See [image attribution and palette details](docs/rose-dusk-palette.md).

Products enter with 180-millisecond offsets and 1.1-second transform/opacity animations, then settle. IntersectionObserver rearms the sequence only after the artwork fully leaves the viewport. Reduced motion, failed image loading or unavailable observer support retain the static hero. No animation library is used.

## Layout, spacing and responsive behavior

Mobile-first CSS uses fluid widths, constrained containers and min-width breakpoints. On mobile, compact hero copy remains left-aligned and vertically centered beside the scene. At 800px, the hero adopts its larger desktop proportions. Explicit image dimensions reserve space, and decorative layers use a shared coordinate system.

Product grids expand with available width. The footer uses organized branding, navigation, customer-care and contact groups, plus a newsletter area. Its final revision reduces heading/logo sizes and spacing instead of using an oversized promotional block. Newsletter controls stack on small screens and share a row from 600px; wider footer columns and a two-column newsletter layout apply from 1000px. Typical footer gaps are 18–28px, with 24px invitation padding and restrained dividing borders.

These are the project's departures from the starting Pinterest inspiration: a distinct ROSEVEIL identity, customized imagery and logo, interactive catalog controls, an independently animated layered hero, a mobile overlay composition and a compact footer. They are not claims about features missing from an unidentified source design.

## Accessibility and verification limits

The implementation retains semantic page regions, a skip link, visible keyboard focus, native buttons and dialogs, associated form labels, required fields and email validation. Newsletter signup remains a demonstration: addresses are not saved or sent. Hero artwork has an accessible scene description, while decorative layers use empty image alternatives. Motion preferences are respected, and footer form controls retain at least 44px height.

Regression tests cover catalog interactions, cart persistence, dialog/focus behavior, image dimensions, hero replay, reduced-motion changes and image-loading fallbacks. Validation commands are `npm run typecheck`, `npm run build`, `npm test` and `npm run lint`. These checks do not establish visual quality, full accessibility conformance or cross-device compatibility. Final browser checks should confirm small/large layouts, text/image overlap, keyboard navigation, native form validation and motion behavior.
