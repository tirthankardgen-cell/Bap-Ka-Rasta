# Mumbai playable map

[View the branded game map](mumbai-game-map.png) · [SVG original](mumbai-game-map.svg)

This map reads the same road paths, widths, roundabouts, spawn point, building lots and landmark sites used by the game. It shows 227 street segments, 246 boundary buildings, 1,740 interior building lots and 29 numbered landmarks/shops. North is negative game Z; the sea is west. Numbers match the [landmark catalogue](../Mumbai-Landmarks.md).

The map is a guide to the playable environment. It is not the real Mumbai municipal or navigation map. Interior building details and individual street props are omitted for readability.

Regenerate from the repository root:

```sh
node --experimental-strip-types scripts/build-game-map.mts
# Use an installed Playwright Chromium, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
node scripts/render-game-map.mjs
```

The 1600 × 2000 SVG and PNG use the shared BR identity and bundled Barlow font. Regenerate both whenever roads, roundabouts, landmark reservations or building rows change.
