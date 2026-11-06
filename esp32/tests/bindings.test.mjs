import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { Esp32S3Runtime } from "../adapter.mjs";
const pkg = new URL("../.cache/esp-emu-0.51.0-wasm/www/pkg/", import.meta.url);
const wasm = new URL("esp_emu_bg.wasm", pkg);
const image = new URL(
  "../.cache/ESP32_GENERIC_S3-SPIRAM_OCT-20260824-v1.29.0.bin",
  import.meta.url,
);
test(
  "official WASM initializes Xtensa and loads a real merged S3 image without executing it",
  { skip: !existsSync(wasm) || !existsSync(image) },
  async () => {
    const binding = await import(new URL("esp_emu.js", pkg));
    binding.initSync({ module: readFileSync(wasm) });
    const runtime = new Esp32S3Runtime(binding, readFileSync(image));
    const snapshot = runtime.snapshot();
    assert.equal(snapshot.cycles, 0);
    assert.equal(snapshot.state, "ready");
    assert.equal(snapshot.serial, "");
    assert.equal(runtime.getCapabilities().mcu, "esp32s3");
    runtime.dispose();
  },
);
