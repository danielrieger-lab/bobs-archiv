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
        .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
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
  const coverFiles = new Set();
  const specialEpisodes = [];
  const kurzgeschichten = [];

  for (const entry of serie) {
    if (entry?.unvollständig) {
      // skip incomplete entries rather than stopping the whole import
      continue;
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
      type: 'episode',
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

  // Try fetch specials
  try {
    const specialsRoot = await fetchJson('https://dreimetadaten.de/data/Spezial.json');
    const specials = Array.isArray(specialsRoot?.spezial)
      ? specialsRoot.spezial
      : Array.isArray(specialsRoot?.serie)
      ? specialsRoot.serie
      : [];
    let sIndex = 1;
    for (const entry of specials) {
      const title = typeof entry.titel === 'string' ? entry.titel.trim() : '';
      const autor = typeof entry.autor === 'string' ? entry.autor.trim() : '';
      const releasedAt = typeof entry.veröffentlichungsdatum === 'string' ? entry.veröffentlichungsdatum : '';
      const durationMs = Number(entry.gesamtdauer);
      const coverUrl = typeof entry?.links?.cover === 'string' ? entry.links.cover : '';
      const artworkUrl = typeof entry?.links?.artwork === 'string' ? entry.links.artwork : '';
      const fileName = `special-${String(sIndex).padStart(3, '0')}.webp`;
      const coverImage = `covers/${fileName}`;

      if (coverUrl || artworkUrl) {
        coverJobs.push(
          downloadAndConvertCover([coverUrl, artworkUrl], path.join(coversDir, fileName))
        );
      }

      specialEpisodes.push({
        type: 'special',
        id: `S-${String(sIndex).padStart(3, '0')}`,
        episode: title,
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

      sIndex += 1;
    }
  } catch (e) {
    // ignore if Spezial.json doesn't exist or fails
  }

  // Try fetch Kurzgeschichten
  try {
    const kurzRoot = await fetchJson('https://dreimetadaten.de/data/Kurzgeschichten.json');
    const kurzes = Array.isArray(kurzRoot?.kurzgeschichten)
      ? kurzRoot.kurzgeschichten
      : Array.isArray(kurzRoot?.serie)
      ? kurzRoot.serie
      : [];
    let kIndex = 1;
    for (const entry of kurzes) {
      const collectionSlugs = ['geisterlampe', 'raetsel-der-sieben', 'zeitgeist', 'schwarze-tag'];
      const collectionSlug = collectionSlugs[kIndex - 1] ?? `sammlung-${kIndex}`;
      const parts = Array.isArray(entry.teile) ? entry.teile : [];

      for (const part of parts) {
        const title = typeof part.titel === 'string' ? part.titel.trim() : '';
        const autor = typeof part.autor === 'string' ? part.autor.trim() : '';
        const releasedAt = typeof part.veröffentlichungsdatum === 'string'
          ? part.veröffentlichungsdatum
          : typeof entry.veröffentlichungsdatum === 'string' ? entry.veröffentlichungsdatum : '';
        const durationMs = Number(part.gesamtdauer);
        const sourceId = part?.ids?.dreimetadaten;
        const id = Number.isFinite(Number(sourceId)) ? `K-${sourceId}` : `K-${String(kIndex).padStart(3, '0')}`;
        const fileName = `kurzgeschichten-${collectionSlug}.webp`;
        const coverImage = `covers/${fileName}`;

        if (!coverFiles.has(fileName)) {
          const coverUrl = typeof entry?.links?.cover === 'string' ? entry.links.cover : '';
          const artworkUrl = typeof entry?.links?.artwork === 'string' ? entry.links.artwork : '';
          if (coverUrl || artworkUrl) {
            coverFiles.add(fileName);
            coverJobs.push(
              downloadAndConvertCover([coverUrl, artworkUrl], path.join(coversDir, fileName))
            );
          }
        }

        kurzgeschichten.push({
          type: 'kurz',
          id,
          episode: title,
          year: releasedAt ? new Date(releasedAt).getFullYear() : 0,
          coverImage,
          autor,
          veroeffentlichungsdatum: releasedAt,
          gesamtdauerMs: Number.isFinite(durationMs) ? durationMs : 0,
          sprechrollen: Array.isArray(part.sprechrollen)
            ? part.sprechrollen.map((role) => ({
                rolle: typeof role?.rolle === 'string' ? role.rolle : '',
                sprecher: typeof role?.sprecher === 'string' ? role.sprecher : '',
                ...(typeof role?.pseudonym === 'string' && role.pseudonym ? { pseudonym: role.pseudonym } : {}),
              }))
            : [],
        });
      }

      kIndex += 1;
    }
  } catch (e) {
    // ignore if Kurzgeschichten.json doesn't exist or fails
  }

  const allEntries = [...completeEpisodes, ...specialEpisodes, ...kurzgeschichten];

  await writeFile(outputJsonPath, `${JSON.stringify(allEntries, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${allEntries.length} episodes (${completeEpisodes.length} standard, ${specialEpisodes.length} specials, ${kurzgeschichten.length} Kurzgeschichten) to ${outputJsonPath}`);

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