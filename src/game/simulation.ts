// Metres/seconds; Y is up, forward is +Z, positive yaw turns toward +X.
// With a +Z-facing chase camera, screen-right is -X; left steering increases yaw.
export const RX = 400;
export const RZ = 280;
export const TAU = Math.PI * 2;
export const STEP = 1 / 60;
export type Input = {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
};
export type Traffic = {
  angle: number;
  lane: number;
  speed: number;
  x: number;
  z: number;
  yaw: number;
  kind: number;
};
export type Drive = {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  steer: number;
  distance: number;
  topSpeed: number;
  laps: number;
  gate: number;
  reverseWait: number;
  cooldown: number;
  impact: number;
  checkpoint: number;
  angle: number;
};
export const emptyInput = (): Input => ({
  throttle: false,
  brake: false,
  left: false,
  right: false,
  handbrake: false,
});
export function road(angle: number, lane = 0) {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const length = Math.hypot(RZ * c, RX * s);
  const nx = (RZ * c) / length,
    nz = (RX * s) / length;
  return {
    x: RX * c + nx * lane,
    z: RZ * s + nz * lane,
    yaw: Math.atan2(-RX * s, RZ * c),
    nx,
    nz,
  };
}
export function nearest(x: number, z: number) {
  let angle = Math.atan2(z / RZ, x / RX);
  for (let i = 0; i < 4; i++) {
    const c = Math.cos(angle),
      s = Math.sin(angle);
    const dx = RX * c - x,
      dz = RZ * s - z;
    const first = dx * -RX * s + dz * RZ * c;
    const second =
      RX * RX * s * s + RZ * RZ * c * c - dx * RX * c - dz * RZ * s;
    if (Math.abs(second) > 1)
      angle -= Math.max(-0.2, Math.min(0.2, first / second));
  }
  angle = ((angle % TAU) + TAU) % TAU;
  const p = road(angle);
  return { ...p, angle, offset: (x - p.x) * p.nx + (z - p.z) * p.nz };
}
export function newDrive(): Drive {
  const p = road(0, 4);
  return {
    x: p.x,
    z: p.z,
    yaw: p.yaw,
    angle: 0,
    speed: 0,
    steer: 0,
    distance: 0,
    topSpeed: 0,
    laps: 0,
    gate: 1,
    reverseWait: 0,
    cooldown: 0,
    impact: 0,
    checkpoint: 0,
  };
}
export function newTraffic(): Traffic[] {
  return Array.from({ length: 16 }, (_, i) => {
    const angle = ((i + 1) * TAU) / 17;
    const lane = i % 2 ? -4 : 4;
    const speed = i % 2 ? -8 : 8;
    const p = road(angle, lane);
    return {
      angle,
      lane,
      speed,
      x: p.x,
      z: p.z,
      yaw: p.yaw + (speed < 0 ? Math.PI : 0),
      kind: i % 3,
    };
  });
}
export function resetDrive(s: Drive, traffic: Traffic[]) {
  // Search behind the last safe checkpoint; do not teleport into another vehicle.
  for (let i = 0; i < 32; i++) {
    const angle = (s.checkpoint - i * 0.018 + TAU) % TAU;
    const p = road(angle, 4);
    if (traffic.every((t) => Math.hypot(t.x - p.x, t.z - p.z) > 9)) {
      Object.assign(s, {
        x: p.x,
        z: p.z,
        yaw: p.yaw,
        angle,
        speed: 0,
        steer: 0,
        reverseWait: 0,
        cooldown: 1,
      });
      return;
    }
  }
}
export function step(s: Drive, input: Input, traffic: Traffic[], dt = STEP) {
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.impact = Math.max(0, s.impact - dt);
  const oldX = s.x,
    oldZ = s.z;
  if (input.brake && !input.throttle) {
    if (s.speed > 0.12) {
      s.speed = Math.max(0, s.speed - 9 * dt);
      s.reverseWait = 0;
    } else {
      if (s.speed > 0) s.speed = 0;
      s.reverseWait += dt;
      if (s.reverseWait >= 0.4) s.speed = Math.max(-3.3, s.speed - 3 * dt);
    }
  } else if (input.throttle && !input.brake) {
    s.reverseWait = 0;
    s.speed = Math.min(18.05, s.speed + (s.speed < 0 ? 9 : 4.2) * dt);
  } else {
    s.reverseWait = 0;
    s.speed =
      Math.sign(s.speed) *
      Math.max(0, Math.abs(s.speed) - (0.8 + Math.abs(s.speed) * 0.035) * dt);
  }
  if (input.handbrake) s.speed *= Math.exp(-3 * dt);
  const targetSteer = Number(input.left) - Number(input.right);
  s.steer += (targetSteer - s.steer) * (1 - Math.exp(-8 * dt));
  const steeringAngle = s.steer * (0.46 / (1 + Math.abs(s.speed) * 0.07));
  s.yaw += (s.speed / 1.8) * Math.tan(steeringAngle) * dt;
  s.x += Math.sin(s.yaw) * s.speed * dt;
  s.z += Math.cos(s.yaw) * s.speed * dt;
  let edge = nearest(s.x, s.z);
  if (Math.abs(edge.offset) > 8.5) {
    const correction = edge.offset - Math.sign(edge.offset) * 8.5;
    s.x -= correction * edge.nx;
    s.z -= correction * edge.nz;
    if (s.cooldown === 0) {
      s.speed *= 0.25;
      s.impact = 1.2;
      s.cooldown = 0.6;
    }
    // Cancel motion into the barrier while leaving steering available to recover.
    s.speed *= Math.exp(-4 * dt);
  }
  for (const t of traffic) {
    const metric = Math.hypot(RX * Math.sin(t.angle), RZ * Math.cos(t.angle));
    const ahead = traffic.some(
      (other) =>
        other !== t &&
        other.lane === t.lane &&
        Math.hypot(other.x - t.x, other.z - t.z) < 10 &&
        (other.x - t.x) * Math.sin(t.yaw) + (other.z - t.z) * Math.cos(t.yaw) >
          0,
    );
    const playerAhead =
      Math.hypot(s.x - t.x, s.z - t.z) < 12 &&
      (s.x - t.x) * Math.sin(t.yaw) + (s.z - t.z) * Math.cos(t.yaw) > 0 &&
      Math.abs(nearest(s.x, s.z).offset - t.lane) < 2.5;
    if (!ahead && !playerAhead)
      t.angle = (t.angle + (t.speed / metric) * dt + TAU) % TAU;
    const p = road(t.angle, t.lane);
    Object.assign(t, {
      x: p.x,
      z: p.z,
      yaw: p.yaw + (t.speed < 0 ? Math.PI : 0),
    });
    const dx = s.x - t.x,
      dz = s.z - t.z,
      d = Math.hypot(dx, dz);
    if (d < 2.65) {
      const nx = d > 0.001 ? dx / d : Math.cos(s.yaw),
        nz = d > 0.001 ? dz / d : -Math.sin(s.yaw);
      s.x += nx * (2.65 - d);
      s.z += nz * (2.65 - d);
      if (s.cooldown === 0) {
        s.speed *= -0.15;
        s.cooldown = 0.8;
        s.impact = 1.5;
      }
    }
  }
  // Re-clamp after vehicle contacts, so a push cannot cross a wall.
  edge = nearest(s.x, s.z);
  if (Math.abs(edge.offset) > 8.5) {
    const p = road(edge.angle, Math.sign(edge.offset) * 8.5);
    s.x = p.x;
    s.z = p.z;
  }
  const traveled = Math.hypot(s.x - oldX, s.z - oldZ);
  if (s.impact === 0)
    s.distance += Math.min(traveled, Math.abs(s.speed) * dt * 1.1);
  s.topSpeed = Math.max(s.topSpeed, Math.abs(s.speed) * 3.6);
  const oldAngle = s.angle;
  s.angle = edge.angle;
  let delta = s.angle - oldAngle;
  if (delta < -Math.PI) delta += TAU;
  if (delta > Math.PI) delta -= TAU;
  const target = (s.gate * TAU) / 8;
  const before = (oldAngle - target + TAU) % TAU;
  if (
    delta > 0 &&
    before > TAU - 0.08 &&
    (s.angle - target + TAU) % TAU < 0.08
  ) {
    s.gate++;
    if (s.gate === 9) {
      s.laps++;
      s.gate = 1;
    }
  }
  if (
    s.impact === 0 &&
    Math.abs(edge.offset - 4) < 2 &&
    s.speed > 1 &&
    traffic.every((t) => Math.hypot(t.x - s.x, t.z - s.z) > 12)
  )
    s.checkpoint = s.angle;
}
