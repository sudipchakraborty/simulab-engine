# SimuLab engine

Independent `@simulab/engine` 0.2.0 package, contract 1.0.0. Executes compiled ATmega328P instructions through pinned AVR8js0.21.1. No React, Node host APIs, Arduino source parser or mock execution is in runtime code. This initial adapter is TypeScript for the existing JavaScript emulator; Rust/WASM infrastructure is future work, not a requirement for executing this verified adapter.

## Development (Windows11 / VS Code)

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd test
npm.cmd pack
```

`new UnoRuntime(hex)` validates Intel HEX. Call `start()`, then bounded `runCycles(160000)` slices from a Worker or native JS host. `pause/resume/stop/reset`, `setPin` and `snapshot` are documented in `docs/CONTRACTS.md`. Clock16MHz, flash32KiB, SRAM2KiB. Byte ordering is explicitly decoded from HEX.

The package is distributed as a versioned npm tarball to the frontend; consumers never import this repository's source. Build and test before repacking. For this workspace run `npm.cmd pack --pack-destination ../simulab-frontend/vendor`, then install the resulting tarball from the frontend. Replacing an existing artifact requires reinstalling it and updating its lockfile integrity. Never publish/push without authorization.

## Verification fixtures

`firmware/` contains C, ELF and Intel HEX outputs plus SHA256 provenance. `scripts/` provides reproducible local toolchain setup/build. See `firmware/README.md`. Tests execute actual compiled firmware: Timer1 interrupt-driven D13 and D12 toggles, UART TX output, input-register D2 to D11 mirroring, pause and deterministic reset. Timing is compared with the register-derived 4,000,000-cycle toggle interval. Physical hardware comparison has not been performed.

## Limits

ATmega328P only; HEX only (no ELF loader). No board auto-detection from HEX. GPIO, Timer1 CTC/interrupts and UART TX are tested. Timer0/2 are configured but unverified. PWM, I2C, SPI, ADC, UART RX, EEPROM, watchdog, sleep, bootloader/fuses and Mega/ESP32 are unsupported or unverified. Unsupported opcodes/operations fail explicitly; there is no synthetic fallback. No analog solver or safety claim.

Cycle budgets1..250000, serial and GPIO event batches4096 each, firmware ASCII text128KiB, flash32KiB. Errors have stable codes. Host must supply scheduling, enforce total session limits and terminate execution on errors. See THIRD_PARTY_NOTICES.md for upstream attribution; project distribution licensing is not yet selected.
