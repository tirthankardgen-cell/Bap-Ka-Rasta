import { requestExitAd, type BreakRequest } from "./game-ad-break";

type AdCommand = BreakRequest | { preloadAdBreaks: "on"; onReady: () => void };
declare global {
  interface Window {
    adsbygoogle?: { push: (command: AdCommand) => unknown };
  }
}

let ready = false;
let initialized = false;
let pending = false;

/** Enable only after H5 approval and required privacy/consent setup. */
export function initializeGameAds() {
  const mode = import.meta.env.VITE_GAME_ADS_MODE;
  if (initialized || (mode !== "test" && mode !== "live")) return;
  initialized = true;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6693217545827146";
  script.dataset.adFrequencyHint = "180s";
  if (mode === "test") script.dataset.adbreakTest = "on";
  script.onerror = () => { ready = false; };
  window.adsbygoogle = window.adsbygoogle || ([] as AdCommand[]);
  window.adsbygoogle.push({ preloadAdBreaks: "on", onReady: () => { ready = true; } });
  document.head.appendChild(script);
}

export function showExitAd(onFinished: () => void) {
  if (pending) return () => {};
  pending = true;
  const cancel = requestExitAd(
    ready ? (options) => { window.adsbygoogle!.push(options); } : undefined,
    () => {
      pending = false;
      onFinished();
    },
  );
  return () => {
    cancel();
    pending = false;
  };
}
