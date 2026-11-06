/** @file Framework-independent host adapter for the official Espressif ESP-EMU WASM binding.
 * Instruction execution is delegated exclusively to injected WasmEmulator; no AVR or demo fallback exists.
 */
export const ESP_EMULATOR_VERSION = "0.51.0";
export const ESP_ENGINE_CONTRACT_VERSION = "1.0.0";
const ABSENT = new Set([22, 23, 24, 25]);
const RESERVED_N16R8 = new Set([
  26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
]);
/** @brief Reject app-only, non-S3 or unbounded images; this profile uses standard IDF flash offsets. */
export function validateMergedFlash(data) {
  if (
    !(data instanceof Uint8Array) ||
    data.byteLength < 0x10020 ||
    data.byteLength > 16 * 1024 * 1024 ||
    data[0] !== 0xe9
  )
    throw new Error(
      "Expected merged ESP-IDF flash image, at most16MiB, including bootloader/table/application.",
    );
  if ((data[12] | (data[13] << 8)) !== 9)
    throw new Error("Firmware image must target ESP32-S3 (chip ID9).");
  if (data[0x8000] !== 0xaa || data[0x8001] !== 0x50)
    throw new Error(
      "Standard IDF partition table at flash0x8000 is required; app-only binaries are unsupported.",
    );
  if (data[0x10000] !== 0xe9)
    throw new Error(
      "Initial profile requires an application image at flash0x10000.",
    );
  return data;
}
/** @brief Decode output-enable/output-register words without fabricating input or pulse states. */
export function decodeGPIO(words) {
  if (!words || words.length !== 4)
    throw new Error("Invalid ESP-EMU GPIO register snapshot.");
  const gpio = {};
  for (let pin = 0; pin <= 48; pin++) {
    if (ABSENT.has(pin)) continue;
    const bank = pin >= 32 ? 1 : 0;
    const mask = 1 << (pin % 32);
    gpio[`GPIO${pin}`] =
      (words[bank + 2] & mask) !== 0
        ? (words[bank] & mask) !== 0
          ? 1
          : 0
        : null;
  }
  return gpio;
}
/** @brief Initialize the official JS/WASM asset pair. Host supplies URLs; runtime has no Node or UI dependency. */
export async function loadEspBindings({ bindingsUrl, wasmUrl }) {
  if (typeof bindingsUrl !== "string" || typeof wasmUrl !== "string")
    throw new Error("Explicit official binding and WASM URLs are required.");
  const bindings = await import(/* @vite-ignore */ bindingsUrl);
  await bindings.default({ module_or_path: wasmUrl });
  return bindings;
}
/** @brief Real ESP32-S3 adapter. The host owns Worker scheduling and total execution/time/memory limits.
 * @param bindings Object containing the already initialized official WasmEmulator constructor.
 * @param firmware Optional complete standard-offset merged ESP-IDF flash image.
 */
export class Esp32S3Runtime {
  #binding;
  #machine;
  #firmware;
  #state = "empty";
  #serial = "";
  #transitions = [];
  #levels = {};
  #uartListeners = new Set();
  #gpioListeners = new Set();
  constructor(bindings, firmware) {
    if (typeof bindings?.WasmEmulator !== "function")
      throw new Error(
        "An initialized official ESP-EMU WASM binding is required.",
      );
    this.#binding = bindings;
    if (firmware) this.loadFirmware(firmware);
  }
  #requireMachine() {
    if (!this.#machine)
      throw new Error("Load compatible ESP32-S3 firmware first.");
    return this.#machine;
  }
  #initialize() {
    this.#machine?.free();
    this.#machine = undefined;
    const machine = new this.#binding.WasmEmulator("esp32s3");
    try {
      if (
        !machine.is_xtensa() ||
        machine.num_harts() < 1 ||
        machine.num_harts() > 2
      )
        throw new Error("Binding did not initialize ESP32-S3 Xtensa LX7.");
      if (!machine.has_default_rom())
        throw new Error(
          "Official ESP32-S3 ROM is unavailable in this binding.",
        );
      machine.load_default_rom();
      machine.set_boot_from_rom(true);
      machine.load_firmware(this.#firmware);
      this.#machine = machine;
      this.#state = "ready";
      this.#serial = "";
      this.#transitions = [];
      this.#levels = decodeGPIO(machine.gpio_state());
    } catch (error) {
      machine.free();
      throw error;
    }
  }
  loadFirmware(data) {
    this.#firmware = new Uint8Array(validateMergedFlash(data));
    this.#initialize();
  }
  start() {
    this.#requireMachine();
    if (!["ready", "stopped"].includes(this.#state))
      throw new Error("Start requires ready or stopped firmware.");
    if (this.#state === "stopped") this.#initialize();
    this.#state = "running";
  }
  pause() {
    if (this.#state !== "running")
      throw new Error("Pause requires running firmware.");
    this.#state = "paused";
  }
  resume() {
    if (this.#state !== "paused")
      throw new Error("Resume requires paused firmware.");
    this.#state = "running";
  }
  stop() {
    this.#requireMachine();
    this.#state = "stopped";
  }
  reset() {
    this.#requireMachine();
    this.#initialize();
  }
  getState() {
    return this.#state;
  }
  getDiagnostics() {
    const m = this.#requireMachine();
    const count = m.num_harts();
    return {
      isXtensa: m.is_xtensa(),
      reportedHarts: count,
      programCounters: Array.from({ length: count }, (_, i) => m.hart_pc(i)),
      clockMHz: m.cycles_per_us(),
    };
  }
  getGPIOState() {
    return decodeGPIO(this.#requireMachine().gpio_state());
  }
  getSimulationTime() {
    const machine = this.#requireMachine();
    return machine.cycles() / machine.cycles_per_us();
  }
  setGPIOInput(pin, value) {
    if (
      !Number.isInteger(pin) ||
      pin < 0 ||
      pin > 48 ||
      ABSENT.has(pin) ||
      typeof value !== "boolean"
    )
      throw new Error(
        "Expected an available ESP32-S3 GPIO number and boolean level.",
      );
    if (RESERVED_N16R8.has(pin))
      throw new Error(
        "GPIO is flash/PSRAM reserved for the N16R8 board profile.",
      );
    this.#requireMachine().gpio_set_input(pin, value);
  }
  setPin(pin, value) {
    if (typeof pin !== "string" || !/^GPIO(?:[0-9]|[1-4][0-9])$/.test(pin))
      throw new Error(
        "ESP32-S3 input names must use GPIO<number>; AVR pin names are not accepted.",
      );
    this.setGPIOInput(Number(pin.slice(4)), value);
  }
  uartInput(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.byteLength > 4096)
      throw new Error("UART input must be at most4096 bytes.");
    this.#requireMachine().uart_input(bytes);
  }
  subscribeGPIOChanges(listener) {
    if (typeof listener !== "function")
      throw new Error("GPIO subscriber must be a function.");
    this.#gpioListeners.add(listener);
    return () => this.#gpioListeners.delete(listener);
  }
  subscribeUART(listener) {
    if (typeof listener !== "function")
      throw new Error("UART subscriber must be a function.");
    this.#uartListeners.add(listener);
    return () => this.#uartListeners.delete(listener);
  }
  /** @brief Compatibility alias: budget is instructions, not cycles. Returned time uses actual emulator cycles. */
  runCycles(budget) {
    return this.runBatch(budget);
  }
  runBatch(budget) {
    if (this.#state !== "running")
      throw new Error("ESP32-S3 must be running before instruction execution.");
    if (!Number.isSafeInteger(budget) || budget < 1 || budget > 100000)
      throw new Error("Instruction budget must be an integer1..100000.");
    const machine = this.#requireMachine();
    try {
      const text = machine.run_batch(budget);
      if (typeof text !== "string" || text.length > 4096)
        throw new Error("UART batch exceeds4096 bytes.");
      this.#serial += text;
      if (this.#serial.length > 4096)
        throw new Error("UART pending buffer exceeds4096 bytes.");
      if (text) for (const listener of this.#uartListeners) listener(text);
      const current = decodeGPIO(machine.gpio_state());
      const cycle = machine.cycles();
      for (const pin of Object.keys(current)) {
        if (current[pin] !== this.#levels[pin]) {
          const change = { pin, level: current[pin], cycle };
          this.#transitions.push(change);
          for (const listener of this.#gpioListeners) listener(change);
        }
      }
      this.#levels = current;
      if (machine.needs_restart()) {
        machine.restart();
        this.#levels = decodeGPIO(machine.gpio_state());
      }
      return this.snapshot();
    } catch (error) {
      this.#state = "stopped";
      throw error;
    }
  }
  snapshot() {
    const machine = this.#requireMachine();
    const snapshot = {
      cycles: machine.cycles(),
      timeMicros: this.getSimulationTime(),
      state: this.#state,
      gpio: this.getGPIOState(),
      serial: this.#serial,
      transitions: this.#transitions,
    };
    this.#serial = "";
    this.#transitions = [];
    return snapshot;
  }
  /** @brief Official browser APIs are available; capability presence is separate from firmware acceptance evidence. */
  getCapabilities() {
    return {
      engine: "espressif/esp-emulator",
      version: ESP_EMULATOR_VERSION,
      mcu: "esp32s3",
      architecture: "Xtensa LX7",
      cores: 2,
      budgetUnit: "instructions",
      firmwareFormats: ["esp-idf-merged-flash-standard-offsets"],
      gpio: true,
      uartTx: true,
      uartRx: true,
      clock: "cycles()/cycles_per_us()",
      gpioChanges: "sampled at batch boundaries; not edge callbacks",
      flashPsramOverride: false,
      peripherals: {
        i2cExternalDevice: false,
        spiExternalDevice: false,
        rmtWaveform: false,
        ws2812: false,
      },
      physicalHardwareValidated: false,
    };
  }
  attachI2CDevice() {
    throw new Error(
      "External I2C device callbacks are unsupported by this official browser binding.",
    );
  }
  dispose() {
    this.#machine?.free();
    this.#machine = undefined;
    this.#firmware = undefined;
    this.#state = "empty";
    this.#uartListeners.clear();
    this.#gpioListeners.clear();
  }
}
