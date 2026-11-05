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
