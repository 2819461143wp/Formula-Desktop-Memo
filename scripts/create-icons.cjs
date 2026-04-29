const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const outputDir = path.join(process.cwd(), "build");
fs.mkdirSync(outputDir, { recursive: true });

const png = createPng(512, 512);
fs.writeFileSync(path.join(outputDir, "icon.png"), png);

const sizes = [256, 128, 64, 48, 32, 16];
const images = sizes.map((size) => ({
  size,
  dib: createIcoDib(size, size),
}));
fs.writeFileSync(path.join(outputDir, "icon.ico"), createIco(images));

console.log("Generated build/icon.png and build/icon.ico");

function createCanvas(width, height) {
  return {
    width,
    height,
    data: Buffer.alloc(width * height * 4),
  };
}

function createPng(width, height) {
  const canvas = createCanvas(width, height);
  drawIcon(canvas);
  return encodePng(canvas.width, canvas.height, canvas.data);
}

function createIcoDib(width, height) {
  const canvas = createCanvas(width, height);
  drawIcon(canvas);

  const headerSize = 40;
  const xorSize = width * height * 4;
  const andStride = Math.ceil(width / 32) * 4;
  const andSize = andStride * height;
  const dib = Buffer.alloc(headerSize + xorSize + andSize);

  dib.writeUInt32LE(headerSize, 0);
  dib.writeInt32LE(width, 4);
  dib.writeInt32LE(height * 2, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  dib.writeUInt32LE(0, 16);
  dib.writeUInt32LE(xorSize + andSize, 20);
  dib.writeInt32LE(0, 24);
  dib.writeInt32LE(0, 28);
  dib.writeUInt32LE(0, 32);
  dib.writeUInt32LE(0, 36);

  let offset = headerSize;
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      dib[offset++] = canvas.data[source + 2];
      dib[offset++] = canvas.data[source + 1];
      dib[offset++] = canvas.data[source];
      dib[offset++] = canvas.data[source + 3];
    }
  }

  return dib;
}

function createIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let imageOffset = header.length;
  images.forEach((image, index) => {
    const entryOffset = 6 + index * 16;
    header[entryOffset] = image.size === 256 ? 0 : image.size;
    header[entryOffset + 1] = image.size === 256 ? 0 : image.size;
    header[entryOffset + 2] = 0;
    header[entryOffset + 3] = 0;
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(image.dib.length, entryOffset + 8);
    header.writeUInt32LE(imageOffset, entryOffset + 12);
    imageOffset += image.dib.length;
  });

  return Buffer.concat([header, ...images.map((image) => image.dib)]);
}

function drawIcon(canvas) {
  const { width, height } = canvas;
  clear(canvas);

  fillRoundedRect(canvas, 0.08, 0.08, 0.84, 0.84, 0.17, [18, 24, 33, 255], [29, 83, 121, 255]);
  fillRoundedRect(canvas, 0.16, 0.18, 0.68, 0.56, 0.08, [245, 248, 252, 255], [220, 236, 247, 255]);
  fillRoundedRect(canvas, 0.16, 0.18, 0.68, 0.16, 0.08, [44, 133, 185, 255], [34, 168, 202, 255]);

  drawLine(canvas, 0.24 * width, 0.50 * height, 0.42 * width, 0.50 * height, 0.035 * width, [24, 36, 52, 255]);
  drawLine(canvas, 0.30 * width, 0.42 * height, 0.36 * width, 0.58 * height, 0.035 * width, [24, 36, 52, 255]);
  drawLine(canvas, 0.50 * width, 0.42 * height, 0.58 * width, 0.58 * height, 0.035 * width, [24, 36, 52, 255]);
  drawLine(canvas, 0.58 * width, 0.42 * height, 0.66 * width, 0.58 * height, 0.035 * width, [24, 36, 52, 255]);
  drawLine(canvas, 0.49 * width, 0.50 * height, 0.68 * width, 0.50 * height, 0.035 * width, [24, 36, 52, 255]);

  fillRoundedRect(canvas, 0.57, 0.64, 0.20, 0.09, 0.045, [28, 166, 120, 255], [30, 200, 140, 255]);
  fillCircle(canvas, 0.76, 0.28, 0.08, [255, 209, 102, 255]);
}

function clear(canvas) {
  for (let index = 0; index < canvas.data.length; index += 4) {
    canvas.data[index] = 0;
    canvas.data[index + 1] = 0;
    canvas.data[index + 2] = 0;
    canvas.data[index + 3] = 0;
  }
}

function fillRoundedRect(canvas, xRatio, yRatio, wRatio, hRatio, radiusRatio, topColor, bottomColor) {
  const x = Math.round(xRatio * canvas.width);
  const y = Math.round(yRatio * canvas.height);
  const w = Math.round(wRatio * canvas.width);
  const h = Math.round(hRatio * canvas.height);
  const r = Math.round(radiusRatio * canvas.width);

  for (let py = y; py < y + h; py += 1) {
    const t = h <= 1 ? 0 : (py - y) / (h - 1);
    const color = mix(topColor, bottomColor, t);
    for (let px = x; px < x + w; px += 1) {
      const dx = Math.max(x + r - px, 0, px - (x + w - r - 1));
      const dy = Math.max(y + r - py, 0, py - (y + h - r - 1));
      if (dx * dx + dy * dy <= r * r) {
        setPixel(canvas, px, py, color);
      }
    }
  }
}

function fillCircle(canvas, cxRatio, cyRatio, rRatio, color) {
  const cx = cxRatio * canvas.width;
  const cy = cyRatio * canvas.height;
  const radius = rRatio * canvas.width;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(canvas, x, y, color);
      }
    }
  }
}

function drawLine(canvas, x1, y1, x2, y2, width, color) {
  const minX = Math.floor(Math.min(x1, x2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const radius = width / 2;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
      const px = x1 + t * (x2 - x1);
      const py = y1 + t * (y2 - y1);
      if ((x - px) ** 2 + (y - py) ** 2 <= radius * radius) {
        setPixel(canvas, x, y, color);
      }
    }
  }
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const offset = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  canvas.data[offset] = Math.round(color[0] * alpha + canvas.data[offset] * inverse);
  canvas.data[offset + 1] = Math.round(color[1] * alpha + canvas.data[offset + 1] * inverse);
  canvas.data[offset + 2] = Math.round(color[2] * alpha + canvas.data[offset + 2] * inverse);
  canvas.data[offset + 3] = Math.min(255, Math.round(color[3] + canvas.data[offset + 3] * inverse));
}

function mix(a, b, t) {
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
    Math.round(a[3] * (1 - t) + b[3] * t),
  ];
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    scanlines[row] = 0;
    rgba.copy(scanlines, row + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
