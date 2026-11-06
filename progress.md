# Engine progress

## 2026-11-05 - Phase 2
- Starting independent AVR8js 0.21.1 adapter; documented public contract before implementation.
- Ownership excludes firmware and scripts; firmware specialist supplies reproducibly compiled fixtures.
- Using test-first validation and runtime tests. No firmware execution claim before fixture runs.

## Verification and root review
- Implemented strict framework-independent runtime, HEX loader, pin mapping, timers/UART adapter, opcode recognition validation and structured lifecycle/errors.
- Actual compiled firmware tests passed: D13 Timer1 ISR and UART, alternate D12 binary, external D2 input mirrored to D11 and deterministic reset. Total engine tests:15 passing.
- Root review corrected an impossible stopped-state comparison in resume, hardened invalid opcode input and narrowed capabilities to verified Timer1 (Timer0/2/PWM unverified).
- `npm.cmd run build` passed; `npm.cmd test` passed15; `npm.cmd audit` reported zero vulnerabilities.
- `node scripts/build-firmware.mjs` rebuilt3 genuine AVR binaries with verified local Arduino AVR-GCC7.3.0. Provenance hashes and commands are in firmware/metadata.json.
- docs/AVR_VERIFICATION.json records D13 edges4000163/8000163, exact4000000-cycle interval, UART output and explicit lack of physical hardware comparison.
- Compiled output published only as a local versioned npm tarball to frontend/vendor; no registry/GitHub publication, commits/pushes or deployment.
- Browser integration validates actual LED/UART/lifecycle and alternate-pin output. Firmware/analog/hardware limitations are explicit. No React or Node host APIs in runtime source.

## 2026-11-05 - Commit and push preparation
- User authorized committing/pushing all SimuLab repositories to existing origin/main.
- Fresh build passed and15 engine tests passed, including actual compiled firmware, timer/GPIO/UART and lifecycle checks.
- Added .gitattributes preserving exact C/HEX/ELF fixture bytes, protecting recorded provenance hashes across platforms. Local toolchain and node_modules/dist remain ignored.
- Engine0.2.0, firmware provenance, reproducible build scripts, versioned contracts and limits are included. Final remote synchronization is checked after push.

## ESP32-S3 extension
- PhaseA graphics/pinout tests passed before real firmware execution.
- Added explicit S3 adapter with injected officialWASM bindings, format validation, lifecycle, sampledGPIO, UART RX/TX, input and capabilities. Original UnoRuntime remains unchanged.
- Official emulator0.51.0 archive hash matched release digest. Assets are acquired by esp32/setup-assets.mjs into ignored local cache, with published notices and manifest.
- Genuine MicroPython1.29.0/ESP-IDF firmware booted from actualS3 ROM. Real GPIO/UART/input/timer evidence is in esp32/boot-report.json and gpio-report.json. Two harts reported; sampled timer interval near249ms for250ms requested.
- Reference firmware reports4MiB flash and8311216 bytes free guest heap. Browser memory sizing is not configurable; fullN16R8 is unverified.
- Added shared createMcuEngine facade/lifecycle/subscriptions/target-specific budget capabilities without changing AVR execution.
- External I2C/DS1307 and WS2812/RGB callbacks remain unavailable; capability errors are explicit. Reset reloads originalflash rather than persisting filesystem changes. Hardware parity unverified.

## Final milestone verification - 2026-11-06
- Engine strict build and17/17 Vitest checks passed, preserving original AVR firmware behavior and testing the new shared facade.
- ESP adapter/binding checks5/5 passed, including real WASM initialization. Real boot/GPIO/input/timer scripts also passed with actual guest UART evidence (separate from contract doubles).
- Frontend validation71/71, development Chromium11/11 and production Chromium5/5 passed. The browser observes no AVR Worker on theS3 path and verifies SW1/BOOT input plus RST/lifecycle.
- Both npm dependency audits report zero vulnerabilities. Frontend verify:assets validates officialJS/WASM, referenceimage, original AVR HEX and the versioned engine tarball/lockfile integrity.
- Reference reports4MiB flash and8311216 bytes free heap; fullN16R8 sizing is not claimed. ExternalDS1307/WS2812 interfaces are not exported and remain unsupported.
- Manufacturer metric PDF was independently rendered by root and physical family dimensions confirmed in frontend metadata/rendering. ExactV1.3 revision/installed module and physical hardware parity remain unverified.
- No backend changes, Git commits/pushes, deployments, system package installs or purchases for this milestone. PDF analysis dependencies and downloaded tools stay in ignored local cache.

## Commit and push preparation - 2026-11-06
- User authorized publishing current work to existing origin/main.
- Fresh strict build and17 tests passed; ESP adapter/binding5 checks and genuine firmware boot/GPIO/input/timer evidence scripts passed.
- Includes engine0.3 shared facade and injected officialESP32-S3 adapter, pinned provenance/licenses, reproducible local asset setup and observable firmware reports. Original AVR execution remains covered.
- Only expected source, fixtures, notices and reports are included. Ignored local caches/tools are not published.
- Hardware/memory/peripheral limits remain explicit; remote synchronization is checked after push.
