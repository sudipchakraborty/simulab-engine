import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createMcuEngine } from "../src/index.js";
it("the standard Uno facade preserves genuine firmware execution and subscriptions", () => {
  const engine = createMcuEngine({ target: "atmega328p" });
  engine.loadFirmware(
    readFileSync(
      new URL("../firmware/blink-uart.hex", import.meta.url),
      "utf8",
    ),
  );
  const uart: string[] = [];
  engine.subscribeUART((s) => uart.push(s));
  engine.start();
  for (let i = 0; i < 3; i++) engine.runBatch(250000);
  expect(uart.join("")).toContain("SIMULAB AVR READY");
  expect(engine.getSimulationTime()).toBeGreaterThan(0);
  expect(engine.getGPIOState().D13).toBe(0);
  expect(engine.getCapabilities().budgetUnit).toBe("cycles");
  engine.pause();
  engine.resume();
  engine.stop();
  engine.reset();
  expect(engine.getSimulationTime()).toBe(0);
  engine.dispose();
});
it("the standard factory rejects architecture substitutions and incompatible firmware", () => {
  expect(() => createMcuEngine({ target: "esp32s3" } as never)).toThrow(
    /binding/i,
  );
  const uno = createMcuEngine({ target: "atmega328p" });
  expect(() => uno.loadFirmware(new Uint8Array([0]))).toThrow(/HEX/);
});
