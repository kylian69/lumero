// Génère les icônes du site (favicon.ico, icon.svg, apple-touch-icon.png)
// à partir de la marque Lumero : carré arrondi indigo + "L" blanc.
// Aucun outil externe requis (PNG encodé via zlib).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

// Couleur primaire de la marque : hsl(234 89% 58%) ≈ #4347F3
const BG = [67, 71, 243, 255];
const FG = [255, 255, 255, 255];
const TRANSPARENT = [0, 0, 0, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// pixels: Uint8Array RGBA de taille size*size*4 -> Buffer PNG
function encodePng(pixels, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (deflate, adaptive, no interlace)
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    pixels.copy
      ? pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
      : raw.set(pixels.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Dessine l'icône Lumero dans un buffer RGBA
function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
    px[i + 3] = c[3];
  };
  const radius = size * 0.22;
  // Fond carré arrondi
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inX = Math.min(x, size - 1 - x);
      const inY = Math.min(y, size - 1 - y);
      let inside = true;
      if (inX < radius && inY < radius) {
        const dx = radius - inX;
        const dy = radius - inY;
        inside = dx * dx + dy * dy <= radius * radius;
      }
      set(x, y, inside ? BG : TRANSPARENT);
    }
  }
  // Lettre "L" blanche
  const t = Math.round(size * 0.12); // épaisseur des branches
  const left = Math.round(size * 0.34);
  const top = Math.round(size * 0.26);
  const bottom = Math.round(size * 0.74);
  const right = Math.round(size * 0.68);
  for (let y = top; y < bottom; y++)
    for (let x = left; x < left + t; x++) set(x, y, FG);
  for (let x = left; x < right; x++)
    for (let y = bottom - t; y < bottom; y++) set(x, y, FG);
  return px;
}

// ICO contenant un PNG 32x32
function encodeIco(pngBuf, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size; // width
  entry[1] = size >= 256 ? 0 : size; // height
  entry[2] = 0; // colors
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuf.length, 8); // size
  entry.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([header, entry, pngBuf]);
}

// favicon.ico (32x32)
const png32 = encodePng(drawIcon(32), 32);
writeFileSync(join(publicDir, "favicon.ico"), encodeIco(png32, 32));

// apple-touch-icon.png (180x180)
writeFileSync(join(publicDir, "apple-touch-icon.png"), encodePng(drawIcon(180), 180));

// icon.svg (vectoriel, navigateurs modernes)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#4347F3"/>
  <path d="M11 8 h4 v13 h7 v4 h-11 z" fill="#ffffff"/>
</svg>
`;
writeFileSync(join(publicDir, "icon.svg"), svg);

console.log("Icônes générées dans public/ : favicon.ico, apple-touch-icon.png, icon.svg");
