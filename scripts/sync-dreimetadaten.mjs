import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputJsonPath = path.join(rootDir, 'src', 'dreimetadaten-series.json');
const coversDir = path.join(rootDir, 'public', 'covers');

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function formatEpisodeLabel(nummer, titel) {
  return `Folge ${nummer}: ${titel}`;
}

function formatCoverFileName(nummer) {
  return `folge-${String(nummer).padStart(3, '0')}.webp`;
}

async function downloadAndConvertCover(sourceUrls, outputPath) {
  for (const sourceUrl of sourceUrls.filter(Boolean)) {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);
      return;
    } catch {
      // Try the next source URL.
    }
  }

  throw new Error(`Failed to fetch any cover source for ${outputPath}`);
}

async function main() {
  await mkdir(coversDir, { recursive: true });

  const root = await fetchJson('https://dreimetadaten.de/data/Serie.json');
  const serie = Array.isArray(root?.serie) ? root.serie : [];
  const completeEpisodes = [];
  const coverJobs = [];

  for (const entry of serie) {
    if (entry?.unvollständig) {
      break;
    }

    if (!entry?.nummer) {
      continue;
    }

    const nummer = Number(entry.nummer);
    if (!Number.isFinite(nummer)) {
      continue;
    }

    const title = typeof entry.titel === 'string' ? entry.titel.trim() : '';
    const autor = typeof entry.autor === 'string' ? entry.autor.trim() : '';
    const releasedAt = typeof entry.veröffentlichungsdatum === 'string' ? entry.veröffentlichungsdatum : '';
    const durationMs = Number(entry.gesamtdauer);
    const coverUrl = typeof entry?.links?.cover === 'string' ? entry.links.cover : '';
    const artworkUrl = typeof entry?.links?.artwork === 'string' ? entry.links.artwork : '';
    const coverImage = `covers/${formatCoverFileName(nummer)}`;

    if (coverUrl || artworkUrl) {
      coverJobs.push(
        downloadAndConvertCover([coverUrl, artworkUrl], path.join(coversDir, formatCoverFileName(nummer)))
      );
    }

    completeEpisodes.push({
      id: String(nummer),
      episode: formatEpisodeLabel(nummer, title),
      year: releasedAt ? new Date(releasedAt).getFullYear() : 0,
      coverImage,
      autor,
      veroeffentlichungsdatum: releasedAt,
      gesamtdauerMs: Number.isFinite(durationMs) ? durationMs : 0,
      sprechrollen: Array.isArray(entry.sprechrollen)
        ? entry.sprechrollen.map((role) => ({
            rolle: typeof role?.rolle === 'string' ? role.rolle : '',
            sprecher: typeof role?.sprecher === 'string' ? role.sprecher : '',
            ...(typeof role?.pseudonym === 'string' && role.pseudonym ? { pseudonym: role.pseudonym } : {}),
          }))
        : [],
    });
  }

  await writeFile(outputJsonPath, `${JSON.stringify(completeEpisodes, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${completeEpisodes.length} episodes to ${outputJsonPath}`);

  const results = await Promise.allSettled(coverJobs);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    console.warn(`Cover sync completed with ${failures.length} failures.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});