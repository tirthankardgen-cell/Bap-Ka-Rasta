export type Pose = { x: number; z: number; yaw: number };
export function renderPose(before: Pose, after: Pose, alpha: number): Pose {
  const t = Math.max(0, Math.min(1, alpha));
  const turn = Math.atan2(
    Math.sin(after.yaw - before.yaw),
    Math.cos(after.yaw - before.yaw),
  );
  return {
    x: before.x + (after.x - before.x) * t,
    z: before.z + (after.z - before.z) * t,
    yaw: before.yaw + turn * t,
  };
}
