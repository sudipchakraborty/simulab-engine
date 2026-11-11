/** @file Verify genuinely Arduino-CLI-built S3 firmware without reference-image substitution. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Esp32S3Runtime } from "../adapter.mjs";
if (!process.argv[2])
  throw new Error("Pass the actual merged Arduino ESP32-S3 binary path");
const reportName = process.argv[3] ?? "arduino-report.json";
if (!/^[a-z0-9-]+\.json$/.test(reportName))
  throw new Error("Report name must be a plain JSON filename");
const image = readFileSync(resolve(process.argv[2]));
const pkg = new URL("../.cache/esp-emu-0.51.0-wasm/www/pkg/", import.meta.url),
  binding = await import(new URL("esp_emu.js", pkg));
binding.initSync({ module: readFileSync(new URL("esp_emu_bg.wasm", pkg)) });
const report = {
  firmware: resolve(process.argv[2]),
  kind: "actual Arduino CLI compiled S3 firmware",
  firmwareSha256: createHash("sha256").update(image).digest("hex"),
  physicalHardwareComparison: false,
  passed: false,
  serial: "",
  gpio4Levels: [],
  error: "",
};
const levels = new Set();
let runtime, last;
const start = Date.now();
try {
  runtime = new Esp32S3Runtime(binding, image);
  runtime.start();
  for (let n = 0; n < 50000 && Date.now() - start < 60000; n++) {
    last = runtime.runBatch(100000);
    report.serial = (report.serial + last.serial).slice(-32768);
    const level = last.gpio.GPIO4;
    if (level !== null && level !== undefined) levels.add(level);
    if (
      report.serial.includes("SIMULAB COMPILED S3") &&
      levels.has(0) &&
      levels.has(1)
    ) {
      report.passed = true;
      break;
    }
  }
} catch (e) {
  report.error = e.message;
} finally {
  runtime?.dispose();
}
Object.assign(report, {
  gpio4Levels: [...levels],
  cycles: last?.cycles,
  timeMicros: last?.timeMicros,
  wallMs: Date.now() - start,
});
writeFileSync(
  new URL("../" + reportName, import.meta.url),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
