import { writeFileSync, readFileSync } from "node:fs";
import {
  streets,
  streetPath,
  WORLD_BOUNDS,
  SPAWN,
} from "../src/game/network.ts";
import { boundaryBuildings } from "../src/game/boundaries.ts";
const logo = readFileSync("public/brand/br-mark.svg", "utf8").replace(
  "<svg ",
  '<svg x="65" y="55" width="80" height="80" ',
);
const font = readFileSync(
  "node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2",
).toString("base64");
const s = 0.75,
  ox = 550,
  oy = 970;
const point = (x: number, z: number) =>
  `${(ox + x * s).toFixed(2)},${(oy + z * s).toFixed(2)}`;
const paths = streets
  .map(
    (e) =>
      `<path data-street="${e.id}" d="M${streetPath(e.id)
        .map((p) => point(p.x, p.z))
        .join(" L")}" stroke-width="${e.width * s}"/>`,
  )
  .join("");
const buildings = boundaryBuildings
  .map(
    (b) =>
      `<rect x="${(-b.width * s) / 2}" y="${(-b.depth * s) / 2}" width="${b.width * s}" height="${b.depth * s}" transform="translate(${point(b.x, b.z)}) rotate(${(-b.yaw * 180) / Math.PI})"/>`,
  )
  .join("");
const labels = [
  ["CHOWPATTY", -170, -560],
  ["STATION QUARTER", 15, -370],
  ["CHURCHGATE", -170, -115],
  ["FORT", 15, 80],
  ["COLABA", 80, 510],
  ["BAZAAR GALLIS", 520, -110],
] as const;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600"><style>@font-face{font-family:Barlow;src:url(data:font/woff2;base64,${font})}text{font-family:Arial,sans-serif;fill:#23281f}.title{font-family:Barlow}</style><rect width="1600" height="1600" fill="#faf8f0"/>${logo}<text x="168" y="112" class="title" font-size="48">BAP KA RASTA.</text><text x="65" y="220" class="title" font-size="76">MUMBAI · GAME MAP</text><text x="68" y="264" font-size="22">Apna sheher. Apni sawaari. Explore the playable streets.</text><rect x="65" y="300" width="1070" height="1140" rx="26" fill="#cbdeda"/><path d="M${ox + WORLD_BOUNDS.minX * s} 300 H1109 Q1135 300 1135 326 V1414 Q1135 1440 1109 1440 H${ox + WORLD_BOUNDS.minX * s} Z" fill="#e8dfc5"/><g transform="translate(0 -100)"><rect x="${ox + WORLD_BOUNDS.minX * s}" y="${oy + WORLD_BOUNDS.minZ * s}" width="${(WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) * s}" height="${(WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ) * s}" fill="#e8dfc5"/><g fill="#b98c62" stroke="#faf8f0" stroke-width="1">${buildings}</g><g fill="none" stroke="#faf8f0" stroke-linejoin="round" stroke-linecap="round">${paths.replaceAll('stroke-width="', 'stroke-width="')}</g><g fill="none" stroke="#43564f" stroke-linejoin="round" stroke-linecap="round">${paths}</g><circle cx="${ox + 110 * s}" cy="${oy + 180 * s}" r="${22 * s}" fill="#83a17a"/>${labels.map(([name, x, z]) => `<text x="${ox + x * s}" y="${oy + z * s}" text-anchor="middle" font-size="15" font-weight="700">${name}</text>`).join("")}<circle cx="${ox + SPAWN.x * s}" cy="${oy + SPAWN.z * s}" r="9" fill="#ffcc37" stroke="#23281f" stroke-width="3"/><text x="${ox + SPAWN.x * s + 18}" y="${oy + SPAWN.z * s + 5}" font-size="15" font-weight="700">START</text><text x="130" y="900" transform="rotate(-90 130 900)" font-size="23" letter-spacing="5">ARABIAN SEA</text></g><g transform="translate(1175 350)"><path d="M40 85V0M28 20L40 0L52 20" fill="none" stroke="#23281f" stroke-width="4"/><text x="31" y="-15" font-size="22">N</text><text y="160" class="title" font-size="40">YOUR ROUTES</text><text y="203" font-size="20">Wide main avenues</text><text y="238" font-size="20">Two-lane side streets</text><text y="273" font-size="20">Curved bazaar gallis</text><text y="308" font-size="20">Circular Fort junction</text><rect y="370" width="30" height="18" fill="#b98c62"/><text x="43" y="387" font-size="19">Boundary buildings</text><circle cx="15" cy="428" r="10" fill="#ffcc37"/><text x="43" y="435" font-size="19">Driver / auto start</text><text y="510" class="title" font-size="34">FREE ROAM.</text><text y="545" font-size="20">No laps. No finish line.</text><text y="630" font-size="18">Roads and boundaries</text><text y="660" font-size="18">come directly from the</text><text y="690" font-size="18">game's layout data.</text></g><text x="65" y="1500" font-size="22">The playable Mumbai-inspired environment · BR world guide</text><text x="65" y="1540" font-size="18">Authored game layout, not the real city's street map. Scale and routes match the game network.</text></svg>`;
writeFileSync("docs/maps/mumbai-game-map.svg", svg);
console.log(
  `Mapped ${streets.length} playable streets and ${boundaryBuildings.length} boundary buildings.`,
);
