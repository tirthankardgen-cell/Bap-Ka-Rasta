import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, dedup } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const path = new URL("../../public/models/gallery-traffic.glb", import.meta.url);
const manifestPath = new URL("../../assets/vehicles/gallery-traffic/manifest.json", import.meta.url);
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder,
});
const original = await readFile(path);
const doc = await io.readBinary(original);
const packedAlready = doc.getRoot().listExtensionsUsed().some(e => e.extensionName === "EXT_meshopt_compression");
if (!packedAlready) await doc.transform(dedup(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
const packed = await io.writeBinary(doc);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.uncompressed_bytes = packedAlready ? manifest.uncompressed_bytes : original.length;
manifest.bytes = packed.length;
manifest.sha256 = createHash("sha256").update(packed).digest("hex");
manifest.compression = "EXT_meshopt_compression";
await writeFile(path, packed);
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Packed ${manifest.models.length} traffic vehicles: ${original.length} -> ${packed.length} bytes`);
