/** Slow, bounded adjustments avoid resolution flicker during short frame spikes. */
export function createRenderBudget(maxRatio: number) {
  let ratio = maxRatio,
    seconds = 0,
    frames = 0,
    good = 0;
  return {
    sample(elapsed: number) {
      seconds += Math.min(elapsed, 0.25);
      frames++;
      if (seconds < 2) return null;
      const ms = (seconds / frames) * 1000;
      seconds = frames = 0;
      const old = ratio;
      if (ms > 24) {
        ratio = Math.max(Math.min(0.65, maxRatio), ratio - 0.1);
        good = 0;
      } else if (ms < 17) {
        if (++good >= 3) {
          ratio = Math.min(maxRatio, ratio + 0.05);
          good = 0;
        }
      } else good = 0;
      return {
        ratio,
        changed: Math.abs(ratio - old) > 0.001,
        shadows: ms < 30,
      };
    },
    reset() {
      seconds = frames = good = 0;
      ratio = maxRatio;
    },
  };
}
