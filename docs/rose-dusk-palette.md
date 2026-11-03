# Roseveil design decisions and image attribution

ROSEVEIL Cosmetics uses the supplied Rose Dusk palette. Soft pink and blush dominate the interface; mauve, plum and wine provide restrained accents and gentle gradients. The reference informed color choices, not the storefront name or typography.

## Palette

These working colors interpret the reference rather than claim exact fabric measurements.

| Tone          | Color   | Design role                                |
| ------------- | ------- | ------------------------------------------ |
| Blush Mist    | #e5d8d4 | Pale backgrounds and light packaging       |
| Petal Pink    | #d7b9b5 | Soft accents and packaging                 |
| Dusty Rose    | #c2a3a0 | Packaging and borders                      |
| Mauve Shadow  | #b58f90 | Muted packaging and details                |
| Rose Wood     | #a8797b | Gift boxes and body care packaging         |
| Vintage Plum  | #8b6068 | Hair care packaging and restrained accents |
| Berry Wine    | #78434e | Deeper packaging and accents               |
| Mulberry Wine | #59373e | Deep packaging and decorative details      |
| Deep Raisin   | #36242d | Main text and selected glass bottles       |
| Velvet Noir   | #21171d | Deepest decorative accent                  |

The current light interface uses a #fffafb page surface, #fff1f5 pink surfaces, #a95570 primary accents and #88485f darker accents. The optional dark theme uses burgundy surfaces and rose-gold accents. CSS in src/style.css, src/theme.css and src/responsive.css is the source of truth for interface colors and layout.

## Imagery and attribution

Product and hero images were generated and edited using OpenAI's built-in ImageGen tool for this educational demonstration. They are illustrative concepts, not photographs or claims about real commercial products. Image edits applied ROSEVEIL lettering and coordinated packaging colors while retaining product shapes and composition.

Packaging intentionally varies across the palette. Muted rose-gold hardware, soft lighting, pale blush backgrounds and readable labels connect the collection. The hero preserves uncluttered space for HTML copy. Gift-box imagery follows the same direction: dusty rose for the body collection, petal pink for the hair collection, and mauve for the evening collection. Individual product details remain in src/data.ts.

The current catalog contains 30 products. Product images are served from public/roseveil/ as full-size WebP files and 240-, 480- and 800-pixel responsive variants. The favicon is public/roseveil-mark.svg.

The active full-width hero uses public/roseveil/hero-ivory-classic.jpg (1254 by 1254) and hero-ivory-classic-640.jpg as static fallbacks. The original hero.png remains as source artwork; unused intermediate hero variants have been removed.

The background is public/roseveil/hero-stage-ivory.jpg: warm ivory plaster, marble/travertine supports, a white ceramic vase and blush cherry blossoms. It was prepared with built-in ImageGen using the original beige hero as the style reference, without products, ribbon, organza or text.

Four transparent layers restore the original hero's product selection: hero-layer-classic-tube.png, hero-layer-classic-serum.png, hero-layer-classic-jar.png and hero-layer-classic-pump.png. Each was prepared with ImageGen background extraction from public/roseveil/hero.png, asking to preserve the visible ROSEVEIL lettering, muted mauve/plum colors, rose-gold hardware, proportions and reflections without substituting catalog products. Generated extraction can introduce small differences from the original flattened photograph. Transparent margins were cropped and layers downscaled for web delivery without stretching. A stationary composite was visually inspected before integration.

Products form a compact, tiered still life: the tube and pump sit behind the serum and front cream jar, with restrained overlap and visible brand labels. The tube rests on the raised marble step; the foreground products sit on the lower slab. CSS positions mirror the static fallback composition. Mobile uses a compact side-by-side overlay: copy occupies the left 44%, while the artwork is raised behind the right side and can extend beyond the banner edge; desktop is at most 840 pixels. The tube, serum, jar and pump enter in sequence with 180-millisecond offsets and 1.1-second animations, then hold position. Text stays stationary. IntersectionObserver replays only after the artwork fully leaves and re-enters the viewport. Reduced motion, unavailable observer support and failed asset loads retain the complete static photograph. All five scene images must load before the swap. The scene blends into the full-width beige surface without a card border or label. Soft contact shadows are separate CSS elements behind the products.

The 31 original PNGs (30 catalog images and one hero) remain because the image regression tests require them. [Image optimization metrics](image-optimization-metrics.json) record dimensions, byte sizes and variants; [the performance report](performance-optimization.md) explains delivery decisions. Obsolete prompts and unused alternative images are not part of the current asset manifest.

## Accessibility and verification

Readable text, visible keyboard focus, reduced-motion support and native form validation remain design requirements. Automated dark-theme contrast checks are in tests/theme.test.js; historical findings and verification limits are in the [keyboard audit](keyboard-accessibility-audit.md) and [responsive review](ui-responsive-review.md).

Documentation cleanup does not establish new visual, physical-device, keyboard or native-validation results. Those require browser verification.
