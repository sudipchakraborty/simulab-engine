# Engine contributor instructions

- Update progress.md with substantive changes, actual checks and remaining limitations.
- Runtime must remain independent of React and Node host APIs; inject scheduling and circuit integration through versioned contracts.
- Execute actual compiled firmware with AVR8js; never fake CPU output or silently substitute a demo.
- Use strict TypeScript and Doxygen-compatible public comments. Test input bounds, lifecycle, timers, GPIO, UART and reset before claims.
- Do not change firmware fixture hashes without rebuilding with the documented compiler and recording provenance.
- Do not commit/push/publish/deploy or add payments without explicit authorization.
- Contracts change independently from circuit schema; rebuild/retest/repack before consuming a changed engine artifact.
