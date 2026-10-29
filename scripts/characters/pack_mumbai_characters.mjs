/** Compress Blender's export without changing the cast, rigs or mesh hierarchy. */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = new URL("../../", import.meta.url);
const model = fileURLToPath(
  new URL("public/models/mumbai-characters.glb", root),
);
const manifestPath = new URL("assets/characters/mumbai/manifest.json", root);
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });
const originalBytes = (await stat(model)).size;
const doc = await io.read(model);
const alreadyPacked = doc
  .getRoot()
  .listExtensionsUsed()
  .some((e) => e.extensionName === "EXT_meshopt_compression");
const names = doc
  .getRoot()
  .listNodes()
  .map((n) => n.getName());
doc.createExtension(EXTTextureWebP).setRequired(true);
for (const texture of doc.getRoot().listTextures()) {
  // Blender 3.5's ORM gatherer can export white for a packed Separate RGB node.
  // Use the authored channel-packed image verbatim: R=AO, G=roughness, B=metal.
  if (texture.getName() === "cast-orm")
    texture
      .setImage(
        new Uint8Array(
          await readFile(
            new URL("assets/characters/mumbai/cast-orm.png", root),
          ),
        ),
      )
      .setMimeType("image/png");
  const encoded = execFileSync(
    process.env.PYTHON || "python",
    [
      fileURLToPath(new URL("scripts/characters/encode_texture.py", root)),
      texture.getName().includes("basecolor") ? "color" : "data",
    ],
    { input: Buffer.from(texture.getImage()), maxBuffer: 32 * 1048576 },
  );
  texture.setImage(new Uint8Array(encoded)).setMimeType("image/webp");
}
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "high" }));
const packed = await io.writeBinary(doc);
const decoded = await io.readBinary(packed);
const after = decoded
  .getRoot()
  .listNodes()
  .map((n) => n.getName());
if (JSON.stringify(names) !== JSON.stringify(after))
  throw new Error("Packing changed the authored character hierarchy");
await writeFile(model, packed);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.uncompressed_bytes = alreadyPacked
  ? (manifest.uncompressed_bytes ?? originalBytes)
  : originalBytes;
manifest.bytes = packed.byteLength;
manifest.compression = "EXT_meshopt_compression + EXT_texture_webp";
manifest.sha256 = createHash("sha256").update(packed).digest("hex");
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Packed 20 Blender characters and Sachin's cabin assets: ${(originalBytes / 1048576).toFixed(2)} -> ${(packed.byteLength / 1048576).toFixed(2)} MiB`,
);
