/**
 * Generate PWA icons (192 + 512 PNG) with Node built-ins only (zlib).
 * Motif: obsidian square + volt slanted bars echoing the RKStride logo.
 * Run: npx tsx scripts/generate-pwa-icons.mjs (or node scripts/generate-pwa-icons.mjs)
 */
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const DARK = [0x0b, 0x0b, 0x0b];
const VOLT = [0xcc, 0xff, 0x00];

function crc32(buf) {
  if (!crc32.table) {
    crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crc32.table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crc32.table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function render(size) {
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0; // filter: none
    const t = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size + 0.14 * t; // slant coordinate (bar 1)
      const v = x / size - 0.1 * t; // counter-slant (bar 2 stem)
      const w = x / size + 0.1 * t; // counter-slant (bar 2 arm)
      const inBar1 = u >= 0.28 && u <= 0.42;
      const inStem = t >= 0.35 && t <= 0.88 && v >= 0.56 && v <= 0.63;
      const inArm = t >= 0.12 && t <= 0.5 && w >= 0.63 && w <= 0.7;
      const px = inBar1 || inStem || inArm ? VOLT : DARK;
      const o = rowStart + 1 + x * 3;
      raw[o] = px[0];
      raw[o + 1] = px[1];
      raw[o + 2] = px[2];
    }
  }
  return raw;
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const idat = deflateSync(render(size));
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  const out = join(root, `pwa-${size}x${size}.png`);
  writeFileSync(out, png(size));
  console.log(`wrote ${out}`);
}
