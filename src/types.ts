/** @brief Stable digital level; null means the MCU is not driving the pin. */
export type DigitalLevel = 0 | 1 | null;
export type RuntimeState = "ready" | "running" | "paused" | "stopped";
export interface GpioTransition {
  pin: string;
  level: DigitalLevel;
  cycle: number;
}
/** @brief Bounded output batch. Reading a snapshot drains serial and transitions. */
export interface RuntimeSnapshot {
  cycles: number;
  timeMicros: number;
  state: RuntimeState;
  gpio: Record<string, DigitalLevel>;
  serial: string;
  transitions: GpioTransition[];
}
/** @brief Adapter failure; callers must surface the code/message, never substitute fake execution. */
export class RuntimeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RuntimeError";
  }
}
export const ENGINE_CONTRACT_VERSION = "1.0.0" as const;
export const UNO_CLOCK_HZ = 16_000_000;
export const capabilities = Object.freeze({
  engine: "avr8js",
  engineVersion: "0.21.1",
  board: "arduino-uno",
  mcu: "atmega328p",
  clockHz: UNO_CLOCK_HZ,
  firmwareFormats: ["intel-hex"],
  gpio: true,
  uartTx: true,
  timers: [1],
  unverifiedTimers: [0, 2],
  pwm: false,
  i2c: false,
  spi: false,
  adc: false,
  uartRx: false,
});
