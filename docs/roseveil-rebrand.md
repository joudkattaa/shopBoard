# Roseveil visual identity

The storefront brand is **Roseveil Cosmetics**. Header and footer wordmarks, browser metadata, product names, accessible text, dialogs, and documentation use the new name. Product IDs and prices remain stable.

## Assets

Final images are in `public/roseveil/`. The 27 catalog products and both hero variants were rebranded with the built-in ImageGen tool. The unbranded beauty portrait is copied unchanged. The favicon is `public/roseveil-mark.svg`.

Original image sources are archived in `.local-backup/lumiere-originals/`. Their generation prompts remain in the historical documentation; the storefront references only the Roseveil assets.

Rebranded image manifest:

- `public/roseveil/hero.png`
- `public/roseveil/serum.png`
- `public/roseveil/cream.png`
- `public/roseveil/cleanser.png`
- `public/roseveil/toner.png`
- `public/roseveil/perfume.png`
- `public/roseveil/makeup.png`
- `public/roseveil/hair.png`
- `public/roseveil/masks.png`
- `public/roseveil/gifts.png`
- `public/roseveil/body-cream.png`
- `public/roseveil/body-lotion.png`
- `public/roseveil/body-mist.png`
- `public/roseveil/body-wash.png`
- `public/roseveil/shampoo.png`
- `public/roseveil/conditioner.png`
- `public/roseveil/body-butter.png`
- `public/roseveil/body-scrub.png`
- `public/roseveil/body-oil.png`
- `public/roseveil/hand-cream.png`
- `public/roseveil/lip-balm.png`
- `public/roseveil/cleansing-oil.png`
- `public/roseveil/night-cream.png`
- `public/roseveil/eye-serum.png`
- `public/roseveil/hair-mask.png`
- `public/roseveil/hair-oil.png`
- `public/roseveil/hair-mist.png`
- `public/roseveil/bath-set.png`
- `public/roseveil/hero-mobile.png`

## Final edit prompt

Each source PNG was supplied separately as the edit target with this prompt:

> Use case: text-localization. This image is the edit target. Rebrand every visible instance of LUMIÈRE or LUMIERE on all products, packaging, lids, labels and boxes to the exact uppercase word "ROSEVEIL" (R O S E V E I L). Match the original refined serif typography, bronze or rose gold print, size and perspective naturally. Remove all old brand text completely. Keep all product names and other label text unchanged. Preserve the exact product shapes, colors, materials, layout, lighting, backdrop, props, crop and aspect ratio. Change brand lettering only. No added objects, no UI, no watermark. For hero banners preserve all empty space for the existing HTML copy.

## Shopping bag continuity

The new storage key is `roseveil-shopping-bag-v1`. On first use, the app falls back to the previous shopping bag key so existing selections and GLOW20 remain available. Subsequent writes use the new key.
