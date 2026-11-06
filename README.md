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

Uno GPIO/Timer1/UART TX are verified; advanced AVR peripheral claims remain limited. S3 ROM/firmware boot, two reported harts, GPIO4 output/timer and GPIO5 input/UART are verified in the engine and browser. GPIO events are batch samples. RGB/WS2812/externalI2C/SPI hooks are unavailable. Reference firmware reports4MiB flash/~8.3MB free heap; fullN16R8 sizing cannot be selected through browser bindings. Physical hardware parity and analog accuracy are not claimed. Reset reloads originalflash and discards runtime filesystem changes.

See docs/CONTRACTS.md, esp32/README.md, firmware/README.md and THIRD_PARTY_NOTICES.md. Asset acquisition stays in ignored local cache; runtime package excludes downloaded compiler/emulator cache files. Licensing/attribution is retained; project distribution license remains unselected.
