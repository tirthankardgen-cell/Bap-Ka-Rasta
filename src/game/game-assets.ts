import { loadAutoRickshaw, disposeAutoModel } from "./auto-model.ts";
import { loadCharacterModels } from "./character-models.ts";
import { loadLandmarkModels } from "./landmark-models.ts";
import { loadTrafficModels } from "./traffic-models.ts";

/** Parallel downloads, with cancellation and cleanup even if only one succeeds. */
export async function loadGameAssets(signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const pending = [
    loadAutoRickshaw(controller.signal),
    loadCharacterModels(controller.signal),
    loadLandmarkModels(controller.signal),
    loadTrafficModels(controller.signal),
  ] as const;
  try {
    const [autoModel, characterModels, landmarkModels, trafficModels] = await Promise.all(pending);
    return { autoModel, characterModels, landmarkModels, trafficModels };
  } catch (error) {
    controller.abort();
    const [auto, cast, landmarks, traffic] = await Promise.allSettled(pending);
    if (auto.status === "fulfilled") disposeAutoModel(auto.value);
    if (cast.status === "fulfilled") disposeAutoModel(cast.value.source);
    if (landmarks.status === "fulfilled") disposeAutoModel(landmarks.value.source);
    if (traffic.status === "fulfilled") disposeAutoModel(traffic.value.source);
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
  disposeAutoModel(assets.landmarkModels.source);
  disposeAutoModel(assets.trafficModels.source);
}
