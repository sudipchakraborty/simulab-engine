# ESP32-S3 adapter and firmware evidence

This independent ESM adapter executes through official Espressif ESP Emulator0.51.0 WASM. Public entry is @simulab/engine/esp32; inject initialized WasmEmulator bindings. The standard createMcuEngine facade also supports explicit atmega328p and esp32s3 targets without changing UnoRuntime.

## Reproduce on Windows11 / Node24

```powershell
npm.cmd ci
npm.cmd run build
node esp32/setup-assets.mjs
npm.cmd run test:esp32
npm.cmd run test:esp32:firmware
```

The setup script downloads only into ignored esp32/.cache, validates the official release archive digest and pinned per-file hashes, and extracts locally. No native compiler or system package is installed. Firmware acquisition hashes are locally recorded, not vendor signatures. Asset URLs, versions and licenses are in asset-manifest.json and licenses/.

Boot and GPIO scripts execute real firmware, assert observable results and write boot-report.json/gpio-report.json. Boot uses the official MicroPython1.29.0 generic S3 Octal-SPIRAM merged image (an ESP-IDF-based application), not a newly compiled SimuLab C image. GPIO scripts are sent to its guest UART; actual Xtensa instructions in MicroPython drive/read pins. No host interpreter fabricates GPIO.

Observed: ESP32-S3 ROM boot, MicroPython REPL, two reported Xtensa harts, GPIO4 HIGH/LOW, GPIO5 input0/1, approximately249ms sampled timer interval for250ms requested. Reference firmware reports4MiB flash and about8.3MB free guest heap. The browser binding exposes no flash/PSRAM size setter; full N16R8 capacity is not verified and must not be claimed merely from selecting a physical board profile.

## Contract and limits

Lifecycle is loadFirmware/start/pause/resume/stop/reset. setPin accepts GPIO<number>; setGPIOInput accepts a native numeric GPIO. UART bytes/subscriptions and sampled GPIO events are supported. getCapabilities reports limitations. Batches count instructions (1..100000); snapshots/time use real emulator cycles and clock. GPIO events are sampled at batch boundaries, unsuitable for decoding WS2812 waveforms. Unsupported external I2C attachment throws; SPI/RMT/device callbacks are absent from the current binding.

Merged images must target S3/chipID9 and include bootloader at0, partition table0x8000 and application0x10000. Maximum accepted input resource size16MiB does not promise a16MiB flash model. ELF/app-only/custom-offset binaries are unsupported in this initial profile. Reset/start-after-stop reloads the original image; emulated filesystem/flash writes are discarded. Physical GPIO voltage/current, radio/network behavior, external buses and hardware parity are unverified.

Engine runtime code has no Node/React dependency. Only setup/test scripts use Node host APIs. Frontend hosts the pinned assets in its own public directory and runs this adapter in a separate Worker. No backend/cloud service or native fallback is silently selected.
