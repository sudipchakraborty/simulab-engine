import { readFileSync, writeFileSync } from "node:fs";
import { Esp32S3Runtime } from "../adapter.mjs";
const root = new URL("../.cache/", import.meta.url);
const pkg = new URL("esp-emu-0.51.0-wasm/www/pkg/", root);
const binding = await import(new URL("esp_emu.js", pkg));
binding.initSync({ module: readFileSync(new URL("esp_emu_bg.wasm", pkg)) });
const image = "ESP32_GENERIC_S3-SPIRAM_OCT-20260824-v1.29.0.bin";
const runtime = new Esp32S3Runtime(binding, readFileSync(new URL(image, root)));
runtime.start();
const begin = Date.now();
let serial = "";
let snapshot;
let batches = 0;
for (; batches < 2000 && Date.now() - begin < 45000; batches++) {
  snapshot = runtime.runBatch(50000);
  serial += snapshot.serial;
  if (snapshot.serial)
    console.log("GUEST UART:", JSON.stringify(snapshot.serial));
  if (serial.includes(">>>")) break;
}
const report = {
  emulator: "Espressif ESP-EMU0.51.0 WASM",
  firmware: image,
  architecture: runtime.getCapabilities().architecture,
  batches,
  wallMs: Date.now() - begin,
  cycles: snapshot?.cycles,
  timeMicros: snapshot?.timeMicros,
  serial,
  bootPassed: serial.includes("MicroPython") && serial.includes(">>>"),
  physicalHardwareComparison: false,
};
writeFileSync(
  new URL("../boot-report.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
runtime.dispose();
console.log(JSON.stringify(report, null, 2));
if (!report.bootPassed) process.exitCode = 1;
