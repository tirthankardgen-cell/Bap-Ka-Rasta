import { WORLD_BOUNDS } from "./network.ts";
// Adjacent frontages form the three land-side edges. No buildings on the west/seafront.
export const boundaryBuildings: {
  id: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  yaw: number;
}[] = [];
const { minX, maxX, minZ, maxZ } = WORLD_BOUNDS;
function row(
  length: number,
  place: (distance: number) => { x: number; z: number; yaw: number },
) {
  const count = Math.ceil(length / 22),
    width = length / count;
  for (let i = 0; i < count; i++)
    boundaryBuildings.push({
      id: boundaryBuildings.length,
      ...place((i + 0.5) * width),
      width: width + 0.15,
      depth: 16,
      height: 14 + (i % 5) * 3.4,
    });
}
row(maxX - minX, (d) => ({ x: minX + d, z: minZ + 8, yaw: 0 }));
row(maxX - minX, (d) => ({ x: minX + d, z: maxZ - 8, yaw: Math.PI }));
row(maxZ - minZ, (d) => ({ x: maxX - 8, z: minZ + d, yaw: -Math.PI / 2 }));
