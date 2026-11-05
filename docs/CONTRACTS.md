# Engine API contract 1.0.0

Package @simulab/engine 0.2.0 is independent of React, Node APIs and circuit editor geometry. UnoRuntime consumes bounded compiled Intel HEX and executes AVR instructions through pinned AVR8js 0.21.1. CPU clock is fixed at 16MHz. Public signatures and snapshot fields match PHASE2_PLAN.md.

Lifecycle: constructor state ready; start only from ready/stopped (start from stopped initializes a fresh power-on state; stop retains a final snapshot), pause only running, resume only paused, stop allowed in any state, reset recreates peripherals/CPU and returns ready. runCycles only running; integer budgets1..250000. setPin accepts D0-D13/A0-A5 and boolean levels. snapshot drains pending serial bytes/transitions. Running snapshots reflect output DDR and driven port level; input pins report null (high impedance) regardless of external level.

Intel HEX: max128KiB text,32KiB flash; checksum, EOF, address, overlap, record types and bounds checked. Only data/EOF/extended-linear/extended-segment address records accepted. ELF/binary/source files are unsupported.

Digital GPIO and Timer1 CTC/interrupt behavior are verified; UART0 TX bytes are captured. Timer0/2 are configured but unverified, and PWM is not advertised as supported. I2C/SPI/ADC/EEPROM/watchdog/sleep/bootloader/fuses are not configured or supported by this adapter. No Mega or ESP32 execution. No analog electrical accuracy. Limits: serial4096 bytes per drain, transitions4096 per drain,250000 cycles per call; excess data is truncated with explicit dropped counters in future contract rather than unbounded buffers. Current adapter throws structured RuntimeError on overflow instead of silently dropping evidence.

Hardware comparison has not been performed. Firmware tests prove instruction-emulator output against register/timer expectations, not physical hardware parity.
