/** Yield between short setup batches so the loading screen and input keep running. */
export function setupCheckpoint(signal?: AbortSignal) {
  let since = performance.now();
  return async (force = false) => {
    signal?.throwIfAborted();
    if (!force && performance.now() - since < 6) return;
    const scheduler = (globalThis as typeof globalThis & { scheduler?: { yield: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) await scheduler.yield();
    else await new Promise<void>((resolve) => setTimeout(resolve, 0));
    signal?.throwIfAborted();
    since = performance.now();
  };
}

export async function runSetupWork<T>(work: Generator<void, T>, signal?: AbortSignal) {
  const checkpoint = setupCheckpoint(signal);
  await checkpoint(true);
  let step = work.next();
  while (!step.done) {
    await checkpoint();
    step = work.next();
  }
  signal?.throwIfAborted();
  return step.value;
}

/** Offline validators share the exact same construction work without a browser. */
export function runSetupWorkSync<T>(work: Generator<void, T>): T {
  let step = work.next();
  while (!step.done) step = work.next();
  return step.value;
}

export function abortableSetup<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work;
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
