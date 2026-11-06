import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { UnoRuntime } from "../src/index.js";
const firmware = (name: string) =>
  readFileSync(new URL(`../firmware/${name}.hex`, import.meta.url), "utf8");
function advance(r: UnoRuntime, cycles: number) {
  let serial = "";
  const transitions: { pin: string; level: 0 | 1 | null; cycle: number }[] = [];
  let snapshot = r.snapshot();
  for (let elapsed = 0; elapsed < cycles; elapsed += 250000) {
    snapshot = r.runCycles(Math.min(250000, cycles - elapsed));
    serial += snapshot.serial;
    transitions.push(...snapshot.transitions);
  }
  return { ...snapshot, serial, transitions };
}
describe("AVR-GCC compiled ATmega328P firmware execution", () => {
  it("executes Timer1 interrupt firmware, toggles D13 and transmits UART bytes", () => {
    const r = new UnoRuntime(firmware("blink-uart"));
    r.start();
    const s = advance(r, 8_500_000);
    expect(s.serial).toContain("SIMULAB AVR READY\n");
    expect(s.serial).toContain("LED ON\n");
    expect(s.serial).toContain("LED OFF\n");
    const changes = s.transitions.filter(
      (t) => t.pin === "D13" && t.cycle > 10000,
    );
    expect(changes.map((t) => t.level)).toEqual([1, 0]);
    expect(
      Math.abs(changes[1].cycle - changes[0].cycle - 4_000_000),
    ).toBeLessThan(200);
    expect(s.timeMicros).toBe(s.cycles / 16);
    expect(s.gpio.D13).toBe(0);
    expect(r.snapshot().serial).toBe("");
    expect(r.snapshot().transitions).toEqual([]);
  }, 30000);
  it("executes a different binary on D12 without fabricated D13 toggles", () => {
    const r = new UnoRuntime(firmware("alternate-d12"));
    r.start();
    const s = advance(r, 4_300_000);
    expect(s.gpio.D12).toBe(1);
    expect(s.gpio.D13).toBeNull();
    expect(s.transitions.some((t) => t.pin === "D12" && t.level === 1)).toBe(
      true,
    );
  }, 30000);
  it("reads externally driven D2 through PIN registers and firmware mirrors it to D11", () => {
    const r = new UnoRuntime(firmware("input-mirror"));
    r.setPin("D2", false);
    r.start();
    expect(r.runCycles(20000).gpio.D11).toBe(0);
    r.setPin("D2", true);
    expect(r.runCycles(20000).gpio.D11).toBe(1);
    r.setPin("D2", false);
    expect(r.runCycles(20000).gpio.D11).toBe(0);
  });
  it("pause retains instruction time and reset reproduces GPIO and UART execution", () => {
    const r = new UnoRuntime(firmware("blink-uart"));
    r.start();
    const first = advance(r, 500000);
    r.pause();
    const paused = r.snapshot();
    expect(() => r.runCycles(100)).toThrow();
    expect(r.snapshot().cycles).toBe(paused.cycles);
    r.reset();
    expect(r.snapshot().state).toBe("ready");
    r.start();
    const second = advance(r, 500000);
    expect(second).toEqual(first);
  });
});
