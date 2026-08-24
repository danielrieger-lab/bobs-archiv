import { readdir, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const coversDir = path.join(rootDir, 'public', 'covers');

async function convertFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.png') return false;
  const base = path.basename(file, ext);
  const input = path.join(coversDir, file);
  const out = path.join(coversDir, `${base}.webp`);
  try {
    const buffer = await import('node:fs/promises').then(({ readFile }) => readFile(input));
    await sharp(buffer)
      .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .webp({ quality: 80 })
      .toFile(out);
    await unlink(input);
    console.log(`Converted ${file} -> ${base}.webp`);
    return true;
  } catch (e) {
    console.warn(`Failed to convert ${file}: ${e.message}`);
    return false;
  }
}

async function main() {
  await mkdir(coversDir, { recursive: true });
  const files = await readdir(coversDir);
  const pngs = files.filter((f) => path.extname(f).toLowerCase() === '.png');
  if (pngs.length === 0) {
    console.log('No PNG files found in covers directory.');
    return;
  }
  const results = await Promise.all(pngs.map(convertFile));
  const ok = results.filter(Boolean).length;
  console.log(`Converted ${ok}/${pngs.length} PNG files.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
