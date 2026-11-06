/** @brief Official ESP-EMU0.51 binding surface used by the adapter. */
export interface EspWasmEmulator {
  free(): void;
  cycles(): number;
  cycles_per_us(): number;
  gpio_state(): Uint32Array;
  gpio_set_input(pin: number, high: boolean): void;
  hart_pc(hart: number): number;
  has_default_rom(): boolean;
  is_xtensa(): boolean;
  num_harts(): number;
  load_default_rom(): void;
  set_boot_from_rom(on: boolean): void;
  load_firmware(bytes: Uint8Array): void;
  run_batch(instructions: number): string;
  needs_restart(): boolean;
  restart(): void;
  uart_input(bytes: Uint8Array): void;
  throttle_delay_ms?(hostNowMs: number): number;
}
export interface EspBindings {
  WasmEmulator: new (chip: string) => EspWasmEmulator;
}
export type DigitalLevel = 0 | 1 | null;
export type EspRuntimeState =
  "empty" | "ready" | "running" | "paused" | "stopped";
export interface EspGpioTransition {
  pin: string;
  level: DigitalLevel;
  cycle: number;
}
export interface EspSnapshot {
  cycles: number;
  timeMicros: number;
  state: Exclude<EspRuntimeState, "empty">;
  gpio: Record<string, DigitalLevel>;
  serial: string;
  transitions: EspGpioTransition[];
}
export const ESP_EMULATOR_VERSION: "0.51.0";
export const ESP_ENGINE_CONTRACT_VERSION: "1.0.0";
export function validateMergedFlash(data: Uint8Array): Uint8Array;
export function decodeGPIO(words: Uint32Array): Record<string, DigitalLevel>;
export function loadEspBindings(options: {
  bindingsUrl: string;
  wasmUrl: string;
}): Promise<EspBindings>;
/** @brief Host-scheduled real Xtensa adapter. runCycles/runBatch budgets count instructions. */
export class Esp32S3Runtime {
  constructor(bindings: EspBindings, firmware?: Uint8Array);
  loadFirmware(bytes: Uint8Array): void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  reset(): void;
  getDiagnostics(): {
    isXtensa: boolean;
    reportedHarts: number;
    programCounters: number[];
    clockMHz: number;
  };
  getState(): EspRuntimeState;
  getGPIOState(): Record<string, DigitalLevel>;
  getSimulationTime(): number;
  setGPIOInput(pin: number, high: boolean): void;
  setPin(pin: string, high: boolean): void;
  uartInput(bytes: Uint8Array): void;
  subscribeGPIOChanges(
    listener: (change: EspGpioTransition) => void,
  ): () => boolean;
  subscribeUART(listener: (data: string) => void): () => boolean;
  runCycles(instructionBudget: number): EspSnapshot;
  runBatch(instructionBudget: number): EspSnapshot;
  snapshot(): EspSnapshot;
  getCapabilities(): {
    engine: string;
    version: string;
    mcu: string;
    architecture: string;
    cores: number;
    budgetUnit: string;
    firmwareFormats: string[];
    gpio: boolean;
    uartTx: boolean;
    uartRx: boolean;
    clock: string;
    gpioChanges: string;
    flashPsramOverride: boolean;
    peripherals: {
      i2cExternalDevice: boolean;
      spiExternalDevice: boolean;
      rmtWaveform: boolean;
      ws2812: boolean;
    };
    physicalHardwareValidated: boolean;
  };
  attachI2CDevice(device: unknown): never;
  dispose(): void;
}
