/** @file Reproducible official assets for local ESP32-S3 engine tests. No system installation. */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = new URL("./.cache/", import.meta.url),
  manifest = JSON.parse(
    await readFile(new URL("./asset-manifest.json", import.meta.url), "utf8"),
  );
await mkdir(root, { recursive: true });
const exists = async (url) => {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function ensure(url, name, expected) {
  const destination = new URL(name, root);
  if (!(await exists(destination))) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Asset download failed: ${response.status} ${url}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (hash(bytes) !== expected)
      throw new Error("Downloaded asset hash mismatch: " + name);
    await writeFile(destination, bytes);
  }
  if (hash(await readFile(destination)) !== expected)
    throw new Error("Cached asset hash mismatch: " + name);
  return destination;
}
const archive = await ensure(
  manifest.emulator.url,
  "esp-emu-0.51.0-wasm.tar.gz",
  manifest.emulator.archiveSha256,
);
const check = spawnSync("tar", ["-tzf", fileURLToPath(archive)], {
  encoding: "utf8",
});
if (check.status !== 0) throw new Error(check.stderr || "tar unavailable");
if (
  check.stdout
    .split(/\r?\n/)
    .some(
      (p) =>
        p &&
        (p.startsWith("/") ||
          p.split("/").includes("..") ||
          !p.startsWith("esp-emu-0.51.0-wasm/")),
    )
)
  throw new Error("Unsafe archive path");
if (
  !(await exists(new URL("esp-emu-0.51.0-wasm/www/pkg/esp_emu_bg.wasm", root)))
) {
  const unpack = spawnSync(
    "tar",
    ["-xzf", fileURLToPath(archive), "-C", fileURLToPath(root)],
    { encoding: "utf8" },
  );
  if (unpack.status !== 0) throw new Error(unpack.stderr);
}
for (const asset of manifest.emulator.assets) {
  const path = new URL("esp-emu-0.51.0-wasm/www/pkg/" + asset.name, root);
  if (hash(await readFile(path)) !== asset.sha256)
    throw new Error("Extracted asset hash mismatch: " + asset.name);
}
for (const image of manifest.firmware)
  await ensure(image.url, image.name, image.sha256);
console.log(
  "Official ESP emulator and firmware assets verified; no system packages installed.",
);
