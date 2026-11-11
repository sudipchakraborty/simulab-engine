# Engine API contract 1.0.0

Package @simulab/engine 0.2.0 is independent of React, Node APIs and circuit editor geometry. UnoRuntime consumes bounded compiled Intel HEX and executes AVR instructions through pinned AVR8js 0.21.1. CPU clock is fixed at 16MHz. Public signatures and snapshot fields match PHASE2_PLAN.md.

Lifecycle: constructor state ready; start only from ready/stopped (start from stopped initializes a fresh power-on state; stop retains a final snapshot), pause only running, resume only paused, stop allowed in any state, reset recreates peripherals/CPU and returns ready. runCycles only running; integer budgets1..250000. setPin accepts D0-D13/A0-A5 and boolean levels. snapshot drains pending serial bytes/transitions. Running snapshots reflect output DDR and driven port level; input pins report null (high impedance) regardless of external level.

Intel HEX: max128KiB text,32KiB flash; checksum, EOF, address, overlap, record types and bounds checked. Only data/EOF/extended-linear/extended-segment address records accepted. ELF/binary/source files are unsupported.

Digital GPIO, Timer1 CTC/interrupt, Timer0 D6 PWM period, Timer2 CTC and UART0 TX/RX are verified. An injected logical I2C bus is optional. SPI/ADC/EEPROM/watchdog/sleep/bootloader/fuses remain unsupported. UnoRuntime does not execute Mega or ESP32 firmware; S3 uses its separate adapter. No analog electrical accuracy. Limits: serial4096 bytes per drain, transitions4096 per drain,250000 cycles per call; excess data is truncated with explicit dropped counters in future contract rather than unbounded buffers. Current adapter throws structured RuntimeError on overflow instead of silently dropping evidence.

Hardware comparison has not been performed. Firmware tests prove instruction-emulator output against register/timer expectations, not physical hardware parity.

## Standard MCU interface1.0.0 and S3 adapter
createMcuEngine({target:'atmega328p'}) or createMcuEngine({target:'esp32s3',bindings}) exposes loadFirmware/start/pause/resume/stop/reset/runBatch/snapshot/getGPIOState/setGPIOInput/subscribeGPIOChanges/subscribeUART/getSimulationTime/getCapabilities/dispose. Pass native target firmware and pin names. Wrong target/format/binding fails explicitly. AVR budgets are cycles; S3 budgets are instructions. UnoRuntime remains source-compatible and separately exported. UART input is available on the dedicated target adapters; detailed diagnostics remain target-specific. No generic interface implies support for unexported peripherals.

## Additive0.4 host interfaces

`UnoRuntime(hex, options)` accepts an optional `UnoOptions` object. The injected I2C bus uses `write(address, bytes)` (empty bytes probes ACK) and `read(address, count)` (register-pointer reads). It remains a logical bus, not analog SDA/SCL waveform solving.

`onGpioTransition(event, gpio)` executes synchronously at the actual cycle-stamped pin change. `onBeforeInputRead(timeMicros, gpio)` executes before actual AVR PIN-register and TWI accesses so delayed external devices can settle before firmware observes them. Hosts must not recursively read PIN registers in this callback; they may advance their model clock and apply `setPinLevel` using the provided output snapshot.

`setPinLevel(pin, 0 | 1 | null)` applies external inputs; null uses the AVR pull-up state, otherwise deterministic LOW. Hosts must retain floating/conflict diagnostics: this fallback is not a measured physical voltage. `uartInput(Uint8Array)` queues at most4096 bytes into the real USART. `debugSnapshot()` exposes real PC byte address, SP, SREG and32 registers. `stepInstruction()` requires ready/paused state and executes one real instruction. No source/DWARF mapping, variables, stack or physical GDB is implied.

Timer0 PWM period on D6 and Timer2 CTC interval on D11 are now verified with compiled firmware, in addition to the prior Timer1 fixture. Other PWM pin/mode combinations still require independent fixtures. The existing createMcuEngine facade and S3 adapter remain compatible; these optional AVR host hooks do not substitute another architecture.
