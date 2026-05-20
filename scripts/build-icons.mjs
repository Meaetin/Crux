/**
 * Rasterize static/icons/icon.svg into the PNG sizes the PWA manifest needs.
 *
 * Requires `sharp`. If not in the project's deps, install it ad-hoc:
 *   npm i -D sharp
 * or run via an isolated install:
 *   npm --prefix <tmp> i sharp && node --experimental-vm-modules scripts/build-icons.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    const fallback = process.env.SHARP_PATH;
    if (!fallback) throw new Error('sharp not found. Install via `npm i -D sharp` or set SHARP_PATH.');
    const require = createRequire(import.meta.url);
    const resolved = require.resolve('sharp', { paths: [fallback] });
    return (await import(pathToFileURL(resolved).href)).default;
  }
}
const sharp = await loadSharp();

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const iconsDir = resolve(root, 'static/icons');
const masterSvgPath = resolve(iconsDir, 'icon.svg');

const STONE = '#1c1b19';
const MASKABLE_PAD = 0.18; // 18% padding around master art for safe zone

await mkdir(iconsDir, { recursive: true });
const masterSvg = await readFile(masterSvgPath);

async function rasterize(size, outName) {
  const buf = await sharp(masterSvg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: STONE })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = resolve(iconsDir, outName);
  await writeFile(out, buf);
  console.log(`wrote ${outName} (${buf.length} bytes)`);
}

async function rasterizeMaskable(size, outName) {
  const innerSize = Math.round(size * (1 - MASKABLE_PAD * 2));
  const inner = await sharp(masterSvg, { density: 384 })
    .resize(innerSize, innerSize, { fit: 'contain', background: STONE })
    .toBuffer();
  const buf = await sharp({
    create: { width: size, height: size, channels: 3, background: STONE }
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = resolve(iconsDir, outName);
  await writeFile(out, buf);
  console.log(`wrote ${outName} (${buf.length} bytes)`);
}

await rasterize(192, 'icon-192.png');
await rasterize(512, 'icon-512.png');
await rasterizeMaskable(512, 'icon-maskable-512.png');
await rasterize(180, 'apple-touch-icon.png');
