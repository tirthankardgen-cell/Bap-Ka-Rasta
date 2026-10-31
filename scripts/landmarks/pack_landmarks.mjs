/** Pack the authored library without changing its named site / LOD hierarchy. */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const model = new URL("../../public/models/mumbai-landmarks.glb", import.meta.url);
const manifestPath = new URL("../../assets/architecture/mumbai/manifest.json", import.meta.url);
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const original = await readFile(model);
const doc = await io.readBinary(original);
const names = doc.getRoot().listNodes().map(n => n.getName());
const alreadyPacked = doc.getRoot().listExtensionsUsed().some(e => e.extensionName === "EXT_meshopt_compression");
if (!alreadyPacked) {
  doc.createExtension(EXTTextureWebP).setRequired(true);
  for (const texture of doc.getRoot().listTextures()) {
    const bytes = execFileSync(process.env.PYTHON || "python", [
      fileURLToPath(new URL("../characters/encode_texture.py", import.meta.url)),
      texture.getName().includes("normal") ? "data" : "color",
    ], { input: Buffer.from(texture.getImage()), maxBuffer: 16*1048576 });
    texture.setImage(new Uint8Array(bytes)).setMimeType("image/webp");
  }
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "high" }));
}
const packed = await io.writeBinary(doc);
const roundtrip = await io.readBinary(packed);
if (JSON.stringify(names) !== JSON.stringify(roundtrip.getRoot().listNodes().map(n=>n.getName()))) throw new Error("Packing changed the landmark hierarchy");
await writeFile(model, packed);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.uncompressed_bytes = alreadyPacked ? manifest.uncompressed_bytes : original.length;
manifest.bytes = packed.length;
manifest.sha256 = createHash("sha256").update(packed).digest("hex");
manifest.compression = "EXT_meshopt_compression + EXT_texture_webp";
await writeFile(manifestPath, JSON.stringify(manifest, null, 2)+"\n");
console.log(`Packed ${manifest.models.length} Mumbai models: ${(original.length/1048576).toFixed(2)} -> ${(packed.length/1048576).toFixed(2)} MiB`);
