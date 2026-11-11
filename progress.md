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

## 2026-11-06 - Components and integrated IDE in progress
- User master request retained at workspace docs/SIMULAB_REQUEST.md; checklist: docs/SIMULAB_IMPLEMENTATION_PLAN.md. Work is on feature/components-ide in all three repositories; no commits/pushes.
- Engine0.4 adds injected AVR TWI bus, bounded USART RX queue, real register inspection and instruction step.18 tests and build passed, including a freshly AVR-GCC compiled peripheral fixture for Timer0 PWM/Timer2/I2C/UART. Versioned local tarball consumed by frontend. Existing firmware fixtures remain unchanged.

### Software verification checkpoint - 2026-11-06
-19 engine tests/build,5 ESP binding tests and actual boot/GPIO scripts passed. Added onBeforeInputRead at AVR PIN/TWI access so delayed contacts settle before firmware reads, plus synchronous GPIO hooks and setPinLevel. A compiled dynamic-mux5us regression failed then passed in frontend integration. Separate C/HEX/ELF provenance is maintained by scripts/build-peripherals.mjs; original fixtures unchanged. Local0.4 tarball integrity verified.

## Final implementation handoff - 2026-11-06
- Engine0.4.0 has parameter-injected AVR TWI, UART RX, GPIO/PIN/TWI-time callbacks, external pin-level application, real instruction stepping and register inspection.19 tests/build,5 official ESP binding checks and real MicroPython boot/GPIO scripts passed. Generic and N16R8-compatible Arduino-CLI S3 binaries also booted and produced real UART/GPIO4 HIGH/LOW; SHA256 reports are in esp32/arduino-report.json and arduino-n16r8-report.json.
- Direct D3/A0 motor drive and unpowered/conflicting WS chains have frontend regressions. Dynamic mux firmware changes channel and reads after5us; host resolves contacts at the actual MCU input read. Original firmware fixtures unchanged; additive C/HEX/ELF fixture provenance and rebuild script included. Updated README/contracts packaged into local0.4 tarball.
- Remaining boundaries: no identified physical target was flashed or used for USB serial/debug/parity. COM3/COM4 were discovered only. Exact YD module/revision and full flash/PSRAM address capacity are unverified. Original ESP32 execution, S3 external I2C/WS waveforms, source/DWARF/GDB debug, encoder variant and full analog/mains/current-safety solving remain unsupported. No commits, pushes or deployment; changes remain on feature/components-ide.

### Final gate closed - 2026-11-06
- Final production Chromium10/10 passed, including actual compiled Arduino S3 browser UART/GPIO4. Frontend99, engine19, ESP adapter5 and backend2 tests passed; builds, asset hashes and audits passed. All4 board compile profiles passed. Both generic and compatible N16R8 S3 Arduino binaries booted with firmware-hash/UART/GPIO evidence. Software implementation complete; physical and explicitly unsupported gates remain documented.
- Final handoff: frontend docs/COMPONENTS_IDE_TEST_REPORT.md and docs/INTEGRATED_IDE.md; backend README.md and docs/TOOLCHAIN_REPORT.json; workspace docs/SIMULAB_IMPLEMENTATION_PLAN.md. Changes remain local/uncommitted on feature/components-ide. Temporary verification companion is stopped after testing; start npm.cmd start in simulab-backend for a new private pairing token.

## 2026-11-06 - Native AVR profiles for account/component milestone
- Added reusable parameterized AvrRuntime and backwards-compatible UnoRuntime, distinct ATmega2560 flash/SRAM/native headers/vector/timer/USART0/TWI profiles; default bounds preserve ATmega328P behavior.
- Added actual GCC Mega fixture and reproducible provenance builder, explicit extended-HEX test and real CPU high-register GPIO/input/Timer1/UART/3-byte-PC regression. 21 engine tests passed; build passed. Nano/Mega actual Arduino AVR1.8.6 compile/run produced UART millis0/50/100/150/200, MegaD49 HIGH.
- Frontend consumes version0.5.0 packed engine. Mega USART1-3/ADC/SPI/EEPROM and physical comparisons remain unsupported; timers2-5 lack independent hardware parity. No commits/push/deploy.

## Final gate closed - 2026-11-06, milestone0.5
- Frontend140/140 unit/component tests, engine21/21, ESP adapter5/5 and backend10/10 passed. Latest strict TS/Vite build and vendored executable/firmware/engine hashes passed; all3 production dependency audits reported0vulnerabilities.
- Final production Chromium21/21 passed with real account API/outbox (no auth bypass), actual CLI Uno compile/run, genuine S3 compiled image and native Nano/Mega Workers/instruction debugger. No optional tests skipped. Compiler tests serialize single-job companion use; test login is worker-scoped to respect production rate limiting.
- Dark/light account/studio screenshots reviewed; header layout corrected. Signup/verification, trial denial across Save/export/CtrlS/autosave/serial export, identity isolation, theme reload and reset verified. Backend tests cover HMAC authenticity/amount/replay, ownership/RBAC, SMTP encryption, session-stream revocation and trial start.
- App running http://127.0.0.1:5174 (HTTP200), API4320 via /api proxy (HTTP200), compiler companion4317. Private local development outbox: backend .local/mail-outbox; messages are NOT delivered email. Live SMTP/provider/price/currency/QR remain unconfigured. No real charge, hardware upload/comparison, commit/push or deployment.
- Handoff: frontend docs/ACCOUNTS_COMPONENTS_REPORT.md, src/models/README.md, backend README.account.md/.env.accounts.example and engine firmware/mega2560-metadata.json. Full analog/SPICE, ADC/SPI/EEPROM/MegaUSART1-3, vendor robot protocols and source/GDB debugging remain explicit limits.

## 2026-11-11 - Checked release commit and branch publication
- User explicitly requested checking, committing and pushing all3 repositories. Publishing current feature/components-ide branch to origin; main is preserved.
- Fresh engine gates passed:21 AVR/runtime tests,5 ESP adapter tests, strict TypeScript build, production dependency audit0vulnerabilities. Intentional compiled C/HEX/ELF test fixtures/provenance remain versioned; toolchain caches and runtime outputs remain ignored.
- Candidate source/docs/fixtures audit found no private keys, GitHub tokens, live companion token or credential-bearing URLs. Repo branch/remotes were fetched and reviewed. Existing physical hardware and unsupported peripheral limits remain documented; no hardware operation or deployment performed.
