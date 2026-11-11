import { AvrRuntime } from "./uno.js";
import {
  capabilities,
  type RuntimeSnapshot,
  type GpioTransition,
} from "./types.js";
import { Esp32S3Runtime, type EspBindings } from "../esp32/adapter.mjs";
export interface McuEngine {
  loadFirmware(firmware: string | Uint8Array): void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  reset(): void;
  runBatch(budget: number): RuntimeSnapshot;
  snapshot(): RuntimeSnapshot;
  getGPIOState(): Record<string, 0 | 1 | null>;
  setGPIOInput(pin: string, high: boolean): void;
  subscribeGPIOChanges(listener: (event: GpioTransition) => void): () => void;
  subscribeUART(listener: (text: string) => void): () => void;
  getSimulationTime(): number;
  getCapabilities(): Record<string, unknown>;
  dispose(): void;
}
export type McuEngineOptions =
  { target: "atmega328p" | "atmega2560" } | { target: "esp32s3"; bindings: EspBindings };
/** @brief Standard firmware/lifecycle/GPIO/UART facade; target and binding are explicit, never inferred from source text.
 * @details AVR batches count cycles; S3 batches count instructions. Query capabilities before scheduling.
 */
export function createMcuEngine(options: McuEngineOptions): McuEngine {
  if (!["atmega328p","atmega2560","esp32s3"].includes(options.target))
    throw new Error("Unsupported MCU target; no fallback is available.");
  if (options.target === "esp32s3" && !options.bindings?.WasmEmulator)
    throw new Error("Initialized official ESP32-S3 WASM binding required.");
  let runtime: AvrRuntime | Esp32S3Runtime | undefined;
  let last: RuntimeSnapshot | undefined;
  const gpioListeners = new Set<(event: GpioTransition) => void>(),
    uartListeners = new Set<(text: string) => void>();
  const requireRuntime = () => {
    if (!runtime)
      throw new Error("Load compatible firmware before this operation.");
    return runtime;
  };
  const engine: McuEngine = {
    loadFirmware(data) {
      if (runtime instanceof Esp32S3Runtime) runtime.dispose();
      if (options.target !== "esp32s3") {
        if (typeof data !== "string")
          throw new Error("ATmega328P requires Intel HEX text.");
        runtime = new AvrRuntime(data,{mcu:options.target});
      } else {
        if (!(data instanceof Uint8Array))
          throw new Error("ESP32-S3 requires merged flash bytes.");
        runtime = new Esp32S3Runtime(options.bindings, data);
      }
      last = runtime.snapshot();
    },
    start() {
      requireRuntime().start();
      last = requireRuntime().snapshot();
    },
    pause() {
      requireRuntime().pause();
      last = requireRuntime().snapshot();
    },
    resume() {
      requireRuntime().resume();
      last = requireRuntime().snapshot();
    },
    stop() {
      requireRuntime().stop();
      last = requireRuntime().snapshot();
    },
    reset() {
      requireRuntime().reset();
      last = requireRuntime().snapshot();
    },
    runBatch(budget) {
      const r = requireRuntime();
      const result =
        r instanceof AvrRuntime ? r.runCycles(budget) : r.runBatch(budget);
      for (const event of result.transitions)
        for (const listener of gpioListeners) listener(event);
      if (result.serial)
        for (const listener of uartListeners) listener(result.serial);
      last = { ...result, serial: "", transitions: [] };
      return result;
    },
    snapshot() {
      const value = requireRuntime().snapshot();
      last = value;
      return value;
    },
    getGPIOState() {
      requireRuntime();
      return { ...last!.gpio };
    },
    setGPIOInput(pin, value) {
      requireRuntime().setPin(pin, value);
    },
    subscribeGPIOChanges(listener) {
      gpioListeners.add(listener);
      return () => {
        gpioListeners.delete(listener);
      };
    },
    subscribeUART(listener) {
      uartListeners.add(listener);
      return () => {
        uartListeners.delete(listener);
      };
    },
    getSimulationTime() {
      requireRuntime();
      return last!.timeMicros;
    },
    getCapabilities() {
      return options.target !== "esp32s3"
        ? { ...capabilities, board:options.target==='atmega2560'?'arduino-mega2560':'arduino-uno-nano', mcu:options.target, timers:options.target==='atmega2560'?[0,1,2,3,4,5]:[0,1,2], unverifiedTimers:options.target==='atmega2560'?[2,3,4,5]:[], uartInstances:[0], budgetUnit: "cycles" }
        : runtime instanceof Esp32S3Runtime
          ? runtime.getCapabilities()
          : {
              engine: "espressif/esp-emulator",
              mcu: "esp32s3",
              budgetUnit: "instructions",
              initialized: false,
            };
    },
    dispose() {
      if (runtime instanceof Esp32S3Runtime) runtime.dispose();
      runtime = undefined;
      last = undefined;
      gpioListeners.clear();
      uartListeners.clear();
    },
  };
  return engine;
}
