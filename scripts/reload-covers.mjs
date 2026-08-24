import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const coversDir = path.join(rootDir, 'public', 'covers');

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function formatCoverFileName(nummer) {
  return `folge-${String(nummer).padStart(3, '0')}.webp`;
}

async function downloadAndConvertCover(sourceUrls, outputPath) {
  for (const sourceUrl of sourceUrls.filter(Boolean)) {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      await sharp(buffer).resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).webp({ quality: 80 }).toFile(outputPath);
      return true;
    } catch (e) {
      // try next
    }
  }
  return false;
}

function expandNumberToken(tok) {
  // Split tokens like 155163 into 155 and 163 if sensible
  if (tok.length > 3 && tok.length % 3 === 0) {
    const parts = [];
    for (let i = 0; i < tok.length; i += 3) parts.push(tok.slice(i, i + 3));
    return parts;
  }
  return [tok];
}

async function main() {
  const rawArg = process.argv.slice(2).join(' ');
  if (!rawArg) {
    console.error('Usage: node scripts/reload-covers.mjs <comma-or-space-separated-numbers>');
    process.exit(1);
  }

  const tokens = rawArg.match(/\d+/g) || [];
  const numbers = [];
  for (const t of tokens) {
    const expanded = expandNumberToken(t);
    for (const e of expanded) numbers.push(Number(e));
  }

  await mkdir(coversDir, { recursive: true });

  const root = await fetchJson('https://dreimetadaten.de/data/Serie.json');
  const serie = Array.isArray(root?.serie) ? root.serie : [];

  const jobs = [];
  const outputs = [];

  for (const num of numbers) {
    const entry = serie.find((it) => String(it?.nummer) === String(num));
    if (!entry) {
      console.warn(`No entry for episode ${num}`);
      continue;
    }
    const coverUrl = typeof entry?.links?.cover === 'string' ? entry.links.cover : '';
    const artworkUrl = typeof entry?.links?.artwork === 'string' ? entry.links.artwork : '';
    const outName = formatCoverFileName(num);
    const outPath = path.join(coversDir, outName);
    outputs.push(outPath);
    jobs.push(
      (async () => {
        const ok = await downloadAndConvertCover([coverUrl, artworkUrl], outPath);
        if (!ok) console.warn(`Failed to download cover for Folge ${num}`);
        else console.log(`Wrote ${outName}`);
      })()
    );
  }

  const results = await Promise.allSettled(jobs);
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) console.warn(`${failed.length} downloads failed`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
