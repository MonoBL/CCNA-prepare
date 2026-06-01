// Generates minimal valid PNG icons for the PWA.
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crcVal = crc32(Buffer.concat([t, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function makePNG(size, r, g, b, centerR, centerG, centerB) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB color type
  // compression, filter, interlace all 0

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= radius * radius;
      row[1 + x * 3] = inCircle ? centerR : r;
      row[2 + x * 3] = inCircle ? centerG : g;
      row[3 + x * 3] = inCircle ? centerB : b;
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const compressed = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdrData),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

mkdirSync("public/icons", { recursive: true });

// Dark blue bg (#0b1220 = 11,18,32), accent circle (#3b82f6 = 59,130,246)
writeFileSync("public/icons/icon-192.png", makePNG(192, 11, 18, 32, 59, 130, 246));
writeFileSync("public/icons/icon-512.png", makePNG(512, 11, 18, 32, 59, 130, 246));
// Maskable: safe zone is center 80%, use accent bg
writeFileSync("public/icons/maskable-512.png", makePNG(512, 59, 130, 246, 11, 18, 32));

console.log("Icons generated: public/icons/{icon-192,icon-512,maskable-512}.png");
