import { RuntimeError } from "./types.js";
const fail = (message: string): never => {
  throw new RuntimeError("INVALID_FIRMWARE", message);
};
/** @brief Validate compiled Intel HEX and return an erased 32KiB ATmega328P flash image.
 * @param hex ASCII Intel HEX; source code, ELF, bootloader/fuse records are not accepted.
 * @throws RuntimeError for malformed or out-of-range data.
 */
export function parseIntelHex(hex: string): Uint8Array {
  if (typeof hex !== "string" || hex.length > 131072 || !hex.trim())
    fail("Firmware must contain at most 128KiB Intel HEX text.");
  if (!/^[\x09\x0a\x0d\x20-\x7e]*$/.test(hex))
    fail("Firmware must use ASCII Intel HEX.");
  const flash = new Uint8Array(32768).fill(0xff),
    written = new Uint8Array(32768);
  let base = 0,
    eof = false,
    dataBytes = 0;
  for (const raw of hex.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (eof) fail("Unexpected record after EOF.");
    if (
      !/^:[0-9a-fA-F]+$/.test(line) ||
      line.length < 11 ||
      (line.length - 1) % 2
    )
      fail("Malformed Intel HEX record.");
    const bytes = Uint8Array.from(line.slice(1).match(/../g)!, (v) =>
      parseInt(v, 16),
    );
    const length = bytes[0],
      address = (bytes[1] << 8) | bytes[2],
      type = bytes[3];
    if (bytes.length !== length + 5) fail("Intel HEX record length mismatch.");
    if (bytes.reduce((a, b) => a + b, 0) % 256 !== 0)
      fail("Intel HEX checksum mismatch.");
    if (type === 0) {
      if (!length) fail("Empty data records are not supported.");
      const start = base + address;
      if (start + length > flash.length)
        fail("Firmware exceeds ATmega328P flash bounds.");
      for (let i = 0; i < length; i++) {
        if (written[start + i]) fail("Overlapping firmware data.");
        flash[start + i] = bytes[4 + i];
        written[start + i] = 1;
        dataBytes++;
      }
    } else if (type === 1) {
      if (length !== 0 || address !== 0) fail("Invalid EOF record.");
      eof = true;
    } else if (type === 2 || type === 4) {
      if (length !== 2 || address !== 0)
        fail("Invalid extended-address record.");
      base = ((bytes[4] << 8) | bytes[5]) * (type === 2 ? 16 : 65536);
      if (base >= flash.length)
        fail("Extended address exceeds ATmega328P flash.");
    } else fail(`Unsupported Intel HEX record type ${type}.`);
  }
  if (!eof) fail("Missing Intel HEX EOF record.");
  if (!dataBytes || !written[0] || !written[1])
    fail("Firmware has no reset-vector instruction.");
  return flash;
}
