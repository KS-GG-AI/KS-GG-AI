import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const width = 960;
const height = 76;
const scale = 3;
const palette = [
  [13, 16, 28], [22, 18, 37], [48, 42, 70], [63, 56, 91],
  [167, 139, 250], [103, 232, 249], [167, 243, 208], [249, 168, 212],
  [245, 243, 255], [158, 150, 184], [37, 50, 72], [29, 55, 62],
  [30, 46, 41], [61, 36, 58], [82, 72, 112], [0, 0, 0],
];

const font = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  ",": ["00000", "00000", "00000", "00000", "00000", "00110", "00100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

function setPixel(frame, x, y, color) {
  if (x >= 0 && x < width && y >= 0 && y < height) frame[y * width + x] = color;
}

function fillRect(frame, x, y, w, h, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) setPixel(frame, px, py, color);
  }
}

function fillRoundedRect(frame, x, y, w, h, radius, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      const cx = Math.max(x + radius, Math.min(px, x + w - radius - 1));
      const cy = Math.max(y + radius, Math.min(py, y + h - radius - 1));
      if ((px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2) setPixel(frame, px, py, color);
    }
  }
}

function drawGlyph(frame, char, x, y, color, glyphScale = scale) {
  const glyph = font[char] ?? font[" "];
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] === "1") {
        fillRect(frame, x + col * glyphScale, y + row * glyphScale, glyphScale, glyphScale, color);
      }
    }
  }
}

function drawText(frame, text, x, y, color, glyphScale = scale) {
  let cursor = x;
  for (const char of text) {
    drawGlyph(frame, char, cursor, y, color, glyphScale);
    cursor += 6 * glyphScale;
  }
  return cursor;
}

function createFrame(text, index) {
  const frame = new Uint8Array(width * height).fill(0);
  fillRoundedRect(frame, 0, 0, width, height, 18, 3);
  fillRoundedRect(frame, 1, 1, width - 2, height - 2, 17, 1);
  fillRoundedRect(frame, 2, 2, width - 4, height - 4, 16, 1);

  fillRect(frame, 28, 17, 3, 42, 4);
  fillRect(frame, 33, 36, 12, 3, 4);
  const endX = drawText(frame, text, 62, 27, 8);
  if (Math.floor(index / 6) % 2 === 0) fillRect(frame, endX + 3, 27, 3, 21, 5);

  fillRect(frame, 62, 59, 170, 1, 14);
  fillRect(frame, 232, 59, 94, 1, 5);
  fillRect(frame, 326, 59, 47, 1, 6);
  const pulse = 898 + (index % 16);
  fillRect(frame, 871, 37, 24, 1, 14);
  fillRect(frame, pulse, 34, 5, 7, 7);
  fillRect(frame, 908, 36, 3, 3, 5);

  return frame;
}

function pushCode(bytes, state, code) {
  state.value |= code << state.bits;
  state.bits += state.size;
  while (state.bits >= 8) {
    bytes.push(state.value & 0xff);
    state.value >>>= 8;
    state.bits -= 8;
  }
}

function lzwEncode(pixels, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let nextCode = endCode + 1;
  let codeSize = minCodeSize + 1;
  let dictionary = new Map();
  const bytes = [];
  const state = { value: 0, bits: 0, size: codeSize };

  const reset = () => {
    dictionary = new Map();
    nextCode = endCode + 1;
    codeSize = minCodeSize + 1;
    state.size = codeSize;
  };

  pushCode(bytes, state, clearCode);
  let prefix = pixels[0];
  for (let i = 1; i < pixels.length; i += 1) {
    const value = pixels[i];
    const key = prefix + "," + value;
    const existing = dictionary.get(key);
    if (existing !== undefined) {
      prefix = existing;
      continue;
    }
    pushCode(bytes, state, prefix);
    if (nextCode < 4096) {
      dictionary.set(key, nextCode);
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) {
        codeSize += 1;
        state.size = codeSize;
      }
    } else {
      pushCode(bytes, state, clearCode);
      reset();
    }
    prefix = value;
  }
  pushCode(bytes, state, prefix);
  pushCode(bytes, state, endCode);
  if (state.bits > 0) bytes.push(state.value & 0xff);
  return Uint8Array.from(bytes);
}

function writeShort(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeSubBlocks(bytes, data) {
  for (let offset = 0; offset < data.length; offset += 255) {
    const chunk = data.subarray(offset, offset + 255);
    bytes.push(chunk.length, ...chunk);
  }
  bytes.push(0);
}

function encodeGif(frames) {
  const bytes = [...Buffer.from("GIF89a")];
  writeShort(bytes, width);
  writeShort(bytes, height);
  bytes.push(0xf3, 0, 0);
  for (const color of palette) bytes.push(...color);
  bytes.push(0x21, 0xff, 0x0b, ...Buffer.from("NETSCAPE2.0"), 0x03, 0x01, 0x00, 0x00, 0x00);

  for (const { pixels, delay } of frames) {
    bytes.push(0x21, 0xf9, 0x04, 0x08);
    writeShort(bytes, delay);
    bytes.push(0x00, 0x00);
    bytes.push(0x2c);
    writeShort(bytes, 0);
    writeShort(bytes, 0);
    writeShort(bytes, width);
    writeShort(bytes, height);
    bytes.push(0x00, 0x04);
    writeSubBlocks(bytes, lzwEncode(pixels, 4));
  }
  bytes.push(0x3b);
  return Buffer.from(bytes);
}

const phrases = [
  "DESIGNING USEFUL THINGS WITH CARE.",
  "MAKING COMPLEX SYSTEMS FEEL SIMPLE.",
  "ALWAYS LEARNING, ALWAYS BUILDING.",
];
const frames = [];
let frameIndex = 0;
for (const phrase of phrases) {
  for (let length = 0; length <= phrase.length; length += 1) {
    frames.push({ pixels: createFrame(phrase.slice(0, length), frameIndex), delay: 6 });
    frameIndex += 1;
  }
  frames.push({ pixels: createFrame(phrase, frameIndex), delay: 95 });
  frameIndex += 1;
  for (let length = phrase.length - 1; length >= 0; length -= 1) {
    frames.push({ pixels: createFrame(phrase.slice(0, length), frameIndex), delay: 3 });
    frameIndex += 1;
  }
  frames.push({ pixels: createFrame("", frameIndex), delay: 18 });
  frameIndex += 1;
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(directory, "../assets/typing.gif");
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, encodeGif(frames));
console.log("Wrote " + target + " (" + frames.length + " frames)");
