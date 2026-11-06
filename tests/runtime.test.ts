import { describe, it, expect } from "vitest";
import { parseIntelHex, UnoRuntime } from "../src/index.js";
const hex = ":040000000000FFCF2E\n:00000001FF\n";
describe("bounded Intel HEX loader", () => {
  it("loads compiled opcodes into 32KiB flash", () =>
    expect([...parseIntelHex(hex).slice(0, 4)]).toEqual([0, 0, 255, 207]));
  it("rejects checksum corruption", () =>
    expect(() => parseIntelHex(hex.replace("2E", "2F"))).toThrow(/checksum/i));
  it("requires EOF and rejects post-EOF records", () => {
    expect(() => parseIntelHex(hex.split("\n")[0])).toThrow(/EOF/i);
    expect(() => parseIntelHex(hex + ":00000001FF")).toThrow(/EOF/i);
  });
  it("rejects overlaps", () =>
    expect(() => parseIntelHex(hex.split("\n")[0] + "\n" + hex)).toThrow(
      /overlap/i,
    ));
});
describe("genuine instruction runtime", () => {
  it("advances CPU cycles and resets deterministically", () => {
    const r = new UnoRuntime(hex);
    expect(r.snapshot().state).toBe("ready");
    r.start();
    expect(r.runCycles(100).cycles).toBeGreaterThanOrEqual(100);
    r.pause();
    expect(() => r.runCycles(1)).toThrow();
    r.resume();
    r.runCycles(10);
    r.reset();
    expect(r.snapshot().cycles).toBe(0);
  });
  it("bounds work and inputs", () => {
    const r = new UnoRuntime(hex);
    r.start();
    expect(() => r.runCycles(250001)).toThrow();
    expect(() => r.runCycles(NaN)).toThrow();
    expect(() => r.setPin("D99", true)).toThrow();
    expect(() => r.setPin("D2", 1 as unknown as boolean)).toThrow();
  });
});
