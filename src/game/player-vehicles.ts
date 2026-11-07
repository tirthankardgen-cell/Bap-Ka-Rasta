/** Lightweight vehicle settings shared by selection, physics and the renderer. */
export type PlayerVehicleId = "auto" | "scooty";

export const PLAYER_VEHICLES = {
  auto: {
    name: "Auto rickshaw",
    shortName: "Auto",
    model: "mumbai-auto",
    driver: "Sachin",
    driverGender: "male",
    trafficKind: 4,
    automatic: false,
    maxSpeed: 65,
    wheelbase: 1.8,
    clearance: 1,
    reverseSpeed: 3.3,
    eyeHeight: 1.52,
    eyeForward: 0.08,
    driverLookHeight: 1.5,
    driverFov: 70,
    chaseDistance: 7.5,
    chaseHeight: 4.4,
    chaseOffset: 1.8,
    lookAhead: 8,
  },
  scooty: {
    name: "Scooty",
    shortName: "Scooty",
    model: "mumbai-scooty",
    driver: "Riya",
    driverGender: "female",
    trafficKind: 5,
    automatic: true,
    maxSpeed: 60,
    wheelbase: 1.26,
    clearance: 0.55,
    reverseSpeed: 1.2,
    eyeHeight: 1.64,
    eyeForward: -0.2,
    driverLookHeight: 0.7,
    driverFov: 75,
    chaseDistance: 4.8,
    chaseHeight: 2.9,
    chaseOffset: 1.1,
    lookAhead: 5,
  },
} as const;

/** CVT scooter: full speed is available without selecting the auto's gears. */
export function scootySpeed(speed: number, throttle: boolean, dt: number) {
  const limit = PLAYER_VEHICLES.scooty.maxSpeed / 3.6;
  if (speed > limit) return Math.max(limit, speed - 2.5 * dt);
  if (throttle) return Math.min(limit, speed + (speed < 0 ? 9 : 3.2) * dt);
  return Math.sign(speed) * Math.max(0, Math.abs(speed) - (0.9 + Math.abs(speed) * 0.04) * dt);
}
