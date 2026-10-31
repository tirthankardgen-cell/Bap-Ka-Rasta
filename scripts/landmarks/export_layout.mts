import { mkdirSync, writeFileSync } from "node:fs";
import { landmarkSites, landmarkApproaches, mumbaiRoadSigns } from "../../src/game/landmark-layout.ts";
import { streets, streetPath, WORLD_BOUNDS } from "../../src/game/network.ts";
mkdirSync("assets/architecture/mumbai", { recursive: true });
writeFileSync("assets/architecture/mumbai/layout.json", JSON.stringify({
  units: "metres", north: "-Z", sites: landmarkSites, approaches: landmarkApproaches, roadSigns: mumbaiRoadSigns,
  bounds: WORLD_BOUNDS,
  streets: streets.map(s => ({ ...s, points: streetPath(s.id) })),
}, null, 2) + "\n");
console.log(`Exported ${landmarkSites.length} sites and ${streets.length} streets for Blender.`);
