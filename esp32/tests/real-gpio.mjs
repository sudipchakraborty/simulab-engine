import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { Esp32S3Runtime } from "../adapter.mjs";
const cache = new URL("../.cache/", import.meta.url),
  pkg = new URL("esp-emu-0.51.0-wasm/www/pkg/", cache),
  binding = await import(new URL("esp_emu.js", pkg));
binding.initSync({ module: readFileSync(new URL("esp_emu_bg.wasm", pkg)) });
const r = new Esp32S3Runtime(
  binding,
  readFileSync(
    new URL("ESP32_GENERIC_S3-SPIRAM_OCT-20260824-v1.29.0.bin", cache),
  ),
);
r.start();
let serial = "",
  allTransitions = [];
function advanceUntil(predicate, limit = 10000) {
  let s;
  for (let n = 0; n < limit; n++) {
    s = r.runBatch(50000);
    serial += s.serial;
    allTransitions.push(...s.transitions);
    if (predicate(s)) return s;
  }
  throw new Error("Guest condition timeout: " + serial.slice(-1000));
}
advanceUntil(() => serial.includes(">>>"));
function command(text, marker) {
  const start = serial.length;
  r.uartInput(new TextEncoder().encode(text + "\r"));
  return advanceUntil(() =>
    serial.slice(start).includes("\r\n" + marker + "\r\n"),
  );
}
const high = command(
  "from machine import Pin; led=Pin(4,Pin.OUT); led.value(1); print('SIMULAB_HIGH')",
  "SIMULAB_HIGH",
);
console.log("GPIO4 high", high.gpio.GPIO4);
assert.equal(high.gpio.GPIO4, 1);
const low = command("led.value(0); print('SIMULAB_LOW')", "SIMULAB_LOW");
assert.equal(low.gpio.GPIO4, 0);
console.log("GPIO4 low", low.gpio.GPIO4);
command(
  "button=Pin(5,Pin.IN,Pin.PULL_UP); print('INPUT_READY')",
  "INPUT_READY",
);
r.setPin("GPIO5", false);
command("print('INPUT='+str(button.value()))", "INPUT=0");
r.setPin("GPIO5", true);
command("print('INPUT='+str(button.value()))", "INPUT=1");
const memoryCode =
  "try:\n import esp,gc\n print('MEMORY='+str(esp.flash_size())+','+str(gc.mem_free()))\nexcept Exception as e:\n print('MEMORY_UNAVAILABLE='+str(e))\nprint('MEMORY_DONE')";
command("exec(" + JSON.stringify(memoryCode) + ")", "MEMORY_DONE");
const match = serial.match(/\r\nMEMORY=(\d+),(\d+)/);
const memory = match
  ? {
      reportedFlashBytes: Number(match[1]),
      freeGuestHeapBytes: Number(match[2]),
    }
  : { unavailable: true };
const startTime = r.getSimulationTime();
const startTransitions = allTransitions.length;
const code =
  "from machine import Timer\ndef tick(timer):\n led.value(1-led.value())\n print('TICK'+str(led.value()))\ntimer=Timer(0)\ntimer.init(period=250,mode=Timer.PERIODIC,callback=tick)\nprint('TIMER_READY')";
command("exec(" + JSON.stringify(code) + ")", "TIMER_READY");
advanceUntil(
  () =>
    allTransitions.slice(startTransitions).filter((t) => t.pin === "GPIO4")
      .length >= 3,
  20000,
);
const blink = allTransitions
  .slice(startTransitions)
  .filter((t) => t.pin === "GPIO4");
console.log("blink transitions", blink);
const interval = (blink[1].cycle - blink[0].cycle) / 240;
assert.ok(
  interval > 230000 && interval < 270000,
  "Expected approximately250ms sampled GPIO interval",
);
const report = {
  memory,
  diagnostics: r.getDiagnostics(),
  firmware: "MicroPython1.29.0 on real XtensaWASM",
  gpioOutputPassed: true,
  gpioInputPassed: true,
  blinkTransitions: blink,
  intervalMicros: (blink[1].cycle - blink[0].cycle) / 240,
  uart: serial.slice(-4000),
  hardwareComparison: false,
};
writeFileSync(
  new URL("../gpio-report.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
r.dispose();
console.log(JSON.stringify(report, null, 2));
