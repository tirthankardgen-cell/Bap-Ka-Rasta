export type BreakRequest = {
  type: "next";
  name: string;
  beforeAd: () => void;
  afterAd: () => void;
  adBreakDone: () => void;
};

/** Request one natural break. Never abandon a visible ad on a loading timeout. */
export function requestExitAd(
  request: ((options: BreakRequest) => void) | undefined,
  finished: () => void,
  waitingLimit = 4000,
) {
  let done = false;
  let showing = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    finished();
  };
  const timer = setTimeout(() => {
    if (!showing) finish();
  }, waitingLimit);
  if (!request) finish();
  else {
    try {
      request({
        type: "next",
        name: "incident-return-home",
        beforeAd: () => {
          if (done) return;
          showing = true;
          clearTimeout(timer);
        },
        afterAd: finish,
        adBreakDone: finish,
      });
    } catch {
      finish();
    }
  }
  return () => {
    done = true;
    clearTimeout(timer);
  };
}
