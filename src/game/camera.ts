import type { Vector3 } from "three";

export type CameraMode = "third-person" | "driver";

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

export function createCameraLook() {
  return {
    yaw: 0,
    pitch: 0,
    dragging: false,
    drag(dx: number, dy: number) {
      this.yaw = Math.atan2(
        Math.sin(this.yaw - dx * 0.006),
        Math.cos(this.yaw - dx * 0.006),
      );
      this.pitch = Math.max(-1.1, Math.min(1.1, this.pitch - dy * 0.006));
    },
    update(dt: number) {
      if (this.dragging) return;
      const decay = Math.exp(-3 * dt);
      this.yaw *= decay;
      this.pitch *= decay;
      if (Math.abs(this.yaw) < 0.001) this.yaw = 0;
      if (Math.abs(this.pitch) < 0.001) this.pitch = 0;
    },
    reset() {
      this.yaw = this.pitch = 0;
      this.dragging = false;
    },
  };
}
