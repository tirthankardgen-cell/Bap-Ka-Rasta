import { SPAWN } from "./network.ts";
import { introDialogue } from "./dialogue.ts";
export const INTRO_DURATION = 10;
export type IntroStage =
  | "ready"
  | "approach"
  | "entering"
  | "seated"
  | "handoff"
  | "done";
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * smooth(t);
export function introFrame(time: number, reducedMotion = false) {
  const t = Math.max(0, time);
  const dialogue = introDialogue(t);
  const stage: IntroStage =
    t < 3
      ? "approach"
      : t < 6
        ? "entering"
        : t < 8
          ? "seated"
          : t < 10
            ? "handoff"
            : "done";
  let x = -275.5,
    y = 2.05,
    z = mix(331, 325, t / 3);
  if (t >= 3) {
    x = mix(-275.5, SPAWN.x, (t - 3) / 3);
    y = mix(2.05, 1.52, (t - 3) / 3);
    z = mix(325, SPAWN.z - 0.08, (t - 3) / 3);
  }
  // Reduced motion uses held shots and fades, never a forced moving viewpoint.
  if (reducedMotion && t < 6) {
    x = -275.5;
    y = 2.05;
    z = 328;
  }
  const fade =
    stage === "handoff"
      ? Math.sin((Math.PI * (t - 8)) / 2)
      : reducedMotion && t >= 5.5 && t < 6.5
        ? Math.sin(Math.PI * (t - 5.5))
        : 0;
  return {
    stage,
    x,
    y,
    z,
    fade: Math.max(0, fade),
    exterior: t >= 9,
    speaker: dialogue.name,
    caption: dialogue.line.subtitle,
    meaning: dialogue.line.meaning,
    clipId: dialogue.line.id,
  };
}
export function advanceIntro(time: number, delta: number, paused: boolean) {
  return paused ? time : Math.min(INTRO_DURATION, time + Math.max(0, delta));
}
