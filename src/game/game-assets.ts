import { loadAutoRickshaw, disposeAutoModel } from "./auto-model.ts";
import { loadCharacterModels } from "./character-models.ts";

/** Parallel downloads, with cancellation and cleanup even if only one succeeds. */
export async function loadGameAssets(signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const pending = [
    loadAutoRickshaw(controller.signal),
    loadCharacterModels(controller.signal),
  ] as const;
  try {
    const [autoModel, characterModels] = await Promise.all(pending);
    return { autoModel, characterModels };
  } catch (error) {
    controller.abort();
    const [auto, cast] = await Promise.allSettled(pending);
    if (auto.status === "fulfilled") disposeAutoModel(auto.value);
    if (cast.status === "fulfilled") disposeAutoModel(cast.value.source);
    throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

export function disposeGameAssets(
  assets: Awaited<ReturnType<typeof loadGameAssets>>,
) {
  disposeAutoModel(assets.autoModel);
  disposeAutoModel(assets.characterModels.source);
}
