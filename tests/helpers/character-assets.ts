import { readFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { prepareCharacterModels } from "../../src/game/character-models.ts";

/** Decode the shipped geometry/rigs. Only image decoding is omitted in Node. */
export async function readCharacterModels() {
  const file = await readFile(
    new URL("../../public/models/mumbai-characters.glb", import.meta.url),
  );
  const jsonLength = file.readUInt32LE(12);
  const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  json.materials = json.materials.map((m: { name: string }) => ({
    name: m.name,
    pbrMetallicRoughness: { roughnessFactor: 0.8, metallicFactor: 0 },
  }));
  delete json.images;
  delete json.textures;
  delete json.samplers;
  json.extensionsRequired = json.extensionsRequired.filter(
    (x: string) => x !== "EXT_texture_webp",
  );
  json.extensionsUsed = json.extensionsUsed.filter(
    (x: string) => x !== "EXT_texture_webp",
  );
  const text = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(text.length / 4) * 4, 32);
  text.copy(padded);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length + file.length - 20 - jsonLength, 8);
  header.writeUInt32LE(padded.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const glb = Buffer.concat([header, padded, file.subarray(20 + jsonLength)]);
  const { scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(
      glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength),
      "",
    );
  return prepareCharacterModels(scene);
}
