let wanted = false;
let pending = false;

/** Invoke directly from a tap, while the browser still grants user activation. */
export function mobileFullscreen(active: boolean) {
  wanted = active;
  const root = document.documentElement;
  if (!active) {
    if (document.fullscreenElement === root)
      void document.exitFullscreen().catch(() => {});
    return;
  }
  if (
    pending ||
    !matchMedia("(any-pointer: coarse)").matches ||
    document.fullscreenElement ||
    !root.requestFullscreen
  )
    return;
  pending = true;
  void root
    .requestFullscreen({ navigationUI: "hide" })
    .then(() => {
      // The user may have gone home while the browser was opening fullscreen.
      if (!wanted && document.fullscreenElement === root)
        return document.exitFullscreen();
    })
    .catch(() => {
      // Unsupported/denied fullscreen must never prevent selection or driving.
    })
    .finally(() => {
      pending = false;
    });
}
