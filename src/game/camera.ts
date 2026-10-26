import type { Vector3 } from "three";

export type CameraMode = "third-person" | "behind-driver" | "driver";

export function followCamera(
  position: Vector3,
  target: Vector3,
  mode: CameraMode,
  dt: number,
  snap = false,
) {
  // Cabin views must share the vehicle's current pose. World-space smoothing
  // makes them fall behind at speed and swing outside the cabin when turning.
  if (snap || mode !== "third-person") position.copy(target);
  else position.lerp(target, 1 - Math.exp(-5 * dt));
}
