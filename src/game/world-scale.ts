/** Shared physical scale: metres, standing heights include hair / headwear. */
export const CHARACTER_HEIGHTS: Readonly<Record<string, number>> = {
  sachin: 1.73, raju: 1.67, meera: 1.60, sameer: 1.78, aarti: 1.64,
  imran: 1.76, lata: 1.57, patil: 1.80, nilesh: 1.78, farah: 1.65,
  suresh: 1.71, pooja: 1.62, vikram: 1.81, zoya: 1.65, bala: 1.75,
  jyoti: 1.60, shanta: 1.56, dev: 1.76, asha: 1.61, ganesh: 1.70,
};

/** Keep individual variety inside the adult range, including distant batches. */
export function crowdHeightVariation(variant: number, named: boolean) {
  return named ? 1 : 0.97 + (variant % 5) * 0.015;
}

// Body envelopes, not mirrors. Also used for physical vehicle clearance.
export const TRAFFIC_KIND_COUNT = 13;
export function trafficDimensions(kind: number) {
  if (kind === 0) return { width: 1.98, length: 4.42, height: 2.06 };
  if (kind === 1) return { width: 1.98, length: 5.03, height: 2.03 };
  if (kind === 2) return { width: 1.49, length: 3.12, height: 2.04 };
  if (kind === 3) return { width: 2.3, length: 9.4, height: 3.1 };
  if (kind === 4) return { width: 1.45, length: 2.75, height: 2.08 };
  if (kind === 5) return { width: 0.71, length: 1.89, height: 1.81 };
  if (kind === 6) return { width: 0.72, length: 2.13, height: 1.75 };
  if (kind === 7) return { width: 1.78, length: 4.21, height: 1.57 };
  if (kind === 8) return { width: 1.78, length: 4.21, height: 1.71 };
  if (kind === 9) return { width: 1.735, length: 3.91, height: 1.53 };
  if (kind === 10) return { width: 1.625, length: 3.75, height: 1.73 };
  if (kind === 11) return { width: 1.79, length: 4.41, height: 1.75 };
  if (kind === 12) return { width: 1.83, length: 4.89, height: 1.88 };
  return { width: 1.78, length: 4.25, height: 1.55 };
}

/** Minimum separation of the actual oriented body envelopes, excluding mirrors. */
export function vehicleContact(
  player: { x: number; z: number; yaw: number },
  other: { x: number; z: number; yaw: number; kind: number },
) {
  const a = trafficDimensions(4), b = trafficDimensions(other.kind);
  const ac = Math.cos(player.yaw), as = Math.sin(player.yaw);
  const bc = Math.cos(other.yaw), bs = Math.sin(other.yaw);
  const dx = player.x-other.x, dz = player.z-other.z;
  let depth = Infinity, pushX = 0, pushZ = 0;
  for (const [x,z] of [[ac,-as],[as,ac],[bc,-bs],[bs,bc]]) {
    const reach = (Math.abs(x*ac-z*as)*a.width + Math.abs(x*as+z*ac)*a.length +
      Math.abs(x*bc-z*bs)*b.width + Math.abs(x*bs+z*bc)*b.length) / 2;
    const distance = dx*x+dz*z;
    const overlap = reach-Math.abs(distance);
    if (overlap <= 0.000001) return null;
    if (overlap < depth) {
      depth = overlap;
      pushX = x*(distance < 0 ? -1 : 1)*overlap;
      pushZ = z*(distance < 0 ? -1 : 1)*overlap;
    }
  }
  return { x: pushX, z: pushZ };
}
