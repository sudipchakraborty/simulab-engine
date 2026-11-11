# SimuLab engine

Framework-independent MCU adapters, version0.3.0. Existing UnoRuntime/AVR8js0.21.1 remains exported; the ESP32-S3 adapter injects official Espressif ESP Emulator0.51.0 JS/WASM. Runtime code has no React or Node host dependency.

## Develop on Windows11 / Node24

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd test
node esp32/setup-assets.mjs
npm.cmd run test:esp32
npm.cmd run test:esp32:firmware
```

AVR fixtures are genuine AVR-GCC output in firmware/ with compiler/source/ELF/HEX hashes and local compiler scripts. S3 uses the official MicroPython1.29 generic S3 Octal-SPIRAM merged image, booted through actualS3 ROM/WASM; acquisition hashes and real UART/GPIO/timing/memory evidence are in esp32/.

createMcuEngine({target:'atmega328p'}) or createMcuEngine({target:'esp32s3',bindings}) exposes common firmware/lifecycle/GPIO/UART subscriptions/time/capabilities. UnoRuntime remains source-compatible. AVR budgets count cycles; S3 budgets count instructions. Firmware and pins retain architecture-specific identities; incorrect types/targets throw rather than falling back.

Package independently with npm.cmd pack. Frontend consumes the versioned tarball and hosts officialWASM/reference firmware assets itself; runtime never imports sibling repository source. Publish/commit/push/deploy only when authorized.

## Compatibility limits

Uno GPIO, Timer1 CTC, Timer0 D6 PWM period, Timer2 CTC, UART TX/RX and injected TWI are verified; other peripheral modes require independent fixtures. S3 ROM/firmware boot, two reported harts, GPIO4 output/timer and GPIO5 input/UART are verified in the engine and browser. S3 GPIO events are batch samples. Its RGB/WS2812/externalI2C/SPI hooks are unavailable. Reference firmware reports4MiB flash/~8.3MB free heap; fullN16R8 sizing cannot be selected through browser bindings. Physical hardware parity and analog accuracy are not claimed. Reset reloads originalflash and discards runtime filesystem changes.

See docs/CONTRACTS.md, esp32/README.md, firmware/README.md and THIRD_PARTY_NOTICES.md. Asset acquisition stays in ignored local cache; runtime package excludes downloaded compiler/emulator cache files. Licensing/attribution is retained; project distribution license remains unselected.

##0.4 AVR component/IDE hooks

UnoRuntime accepts optional UnoOptions containing an injected I2C byte bus, synchronous onGpioTransition(event,gpio) and onBeforeInputRead(timeMicros,gpio) hooks. Hosts can resolve external device contacts before real PIN/TWI reads. uartInput queues bounded bytes into actual AVRUSART; setPinLevel applies an external digital level with explicit floating fallback. debugSnapshot exposes real PC/SP/SREG/R0-R31; stepInstruction executes one real instruction from ready/paused state. Source/DWARF stepping and physical GDB remain unavailable.

New firmware/peripherals and dynamic-mux fixtures are genuinely AVR-GCC compiled. Rebuild with node scripts/build-peripherals.mjs; separate metadata preserves original fixture provenance. Timer0 PWM period, Timer2 CTC, TWI, UART RX and host hooks are tested. Frontend integration independently checks real TWI RTC reads and a channel change settling before a firmware input read. Physical hardware parity remains untested.

The Arduino CLI generic S3 and compatible N16R8 profiles compile genuine merged firmware. Both booted the S3 ROM and produced actual UART/GPIO4 HIGH/LOW in tests (`esp32/arduino-report.json` and `arduino-n16r8-report.json`). This verifies those examples, not full flash/PSRAM address capacity or physical module identity. Reproduce with `node esp32/tests/arduino-boot.mjs <actual merged.bin> [report-name.json]`. Original ESP32 is build/upload-only; probing the current WASM constructor with esp32 did not provide a Xtensa CPU/default ROM.

## Native AVR profiles (0.5)
`new AvrRuntime(hex, {mcu: 'atmega2560'})` uses a distinct 256 KiB flash, 8 KiB SRAM, 3-byte program counter, Mega port/header mapping and interrupt vectors. `UnoRuntime` remains the explicit ATmega328P compatibility wrapper used by Uno and Nano. Nano A6/A7 ADC-only inputs are not simulated.

Actual AVR GCC fixture `firmware/mega2560.c` covers native D49/A8, D2-to-D4 input, Timer1 and USART0 TX/RX; rebuild with `node scripts/build-mega-firmware.mjs [AVR_BIN]`. Metadata records hashes and compiler provenance. Arduino AVR core1.8.6 Nano/Mega sketches also compiled and executed with genuine UART/millis evidence. USART1/2/3, ADC, SPI and EEPROM are unsupported; Mega timers2-5 have register profiles but have not been independently validated against hardware. No physical hardware comparison was performed.
