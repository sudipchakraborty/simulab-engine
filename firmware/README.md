# Compiled AVR verification fixtures

These are genuine ATmega328P binaries, compiled from `blink-uart.c` using AVR-GCC. They are not Arduino-function scripts or UI animations.

## Rebuild on Windows11

From `simulab-engine`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-avr-toolchain.ps1
node scripts/build-firmware.mjs
```

The setup script downloads the official Arduino AVR-GCC7.3.0 Windows toolchain under ignored `scripts/.toolchain/`, checks its SHA-256 against the Arduino package-index value, and extracts locally. It does not alter PATH or install system software. For another existing toolchain, pass the bin directory to `node scripts/build-firmware.mjs C:/path/to/avr/bin`, or set `AVR_TOOLCHAIN_BIN`. On WSL/Linux the script accepts a directory containing `avr-gcc`, `avr-objcopy` and `avr-size`; binary hashes may differ with compiler versions.

## Expected behavior

- `blink-uart.hex`: drives Uno D13/PB5 LOW initially, then alternates every250ms through the Timer1 compare-match ISR.
- `alternate-d12.hex`: the same source compiled with `LED_BIT=PB4`, driving Uno D12 instead. This detects hardcoded D13 behavior in integration.
- UART0 transmits `SIMULAB AVR READY\n` on startup, then `LED ON\n` / `LED OFF\n` following transitions.
- Timer1 is CTC, OCR1A15624, prescaler256. Derived reference: `16,000,000 / 256 / (15,624 + 1) = 4` interrupts/second. Compare successive matching GPIO transition cycle counts; initialization and interrupt latency affect the first edge.
- UART uses UBRR0=103 at16MHz (normal16x mode), nominal9600 baud with actual9615.38 baud. This is a register-level UART transmitter, not an injected text stream.

`metadata.json` records compiler version, full compile/objcopy commands, source/ELF/HEX SHA-256 values, sizes, toolchain URL and verified archive hash. `.elf` files preserve the compiler output and `.hex` is the browser load format. `.map` files help inspect linking.

The register definitions come from avr-libc headers included with the official toolchain. Microchip's ATmega328P datasheet is the hardware reference for Timer1 CTC mode, GPIO PORTB/DDRB and USART0 registers. The timing equation is a derived reference, not a physical measurement.

**Physical hardware comparison has not been performed.** Emulator tests must independently verify these outcomes. Fixtures do not establish analog, motor, industrial-safety or Mega/ESP32 behavior.

## Provenance and licensing

Toolchain index: https://downloads.arduino.cc/packages/package_index.json

Toolchain download: https://downloads.arduino.cc/tools/avr-gcc-7.3.0-atmel3.6.1-arduino7-i686-w64-mingw32.zip

The compiler toolchain contains separately licensed compiler/binutils/avr-libc components; it is downloaded for development and not bundled into the application or package. Do not redistribute the archive without reviewing its component license notices. The small fixture source and its generated binaries are SimuLab project artifacts; the project has not yet declared a distribution license for those artifacts.
