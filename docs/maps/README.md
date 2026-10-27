# Mumbai playable map

[View the branded game map](mumbai-game-map.png) · [SVG original](mumbai-game-map.svg)

This map reads the same `src/game/network.ts` centreline samples, road widths, spawn position and `src/game/boundaries.ts` building rows used by the game. It shows 75 street segments and 149 boundary buildings. North is negative game Z; the sea is west. Labels identify the game's fictional districts.

The map is a guide to the playable environment. It is not the real Mumbai municipal or navigation map. Interior building details and individual street props are omitted for readability.

Regenerate from the repository root:

```sh
node --experimental-strip-types scripts/build-game-map.mts
# Use an installed Playwright Chromium, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
node scripts/render-game-map.mjs
```

The generated SVG and PNG use the shared BR identity and bundled Barlow font. Regenerate both whenever the road network or boundary rows change.
