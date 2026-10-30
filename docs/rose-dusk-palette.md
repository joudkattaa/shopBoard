# Roseveil — Rose Dusk colorway

The supplied fabric moodboard is a color reference. Its name and typography are not part of the storefront brand: the brand remains **Roseveil**.

## Palette interpretation

These working colors interpret the reference rather than claim exact fabric measurements.

| Tone          | Color     | Use                                          |
| ------------- | --------- | -------------------------------------------- |
| Blush Mist    | `#e5d8d4` | Pale backgrounds and light packaging         |
| Petal Pink    | `#d7b9b5` | Signature ribbon, soft accents and packaging |
| Dusty Rose    | `#c2a3a0` | Product packaging and borders                |
| Mauve Shadow  | `#b58f90` | Muted packaging and details                  |
| Rose Wood     | `#a8797b` | Gift boxes and body care packaging           |
| Vintage Plum  | `#8b6068` | Hair care and philosophy band                |
| Berry Wine    | `#78434e` | Primary buttons, announcement and accents    |
| Mulberry Wine | `#59373e` | Hover states and deep packaging              |
| Deep Raisin   | `#36242d` | Main text, footer and selected glass bottles |
| Velvet Noir   | `#21171d` | Deepest decorative gradient accent           |

The light page surface is `#f8f2f0`. Packaging intentionally varies across the palette instead of using a single pink for every product. Muted rose gold hardware and the existing product shapes are retained.

## Image edits

The built-in ImageGen tool recolored each of the 27 catalog photos and both hero variants separately. The existing image was the edit target; the user-supplied moodboard was only a palette reference. Final PNGs remain in `public/roseveil/` so existing product, modal and shopping bag references continue working.

The previous colorway is backed up in `.local-backup/roseveil-before-rose-dusk/`. The unbranded, unused beauty portrait was left unchanged.

Exact prompts, assigned packaging colors and output paths are recorded in [rose-dusk-image-prompts.json](rose-dusk-image-prompts.json).

## Validation

Core text/background pairs were checked mathematically: white on Berry Wine 7.74:1; white on Vintage Plum 5.29:1; Deep Raisin on Blush Mist 10.44:1; muted text on the light page surface 5.72:1; pale footer text on Deep Raisin 9.15:1.

Browser layout, keyboard and native form validation checks remain unverified because the browser access host is unavailable. Forms and their validation attributes were not changed.

## Soft pink refinement

The interface now keeps pink and blush dominant, with pale pink header/footer surfaces, soft rose-to-mauve gradients, and restrained deeper accents. Primary pink buttons use #a95570 with white labels. The varied product images remain unchanged. Earlier contrast figures above describe the initial darker colorway.
