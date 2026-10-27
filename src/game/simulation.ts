import {
  streets,
  trafficLane,
  junctions,
  connections,
  geometry,
  lanePosition,
  margin,
  lightFor,
  nearestStreet,
  constrainRoad,
  roadContains,
  SPAWN,
  obstacles,
  crossingPosition,
  type Point,
} from "./network.ts";
export const STEP = 1 / 60;
export type Input = {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
};
export const emptyInput = (): Input => ({
  throttle: false,
  brake: false,
  left: false,
  right: false,
  handbrake: false,
});
export type Turn = {
  node: number;
  edge: number;
  from: number;
  lane: number;
  u: number;
  length: number;
  points: Point[];
};
export type Traffic = {
  id: number;
  edge: number;
  from: number;
  progress: number;
  lane: number;
  speed: number;
  cruise: number;
  x: number;
  z: number;
  yaw: number;
  kind: number;
  turn: Turn | null;
  decisions: number;
};
export type Drive = {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  steer: number;
  distance: number;
  topSpeed: number;
  reverseWait: number;
  cooldown: number;
  impact: number;
  checkpoint: Point & { yaw: number };
  time: number;
  street: string;
  signal: string;
};
export function newDrive(): Drive {
  return {
    ...SPAWN,
    speed: 0,
    steer: 0,
    distance: 0,
    topSpeed: 0,
    reverseWait: 0,
    cooldown: 0,
    impact: 0,
    checkpoint: { ...SPAWN },
    time: 0,
    street: "Marine Drive",
    signal: "",
  };
}
export function newTraffic(): Traffic[] {
  const result: Traffic[] = [];
  for (let i = 0; i < 420 && result.length < 112; i++) {
    const edge = i % streets.length,
      e = streets[edge],
      from =
        e.oneWay || (i + Math.floor(i / streets.length)) % 2 === 0 ? e.a : e.b,
      g = geometry(edge, from),
      lane = trafficLane(edge, i % 3 === 0 ? 7 : 3),
      progress =
        margin(g.length) +
        (g.length - margin(g.length) * 2) *
          ((0.23 + (i % 5) * 0.11 + Math.floor(i / streets.length) * 0.43) % 1);
    const p = lanePosition(edge, from, progress, lane);
    if (Math.hypot(p.x - SPAWN.x, p.z - SPAWN.z) < 32) continue;
    if (result.some((t) => Math.hypot(t.x - p.x, t.z - p.z) < 9)) continue;
    result.push({
      id: i,
      edge,
      from,
      progress,
      lane,
      kind: i % 6,
      speed: 0,
      cruise: i % 6 === 3 ? 7 : 8 + (i % 4),
      turn: null,
      decisions: 0,
      ...p,
    });
  }
  return result;
}
export function bezier(points: Point[], u: number) {
  const [a, b, c, d] = points,
    v = 1 - u;
  const x =
      v * v * v * a.x +
      3 * v * v * u * b.x +
      3 * v * u * u * c.x +
      u * u * u * d.x,
    z =
      v * v * v * a.z +
      3 * v * v * u * b.z +
      3 * v * u * u * c.z +
      u * u * u * d.z;
  const dx =
      3 * v * v * (b.x - a.x) +
      6 * v * u * (c.x - b.x) +
      3 * u * u * (d.x - c.x),
    dz =
      3 * v * v * (b.z - a.z) +
      6 * v * u * (c.z - b.z) +
      3 * u * u * (d.z - c.z);
  return { x, z, yaw: Math.atan2(dx, dz) };
}
function planTurn(t: Traffic): Turn {
  const g = geometry(t.edge, t.from),
    options = connections(g.b.id).filter((c) => c.to !== t.from),
    choices = options.length ? options : connections(g.b.id),
    next = choices[(t.id + t.decisions * 7) % choices.length];
  const ng = geometry(next.edge, g.b.id),
    lane = trafficLane(next.edge, t.lane || 3),
    p0 = lanePosition(t.edge, t.from, g.length - margin(g.length), t.lane),
    p3 = lanePosition(next.edge, g.b.id, margin(ng.length), lane),
    handle = Math.min(20, margin(g.length), margin(ng.length));
  const points = [
    p0,
    {
      x: p0.x + Math.sin(p0.yaw) * handle,
      z: p0.z + Math.cos(p0.yaw) * handle,
    },
    {
      x: p3.x - Math.sin(p3.yaw) * handle,
      z: p3.z - Math.cos(p3.yaw) * handle,
    },
    p3,
  ];
  // Turn through the junction centre instead of clipping the raised corners,
  // including where a narrow two-lane street meets an avenue.
  if (!g.b.ring && Math.abs(g.dx * ng.dx + g.dz * ng.dz) < 0.5) {
    points[1] = { x: g.b.x, z: g.b.z };
    points[2] = { x: g.b.x, z: g.b.z };
  }
  let length = 0,
    last: Point = p0;
  for (let i = 1; i <= 12; i++) {
    const p = bezier(points, i / 12);
    length += Math.hypot(p.x - last.x, p.z - last.z);
    last = p;
  }
  return {
    node: g.b.id,
    edge: next.edge,
    from: g.b.id,
    lane,
    u: 0,
    length: Math.max(1, length),
    points,
  };
}
export function updateTraffic(
  traffic: Traffic[],
  player: Point,
  time: number,
  dt: number,
) {
  for (const t of traffic) {
    const dx = Math.sin(t.yaw),
      dz = Math.cos(t.yaw);
    const blocked = (p: Point, gap: number) => {
      const x = p.x - t.x,
        z = p.z - t.z;
      const forward = x * dx + z * dz,
        lateral = Math.abs(x * dz - z * dx);
      return forward > 0 && forward < gap && lateral < 2.3;
    };
    const ahead =
      traffic.some(
        (other) => other !== t && blocked(other, t.kind === 3 ? 13 : 9),
      ) || blocked(player, 10);
    let target = ahead
      ? 0
      : Math.min(t.cruise, streets[t.edge].width <= 12 ? 6 : t.cruise);
    if (t.turn) {
      target = Math.min(target, 5.5);
      t.speed += Math.max(-6 * dt, Math.min(2.5 * dt, target - t.speed));
      t.turn.u = Math.min(1, t.turn.u + (t.speed * dt) / t.turn.length);
      Object.assign(t, bezier(t.turn.points, t.turn.u));
      if (t.turn.u >= 1) {
        t.edge = t.turn.edge;
        t.from = t.turn.from;
        t.lane = t.turn.lane;
        t.progress = margin(geometry(t.edge, t.from).length);
        t.turn = null;
        t.decisions++;
      }
      continue;
    }
    const g = geometry(t.edge, t.from),
      end = g.length - margin(g.length),
      remaining = end - t.progress;
    const reserved = traffic.some(
      (other) => other !== t && other.turn?.node === g.b.id,
    );
    const go = lightFor(g.b.id, g.dx, g.dz, time) === "green" && !reserved;
    target = Math.min(
      target,
      Math.sqrt(Math.max(0, 2 * 5 * Math.max(0, remaining - (go ? 0 : 0.15)))),
    );
    t.speed += Math.max(-7 * dt, Math.min(2.5 * dt, target - t.speed));
    // At green, creep through the final centimetres; never stop permanently just before a turn.
    if (go && !ahead && remaining < 0.5) t.speed = Math.max(t.speed, 1.5);
    t.progress = Math.min(end, t.progress + t.speed * dt);
    Object.assign(t, lanePosition(t.edge, t.from, t.progress, t.lane));
    if (end - t.progress < 0.05 && go && !ahead) t.turn = planTurn(t);
  }
}
export function resetDrive(s: Drive, traffic: Traffic[]) {
  const near = nearestStreet(s.checkpoint.x, s.checkpoint.z);
  for (let i = 0; i < 100; i++) {
    const edge = i < 20 ? near.edge : (i - 20) % streets.length,
      e = streets[edge],
      canonical = geometry(edge);
    const reverse =
      i < 20 &&
      !e.oneWay &&
      Math.sin(s.checkpoint.yaw) * canonical.dx +
        Math.cos(s.checkpoint.yaw) * canonical.dz <
        0;
    const from = reverse ? e.b : e.a,
      g = geometry(edge, from),
      base = reverse ? g.length - near.progress : near.progress;
    const progress =
      i < 20
        ? Math.max(
            margin(g.length) + 2,
            Math.min(g.length - margin(g.length) - 2, base - i * 5),
          )
        : g.length * 0.5;
    const p = lanePosition(edge, from, progress, trafficLane(edge));
    if (
      !roadContains(p.x, p.z) ||
      traffic.some((t) => Math.hypot(t.x - p.x, t.z - p.z) < 12) ||
      obstacles.some((o) => Math.hypot(o.x - p.x, o.z - p.z) < o.r + 2)
    )
      continue;
    Object.assign(s, {
      x: p.x,
      z: p.z,
      yaw: p.yaw,
      speed: 0,
      steer: 0,
      reverseWait: 0,
      cooldown: 1,
      impact: 0,
    });
    return;
  }
}
export function step(s: Drive, input: Input, traffic: Traffic[], dt = STEP) {
  s.time += dt;
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
  const steeringAngle = s.steer * (0.46 / (1 + Math.abs(s.speed) * 0.24));
  s.yaw += (s.speed / 1.8) * Math.tan(steeringAngle) * dt;
  s.x += Math.sin(s.yaw) * s.speed * dt;
  s.z += Math.cos(s.yaw) * s.speed * dt;
  const boundary = constrainRoad(s.x, s.z);
  if (boundary.hit) {
    s.x = boundary.x;
    s.z = boundary.z;
    if (s.cooldown === 0) {
      s.speed *= 0.22;
      s.impact = 1.2;
      s.cooldown = 0.5;
    }
    s.speed *= Math.exp(-4 * dt);
  }
  updateTraffic(traffic, s, s.time, dt);
  for (const other of [
    ...traffic.map((t) => ({
      x: t.x,
      z: t.z,
      r: t.kind === 3 ? 2.1 : t.kind === 5 ? 1 : 1.5,
    })),
    ...obstacles,
  ]) {
    const dx = s.x - other.x,
      dz = s.z - other.z,
      d = Math.hypot(dx, dz),
      radius = other.r + 1;
    if (d < radius) {
      const nx = d > 0.001 ? dx / d : Math.cos(s.yaw),
        nz = d > 0.001 ? dz / d : -Math.sin(s.yaw);
      s.x += nx * (radius - d);
      s.z += nz * (radius - d);
      if (s.cooldown === 0) {
        s.speed *= -0.1;
        s.cooldown = 0.7;
        s.impact = 1.2;
      }
    }
  }
  let yielding = false;
  for (const n of junctions)
    if (n.signal)
      for (const side of [-1, 1]) {
        const p = crossingPosition(n.id, s.time, side, side === 1 ? 0.72 : 0);
        if (!p.moving) continue;
        const dx = p.x - s.x,
          dz = p.z - s.z,
          d = Math.hypot(dx, dz),
          ahead = dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw),
          across = Math.abs(dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw));
        if (ahead > 0 && ahead < 8 && across < 2.5) {
          s.speed = Math.min(s.speed, Math.max(0, (d - 2.5) * 1.2));
          yielding = true;
        }
        if (d < 2.2) {
          s.x -= (dx / Math.max(0.001, d)) * (2.2 - d);
          s.z -= (dz / Math.max(0.001, d)) * (2.2 - d);
          s.speed = 0;
          yielding = true;
        }
      }
  const final = constrainRoad(s.x, s.z);
  s.x = final.x;
  s.z = final.z;
  if (s.impact === 0)
    s.distance += Math.min(
      Math.hypot(s.x - oldX, s.z - oldZ),
      Math.abs(s.speed) * dt * 1.1,
    );
  s.topSpeed = Math.max(s.topSpeed, Math.abs(s.speed) * 3.6);
  const near = nearestStreet(s.x, s.z);
  s.street = streets[near.edge].name;
  s.signal = yielding ? "pedestrian" : "";
  for (const n of junctions)
    if (n.signal && !yielding) {
      const dx = n.x - s.x,
        dz = n.z - s.z,
        forward = dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw),
        lateral = Math.abs(dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw));
      if (forward > 19 && forward < 65 && lateral < 12) {
        s.signal = lightFor(n.id, Math.sin(s.yaw), Math.cos(s.yaw), s.time);
        break;
      }
    }
  if (
    s.impact === 0 &&
    Math.abs(s.speed) > 1 &&
    traffic.every((t) => Math.hypot(t.x - s.x, t.z - s.z) > 14)
  )
    s.checkpoint = { x: s.x, z: s.z, yaw: s.yaw };
}
