import test from "node:test";
import assert from "node:assert/strict";
import {
  Esp32S3Runtime,
  validateMergedFlash,
  decodeGPIO,
} from "../adapter.mjs";
function fixture() {
  const data = new Uint8Array(0x10020).fill(255);
  data[0] = 0xe9;
  data[12] = 9;
  data[13] = 0;
  data[0x8000] = 0xaa;
  data[0x8001] = 0x50;
  data[0x10000] = 0xe9;
  return data;
}
// Contract-only doubles validate host ownership; they never establish MCU execution.
class ContractDouble {
  static instances = [];
  output = 0;
  enabled = 0;
  count = 0;
  freed = false;
  input = [];
  constructor(chip) {
    assert.equal(chip, "esp32s3");
    ContractDouble.instances.push(this);
  }
  is_xtensa() {
    return true;
  }
  num_harts() {
    return 2;
  }
  has_default_rom() {
    return true;
  }
  load_default_rom() {}
  set_boot_from_rom(value) {
    assert.equal(value, true);
  }
  load_firmware(data) {
    assert.equal(data[0], 0xe9);
  }
  cycles() {
    return this.count;
  }
  cycles_per_us() {
    return 240;
  }
  gpio_state() {
    return new Uint32Array([this.output, 0, this.enabled, 0]);
  }
  gpio_set_input(pin, value) {
    this.input.push([pin, value]);
  }
  run_batch(count) {
    this.count += count;
    this.output = 1 << 4;
    this.enabled = 1 << 4;
    return "contract-only";
  }
  needs_restart() {
    return false;
  }
  restart() {
    this.count = 0;
    this.output = 0;
    this.enabled = 0;
  }
  free() {
    this.freed = true;
  }
  hart_pc(hart) {
    return hart + 1;
  }
  uart_input(data) {
    this.uart = data;
  }
}
test("merged-image validation rejects application-only and non-S3 images", () => {
  assert.equal(validateMergedFlash(fixture()).byteLength, 0x10020);
  assert.throws(
    () => validateMergedFlash(new Uint8Array([0xe9, 0, 0])),
    /merged/,
  );
  const data = fixture();
  data[12] = 5;
  assert.throws(() => validateMergedFlash(data), /ESP32-S3/);
  data[12] = 9;
  data[0x8000] = 0;
  assert.throws(() => validateMergedFlash(data), /partition/);
});
test("GPIO decoder separates output enables and high bank pins", () => {
  const states = decodeGPIO(
    new Uint32Array([1 << 4, 1 << 16, 1 << 4, 1 << 16]),
  );
  assert.equal(states.GPIO4, 1);
  assert.equal(states.GPIO48, 1);
  assert.equal(states.GPIO0, null);
  assert.equal("GPIO22" in states, false);
});
test("adapter lifecycle requires explicit genuine binding; time derives from emulator", () => {
  assert.throws(() => new Esp32S3Runtime({}), /binding/);
  const runtime = new Esp32S3Runtime({ WasmEmulator: ContractDouble });
  assert.throws(() => runtime.start(), /firmware/);
  runtime.loadFirmware(fixture());
  runtime.start();
  const seen = [];
  const off = runtime.subscribeUART((value) => seen.push(value));
  const result = runtime.runBatch(240);
  assert.equal(result.timeMicros, 1);
  assert.equal(result.gpio.GPIO4, 1);
  assert.deepEqual(seen, ["contract-only"]);
  runtime.pause();
  assert.throws(() => runtime.runBatch(1), /running/);
  runtime.resume();
  runtime.stop();
  assert.equal(runtime.getState(), "stopped");
  runtime.reset();
  assert.equal(runtime.getState(), "ready");
  assert.equal(runtime.getSimulationTime(), 0);
  off();
  runtime.dispose();
  assert.equal(ContractDouble.instances.at(-1).freed, true);
});
test("unsupported operations and absent/reserved digital GPIOs fail explicitly", () => {
  const runtime = new Esp32S3Runtime({ WasmEmulator: ContractDouble });
  runtime.loadFirmware(fixture());
  assert.throws(() => runtime.setGPIOInput(22, true), /GPIO/);
  assert.throws(() => runtime.setGPIOInput(35, true), /reserved/);
  assert.throws(() => runtime.attachI2CDevice({}), /unsupported/);
  assert.equal(runtime.getCapabilities().peripherals.i2cExternalDevice, false);
  runtime.start();
  assert.throws(() => runtime.runBatch(100001), /budget/);
  runtime.setGPIOInput(4, false);
  assert.deepEqual(ContractDouble.instances.at(-1).input.at(-1), [4, false]);
});
