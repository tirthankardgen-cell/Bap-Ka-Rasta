# BR / Bap Ka Rasta branding

The landing page's tilted **BR inside a yellow circle** is the canonical identity. The mark is now an outlined SVG drawn from the same Barlow Condensed 800 glyphs, tight spacing, dark ring and -10° letter angle. The landing page, favicon, app icons, share layouts and Mumbai map use this one master; no replacement vehicle icon or new monogram is introduced.

## Ready-to-use assets

| Use | File | Size |
| --- | --- | --- |
| Vector BR master | [br-mark.svg](../../public/brand/br-mark.svg) | Scalable, transparent surround |
| PNG BR master | [br-mark.png](../../public/brand/br-mark.png) | 512 × 512 |
| Favicon | [favicon.svg](../../public/favicon.svg), [favicon.ico](../../public/favicon.ico) | SVG; ICO contains 16, 32 and 48 px |
| Social / Open Graph / X cover | [og-cover.png](../../public/brand/og-cover.png) | 1200 × 630 |
| README / repository cover | [readme-cover.png](../../public/brand/readme-cover.png) | 1600 × 700 |
| Square social cover | [social-square.png](../../public/brand/social-square.png) | 1080 × 1080 |
| Apple home-screen icon | [apple-touch-icon.png](../../public/brand/apple-touch-icon.png) | 180 × 180 |
| App icons | [192 px](../../public/brand/icon-192.png), [512 px](../../public/brand/icon-512.png) | 192 / 512 px |
| Maskable app icon | [maskable-512.png](../../public/brand/maskable-512.png) | 512 px, mark inside safe area |
| Playable Mumbai map | [PNG](../maps/mumbai-game-map.png), [SVG](../maps/mumbai-game-map.svg) | 1600 × 1600 |

The covers reuse the existing generated landing artwork, composed with the canonical vector mark and live project fonts. They are promotional imagery, not gameplay screenshots. The map is generated from the playable road network and boundary building layout.

## Identity rules

- Taxi yellow `#ffcc37`; forest ink `#23281f`; warm ivory `#faf8f0`. Use muted greens only for secondary labels and map water.
- Headings: Barlow Condensed 800. Body/UI: DM Sans 400/600/800.
- Keep the circle, tilt and letter proportions together. Do not stretch, replace BR with a vehicle, or typeset a second inconsistent monogram.
- Leave clear space around the mark of at least one quarter of its diameter. Use the safe-area version for launcher icons.
- Display name: **Bap Ka Rasta**; short mark: **BR**; tagline: **Apna sheher. Apni sawaari.**

## Metadata and hosting

`index.html` provides the canonical URL, description, Open Graph tags, X/Twitter large-image tags, image dimensions/alt text, icons and VideoGame structured data. `public/site.webmanifest` defines standalone presentation, app icons and landscape orientation. `robots.txt` and `sitemap.xml` describe the public landing URL. There is no service worker or offline gameplay promise.

Canonical production URL: `https://bap-ka-rasta.vercel.app/`. Update the canonical, social tags, structured data, sitemap, robots and artwork URL together if the domain changes. Share platforms cache previews; their crawlers must fetch the deployed assets before a new card appears.

For the GitHub repository's social preview, upload `og-cover.png` in repository Settings → General → Social preview. The image is supplied here; the GitHub settings UI is not changed by committing it.

## Rebuilding assets

```sh
npm ci
# Python fontTools is needed only for this optional asset-production step.
python scripts/build_brand_assets.py
# Install the Playwright browser first, or supply PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
node scripts/render-brand-assets.mjs
```

The Python script reads the locally bundled Barlow font. It creates outlined logo masters without a live map service. The Node script uses Playwright to rasterize the vector masters and authored cover layouts; it also packages the multi-size ICO. Original landing artwork is left intact.

## Attribution

Barlow Condensed and DM Sans use the SIL Open Font License; copies are included in [public/brand](../../public/brand/).
Rebuild the playable map with `node --experimental-strip-types scripts/build-game-map.mts` and `node scripts/render-game-map.mjs`. The real municipal research map is separate from this game guide.
