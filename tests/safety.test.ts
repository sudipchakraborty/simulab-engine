import { describe, it, expect } from "vitest";
import { parseIntelHex, UnoRuntime } from "../src/index.js";
const record = (address: number, type: number, data: number[]) => {
  const bytes = [data.length, address >> 8, address & 255, type, ...data];
  return (
    ":" +
    [...bytes, -bytes.reduce((a, b) => a + b, 0) & 255]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
};
const program = (data: number[]) =>
  record(0, 0, data) + "\n" + record(0, 1, []);
describe("firmware safety and lifecycle", () => {
  it("stops with explicit error for unrecognized instructions", () => {
    const r = new UnoRuntime(program([255, 255]));
    r.start();
    expect(() => r.runCycles(1)).toThrow(/opcode/);
    expect(r.snapshot().state).toBe("stopped");
  });
  it("rejects sleep rather than pretending it runs", () => {
    const r = new UnoRuntime(program([0x88, 0x95]));
    r.start();
    expect(() => r.runCycles(1)).toThrow(/Sleep/);
  });
  it("rejects large/addressed/truncated firmware", () => {
    expect(() => parseIntelHex("x".repeat(131073))).toThrow();
    expect(() =>
      parseIntelHex(record(0, 4, [0, 1]) + "\n" + program([0, 0])),
    ).toThrow(/flash/);
    expect(() => parseIntelHex(":0200000000FE\n:00000001FF")).toThrow(/length/);
    expect(() => parseIntelHex(":00000001FF")).toThrow(/reset-vector/);
  });
  it("restarts a stopped runtime from power-on state", () => {
    const r = new UnoRuntime(program([0, 0, 255, 207]));
    r.start();
    r.runCycles(123);
    r.stop();
    expect(r.snapshot().cycles).toBeGreaterThan(0);
    r.start();
    expect(r.snapshot().cycles).toBe(0);
  });
  it("snapshot has all digital pins high impedance at reset", () => {
    const r = new UnoRuntime(program([0, 0, 255, 207]));
    const s = r.snapshot();
    expect(Object.keys(s.gpio)).toHaveLength(20);
    expect(Object.values(s.gpio).every((v) => v === null)).toBe(true);
    r.setPin("D2", true);
    expect(r.snapshot().gpio.D2).toBeNull();
  });
});
