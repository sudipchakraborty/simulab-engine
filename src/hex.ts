import { RuntimeError } from "./types.js";
const fail = (message: string): never => {
  throw new RuntimeError("INVALID_FIRMWARE", message);
};
/** @brief Validate compiled Intel HEX and return an erased explicitly selected AVR flash image.
 * @param hex ASCII Intel HEX; source code, ELF, bootloader/fuse records are not accepted.
 * @throws RuntimeError for malformed or out-of-range data.
 */
export function parseIntelHex(hex: string, flashBytes=32768): Uint8Array {
  if(![32768,262144].includes(flashBytes))fail('Unsupported AVR flash profile.');
  const label=flashBytes===32768?'ATmega328P':'ATmega2560';
  if (typeof hex !== "string" || hex.length > flashBytes*4 || !hex.trim())
    fail(`Firmware must contain at most ${flashBytes*4} bytes of Intel HEX text.`);
  if (!/^[\x09\x0a\x0d\x20-\x7e]*$/.test(hex))
    fail("Firmware must use ASCII Intel HEX.");
  const flash = new Uint8Array(flashBytes).fill(0xff),
    written = new Uint8Array(flashBytes);
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
        fail(`Firmware exceeds ${label} flash bounds.`);
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
        fail(`Extended address exceeds ${label} flash.`);
    } else fail(`Unsupported Intel HEX record type ${type}.`);
  }
  if (!eof) fail("Missing Intel HEX EOF record.");
  if (!dataBytes || !written[0] || !written[1])
    fail("Firmware has no reset-vector instruction.");
  return flash;
}
