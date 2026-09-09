import { Buffer } from "node:buffer";
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const size = Number(process.argv[2] ?? 20);
if (![20, 50, 128, 150, 300].includes(size)) throw new Error("Supported icon/logo sizes: 20, 50, 128, 150, 300.");
const sampling = 4;
const svg = readFileSync(new URL("../assets/icon.svg", import.meta.url), "utf8");
if (!svg.includes('viewBox="0 0 20 20"')) throw new Error("Expected the original 20x20 SVG.");

// This intentionally supports only the rectangles and circles in our original SVG.
const shapes = [...svg.matchAll(/<(rect|circle)\s+([^>]+)\/>/g)].map((match) => {
  const attributes = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)]
    .map((attribute) => [attribute[1], attribute[2]]));
  if (!/^#[0-9a-f]{6}$/i.test(attributes.fill ?? "")) throw new Error("Expected an opaque hex fill.");
  const color = [1, 3, 5].map((start) => Number.parseInt(attributes.fill.slice(start, start + 2), 16));
  const number = (name) => {
    const value = Number(attributes[name]);
    if (!Number.isFinite(value)) throw new Error(`Invalid SVG ${name}.`);
    return value;
  };
  if (match[1] === "rect") {
    const [x, y, width, height] = ["x", "y", "width", "height"].map(number);
    return { color, contains: (px, py) => px >= x && px < x + width && py >= y && py < y + height };
  }
  const [cx, cy, radius] = ["cx", "cy", "r"].map(number);
  return { color, contains: (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2 };
});
if (shapes.length !== 12) throw new Error("Review the rasterizer after changing the SVG geometry.");

const pixels = Buffer.alloc(size * (1 + size * 4));
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const total = [0, 0, 0];
    for (let sy = 0; sy < sampling; sy++) {
      for (let sx = 0; sx < sampling; sx++) {
        const px = (x + (sx + 0.5) / sampling) * 20 / size;
        const py = (y + (sy + 0.5) / sampling) * 20 / size;
        let color = [255, 255, 255];
        for (const shape of shapes) if (shape.contains(px, py)) color = shape.color;
        color.forEach((value, channel) => { total[channel] += value; });
      }
    }
    const offset = y * (1 + size * 4) + 1 + x * 4;
    total.forEach((value, channel) => { pixels[offset + channel] = Math.round(value / sampling ** 2); });
    pixels[offset + 3] = 255;
  }
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(pixels, { level: 9 })),
  chunk("IEND", Buffer.alloc(0))
]);
writeFileSync(new URL(size === 20 ? "../assets/icon.png" : `../assets/logo-${size}.png`, import.meta.url), png);
