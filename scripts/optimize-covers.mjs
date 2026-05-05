import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const coversDir = path.resolve(process.cwd(), 'public', 'covers');
const targetWidth = 400;
const targetHeight = 400;
const quality = 80;

const files = await readdir(coversDir);
const pngFiles = files.filter((file) => file.toLowerCase().endsWith('.png'));

let beforeBytes = 0;
let afterBytes = 0;
let converted = 0;

for (const file of pngFiles) {
  const inputPath = path.join(coversDir, file);
  const outputPath = path.join(coversDir, file.replace(/\.png$/i, '.webp'));

  const before = await stat(inputPath);
  beforeBytes += before.size;

  await sharp(inputPath)
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 6,
    })
    .toFile(outputPath);

  const after = await stat(outputPath);
  afterBytes += after.size;

  await unlink(inputPath);
  converted += 1;
}

const toMb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
const savings = beforeBytes > 0 ? ((1 - afterBytes / beforeBytes) * 100).toFixed(1) : '0.0';

console.log(`Converted ${converted} cover images to WebP.`);
console.log(`Size before: ${toMb(beforeBytes)} MB`);
console.log(`Size after: ${toMb(afterBytes)} MB`);
console.log(`Savings: ${savings}%`);