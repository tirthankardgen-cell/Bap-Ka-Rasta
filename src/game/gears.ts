export type Gear = 1 | 2 | 3 | 4;
export const GEARS: readonly Gear[] = [1, 2, 3, 4];
export const GEAR_LIMITS: Record<Gear, number> = { 1: 12, 2: 25, 3: 45, 4: 65 };
const ACCELERATION: Record<Gear, number> = { 1: 2, 2: 2.5, 3: 2.8, 4: 3 };

/** Forgiving automatic clutch: selecting a gear never changes speed immediately. */
export function gearedSpeed(
  speed: number,
  gear: Gear,
  throttle: boolean,
  dt: number,
) {
  const limit = GEAR_LIMITS[gear] / 3.6;
  if (speed > limit) {
    // Gentle engine braking even if the accelerator is held during a downshift.
    return Math.max(limit, speed - 2.2 * dt);
  }
  if (throttle)
    return Math.min(limit, speed + (speed < 0 ? 9 : ACCELERATION[gear]) * dt);
  return (
    Math.sign(speed) *
    Math.max(0, Math.abs(speed) - (0.8 + Math.abs(speed) * 0.035) * dt)
  );
}
export function enginePitch(speed: number, gear: Gear, throttle: boolean) {
  const limit = speed < 0 ? 3.3 : GEAR_LIMITS[gear] / 3.6;
  return (
    0.8 + Math.min(Math.abs(speed) / limit, 1) * 0.65 + (throttle ? 0.12 : 0)
  );
}
