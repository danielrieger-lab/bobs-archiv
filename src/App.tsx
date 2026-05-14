import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type SyntheticEvent } from 'react';
import episodeCatalog from './dreimetadaten-series.json';
import { miniEpisodeSeeds } from './mini-episodes';

type RatingNoteKey = 'atmosphaere' | 'wiederhoerenswert' | 'story' | 'charakterdynamik' | 'nostalgie' | 'gruselfaktor';

type EpisodeCatalogEntry = {
  id: string;
  episode: string;
  year: number;
  coverImage: string;
  autor: string;
  veroeffentlichungsdatum: string;
  gesamtdauerMs: number;
  sprechrollen: Array<{
    rolle: string;
    sprecher: string;
    pseudonym?: string;
  }>;
  type?: 'episode' | 'special' | 'kurz';
};

type Radioplay = {
  id: string;
  title: string;
  episode: string;
  year: number;
  coverImage?: string;
  zuerstGehoertAm: string;
  wiedergaben: number;
  nostalgie: number;
  lieblingscharakter: string;
  atmosphaere: number;
  wiederhoerenswert: number;
  story: number;
  charakterdynamik: number;
  mostHatedCharacter: string;
  fallquality: number;
  gruselfaktor: number;
  klassiker: boolean;
  bobcastGehoert: boolean;
  beschreibungDerFolge: string;
  ratingNotizen: Record<RatingNoteKey, string>;
};

type BackupPayload = {
  schemaVersion: 1;
  exportedAt: string;
  radioplays: Array<Partial<Radioplay>>;
};

type MergeImportPreview = {
  importedEntries: number;
  added: number;
  updated: number;
  unchanged: number;
};

function createEmptyRatingNotizen(): Record<RatingNoteKey, string> {
  return {
    atmosphaere: '',
    wiederhoerenswert: '',
    story: '',
    charakterdynamik: '',
    nostalgie: '',
    gruselfaktor: '',
  };
}

const STORAGE_CANONICAL_KEY = 'bobs-archiv-fallometer-ratings';
const STORAGE_KEY = 'bobs-archiv-fallometer-ratings-v1';
const STORAGE_BACKUP_KEY = 'bobs-archiv-fallometer-ratings-backup-v1';
const STORAGE_WRITE_KEYS = [STORAGE_CANONICAL_KEY, STORAGE_KEY, STORAGE_BACKUP_KEY] as const;
const BASE_URL = import.meta.env.BASE_URL;
function buildDefaultRadioplays(): Radioplay[] {
  return (episodeCatalog as unknown as EpisodeCatalogEntry[]).map((entry) => ({
    id: entry.id,
    title: 'Die Drei ???',
    episode: entry.episode,
    year: entry.year,
    coverImage: entry.coverImage,
    zuerstGehoertAm: '',
    wiedergaben: 0,
    nostalgie: 0,
    lieblingscharakter: '',
    mostHatedCharacter: '',
    atmosphaere: 0,
    wiederhoerenswert: 0,
    story: 0,
    charakterdynamik: 0,
    fallquality: 0,
    gruselfaktor: 0,
    klassiker: false,
    bobcastGehoert: false,
    beschreibungDerFolge: '',
    ratingNotizen: createEmptyRatingNotizen(),
  }));
}

function buildMiniRadioplays(): Radioplay[] {
  return miniEpisodeSeeds.map((seed) => ({
    id: seed.id,
    title: 'Die Drei ???',
    episode: seed.episode,
    year: seed.year,
    coverImage: seed.coverImage,
    zuerstGehoertAm: '',
    wiedergaben: 0,
    nostalgie: 0,
    lieblingscharakter: '',
    mostHatedCharacter: '',
    atmosphaere: 0,
    wiederhoerenswert: 0,
    story: 0,
    charakterdynamik: 0,
    fallquality: 0,
    gruselfaktor: 0,
    klassiker: false,
    bobcastGehoert: false,
    beschreibungDerFolge: '',
    ratingNotizen: createEmptyRatingNotizen(),
  }));
}

const defaultRadioplays: Radioplay[] = [...buildDefaultRadioplays(), ...buildMiniRadioplays()];
const episodeMetadataEntries = episodeCatalog as unknown as EpisodeCatalogEntry[];

type RatingCategory = 'atmosphaere' | 'wiederhoerenswert' | 'story' | 'charakterdynamik';

const ratingCategories: Array<{ key: RatingCategory; label: string }> = [
  { key: 'atmosphaere', label: 'Atmosphäre' },
  { key: 'wiederhoerenswert', label: 'Wiederhörenswert' },
  { key: 'story', label: 'Story/Fallqualität' },
  { key: 'charakterdynamik', label: 'Charakterdynamik' },
];

function overallRating(play: Radioplay): number {
  const sum = play.atmosphaere + play.wiederhoerenswert + play.story + play.charakterdynamik + play.nostalgie;
  return sum / 5;
}

function hasGeneralRating(play: Radioplay): boolean {
  return (
    play.atmosphaere > 0
    || play.wiederhoerenswert > 0
    || play.story > 0
    || play.charakterdynamik > 0
    || play.nostalgie !== 0
  );
}

function hasHeardEvidence(play: Radioplay): boolean {
  return Boolean(
    play.atmosphaere > 0
    || play.wiederhoerenswert > 0
    || play.story > 0
    || play.charakterdynamik > 0
    || play.nostalgie > 0
    || play.gruselfaktor > 0
    || play.zuerstGehoertAm
    || play.lieblingscharakter.trim()
    || play.mostHatedCharacter?.trim()
    || play.beschreibungDerFolge.trim()
    || Object.values(play.ratingNotizen).some((note) => note.trim().length > 0),
  );
}

function isHeardEpisode(play: Radioplay): boolean {
  return play.wiedergaben > 0 || hasHeardEvidence(play);
}

const ratingStarValues = [1, 2, 3, 4, 5] as const;

function ratingIconPair(category: string): { off: string; on: string } {
  if (category === 'story') return { off: 'b', on: 'b2' };
  if (category === 'charakterdynamik') return { off: 'u', on: 'u2' };
  if (category === 'atmosphaere') return { off: 'q', on: 'q2' };
  if (category === 'wiederhoerenswert') return { off: 'v', on: 'v_2' };
  if (category === 'nostalgie') return { off: 'c', on: 'c2' };
  if (category === 'gruselfaktor') return { off: 'g', on: 'g2' };
  return { off: 'b', on: 'b2' };
}

function ratingIconPath(fileName: string): string {
  return `${BASE_URL}rating-icons/${fileName}.svg`;
}

function hydrateStarValue(rawValue: unknown): number {
  if (typeof rawValue !== 'number') return 0;
  if (rawValue >= 0 && rawValue <= 5) return rawValue;
  if (rawValue >= -2 && rawValue <= 2) {
    return Math.max(0, Math.min(5, Math.round(((rawValue + 2) / 4) * 5)));
  }
  return 0;
}

function normalizeEpisodeLabel(value: string): string {
  return value.replace(/^(Folge\s*\d+|K\d+)\s*::\s*/i, '$1: ').replace(/\s{2,}/g, ' ').trim();
}

function episodeNameFromLabel(value: string): string {
  const normalized = normalizeEpisodeLabel(value);
  const match = normalized.match(/^(?:Folge\s*\d+|K\d+)\s*:\s*(.+)$/i);
  return match?.[1]?.trim() ?? normalized;
}

function episodeNumberFromLabel(value: string): string {
  const normalized = normalizeEpisodeLabel(value);
  const match = normalized.match(/^((?:Folge\s*\d+)|(?:K\d+))\s*:/i);
  return match?.[1] ?? '';
}

function hydrateRadioplay(raw: Partial<Radioplay>, fallback: Radioplay): Radioplay {
  const rawRatingNotizen = (raw as { ratingNotizen?: unknown }).ratingNotizen;
  const ratingNotizen = typeof rawRatingNotizen === 'object' && rawRatingNotizen !== null
    ? rawRatingNotizen as Partial<Record<RatingNoteKey, unknown>>
    : {};

  return {
    ...fallback,
    ...raw,
    episode: normalizeEpisodeLabel(typeof raw.episode === 'string' ? raw.episode : fallback.episode),
    coverImage: typeof raw.coverImage === 'string' ? raw.coverImage : fallback.coverImage,
    zuerstGehoertAm: typeof raw.zuerstGehoertAm === 'string' ? raw.zuerstGehoertAm : '',
    wiedergaben: typeof raw.wiedergaben === 'number' ? raw.wiedergaben : 0,
    nostalgie: typeof raw.nostalgie === 'number' ? raw.nostalgie : 0,
    lieblingscharakter: typeof raw.lieblingscharakter === 'string' ? raw.lieblingscharakter : '',
    mostHatedCharacter: typeof (raw as { mostHatedCharacter?: unknown }).mostHatedCharacter === 'string'
      ? (raw as { mostHatedCharacter: string }).mostHatedCharacter
      : '',
    atmosphaere: hydrateStarValue(raw.atmosphaere),
    wiederhoerenswert: hydrateStarValue(raw.wiederhoerenswert),
    story: typeof raw.story === 'number'
      ? hydrateStarValue(raw.story)
      : hydrateStarValue(raw.fallquality),
    charakterdynamik: hydrateStarValue(raw.charakterdynamik),
    fallquality: typeof raw.fallquality === 'number' ? raw.fallquality : 0,
    gruselfaktor: typeof raw.gruselfaktor === 'number' ? raw.gruselfaktor : 0,
    klassiker: typeof raw.klassiker === 'boolean' ? raw.klassiker : false,
    bobcastGehoert: typeof raw.bobcastGehoert === 'boolean' ? raw.bobcastGehoert : false,
    beschreibungDerFolge: typeof raw.beschreibungDerFolge === 'string' ? raw.beschreibungDerFolge : '',
    ratingNotizen: {
      atmosphaere: typeof ratingNotizen.atmosphaere === 'string' ? ratingNotizen.atmosphaere : fallback.ratingNotizen.atmosphaere,
      wiederhoerenswert: typeof ratingNotizen.wiederhoerenswert === 'string' ? ratingNotizen.wiederhoerenswert : fallback.ratingNotizen.wiederhoerenswert,
      story: typeof ratingNotizen.story === 'string' ? ratingNotizen.story : fallback.ratingNotizen.story,
      charakterdynamik: typeof ratingNotizen.charakterdynamik === 'string' ? ratingNotizen.charakterdynamik : fallback.ratingNotizen.charakterdynamik,
      nostalgie: typeof ratingNotizen.nostalgie === 'string' ? ratingNotizen.nostalgie : fallback.ratingNotizen.nostalgie,
      gruselfaktor: typeof ratingNotizen.gruselfaktor === 'string' ? ratingNotizen.gruselfaktor : fallback.ratingNotizen.gruselfaktor,
    },
  };
}

function autoResizeTextarea(element: HTMLTextAreaElement): void {
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

function loadRadioplays(): Radioplay[] {
  try {
    type StoredRadioplayPayload = {
      key: string;
      raw: string;
      parsed: Array<Partial<Radioplay>>;
    };

    const readStoredRadioplays = (key: string): StoredRadioplayPayload | null => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Array<Partial<Radioplay>>;
      if (!Array.isArray(parsed) || !parsed.length) return null;
      return { key, raw, parsed };
    };

    const storedPayload = STORAGE_WRITE_KEYS
      .map((key) => readStoredRadioplays(key))
      .find((value): value is StoredRadioplayPayload => value !== null);

    if (!storedPayload) return defaultRadioplays;

    if (storedPayload.key !== STORAGE_CANONICAL_KEY) {
      try {
        STORAGE_WRITE_KEYS.forEach((key) => localStorage.setItem(key, storedPayload.raw));
      } catch {
        // keep app running even if iOS storage quota/availability fails
      }
    }

    const { parsed } = storedPayload;

    const mergedDefaults = defaultRadioplays.map((fallback) => {
      const existing = parsed.find((item) => item.id === fallback.id);
      return existing ? hydrateRadioplay(existing, fallback) : fallback;
    });

    const knownIds = new Set(mergedDefaults.map((play) => play.id));
    const customEpisodes = parsed
      .filter((item): item is Partial<Radioplay> & { id: string } => typeof item.id === 'string' && !knownIds.has(item.id))
      .map((item) => {
        const fallback: Radioplay = {
          id: item.id,
          title: typeof item.title === 'string' ? item.title : 'Die Drei ???',
          episode: normalizeEpisodeLabel(typeof item.episode === 'string' ? item.episode : item.id),
          year: typeof item.year === 'number' ? item.year : 0,
          coverImage: typeof item.coverImage === 'string' ? item.coverImage : undefined,
          zuerstGehoertAm: '',
          wiedergaben: 0,
          nostalgie: 0,
          lieblingscharakter: '',
          mostHatedCharacter: '',
          atmosphaere: 0,
          wiederhoerenswert: 0,
          story: 0,
          charakterdynamik: 0,
          fallquality: 0,
          gruselfaktor: 0,
          klassiker: false,
          bobcastGehoert: false,
          beschreibungDerFolge: '',
          ratingNotizen: createEmptyRatingNotizen(),
        };

        return hydrateRadioplay(item, fallback);
      });

    return [...mergedDefaults, ...customEpisodes];
  } catch {
    return defaultRadioplays;
  }
}

function ratingLabel(rating: number): string {
  if (rating >= 5) return 'Legendär';
  if (rating >= 4) return 'Stark';
  if (rating >= 3) return 'Solide';
  if (rating >= 2) return 'Schwach';
  return 'Katastrophe';
}

function formatDuration(durationMs: number): string {
  const totalMinutes = Math.max(0, Math.floor(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')} h`;
  }

  return `${totalMinutes} min`;
}

function getEpisodeMetadata(episodeId: string): EpisodeCatalogEntry | undefined {
  return episodeMetadataEntries.find((entry) => entry.id === episodeId);
}

function coverPath(id: string): string {
  return `${BASE_URL}covers/folge-${id.padStart(3, '0')}.webp`;
}

function getCoverSource(play: Pick<Radioplay, 'id' | 'coverImage'>): string {
  if (play.coverImage) {
    if (play.coverImage.startsWith('data:') || play.coverImage.startsWith('http')) {
      return play.coverImage;
    }

    return `${BASE_URL}${play.coverImage.replace(/^\/+/, '')}`;
  }

  return coverPath(play.id);
}

function handleCoverError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = `${BASE_URL}logo.jpeg`;
}

function isEpisodeRated(play: Radioplay): boolean {
  return (
    play.atmosphaere !== 0
    || play.wiederhoerenswert !== 0
    || play.story !== 0
    || play.charakterdynamik !== 0
    || play.fallquality !== 0
    || play.gruselfaktor > 0
  );
}

export default function App() {
  const [radioplays, setRadioplays] = useState<Radioplay[]>(loadRadioplays);
  const [selectedId, setSelectedId] = useState('');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [isRankingListOpen, setIsRankingListOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupMessageTone, setBackupMessageTone] = useState<'info' | 'error'>('info');
  const replaceImportFileRef = useRef<HTMLInputElement | null>(null);
  const mergeImportFileRef = useRef<HTMLInputElement | null>(null);
  const selected = useMemo(
    () => radioplays.find((play: Radioplay) => play.id === selectedId),
    [radioplays, selectedId],
  );
  const selectedMetadata = useMemo(() => (selected ? getEpisodeMetadata(selected.id) : undefined), [selected]);
  const normalizedArchiveSearch = archiveSearch.trim().toLowerCase();
  const filteredRadioplays = useMemo(() => {
    if (!normalizedArchiveSearch) return radioplays;

    return radioplays.filter((play) => {
      const episodeNumber = `folge ${play.id}`;
      const episodeName = episodeNameFromLabel(play.episode).toLowerCase();
      const episodeLabel = play.episode.toLowerCase();
      return (
        episodeLabel.includes(normalizedArchiveSearch)
        || episodeNumber.includes(normalizedArchiveSearch)
        || episodeName.includes(normalizedArchiveSearch)
      );
    });
  }, [normalizedArchiveSearch, radioplays]);
  const archiveSuggestions = useMemo(() => {
    if (!normalizedArchiveSearch) return [];

    return radioplays
      .map((play) => ({
        id: play.id,
        label: `${episodeNumberFromLabel(play.episode)} · ${episodeNameFromLabel(play.episode)}`,
        title: episodeNameFromLabel(play.episode).toLowerCase(),
      }))
      .filter((item) => item.title.includes(normalizedArchiveSearch))
      .slice(0, 6);
  }, [normalizedArchiveSearch, radioplays]);

  const selectedEpisodeCharacters = useMemo(() => {
    if (!selectedMetadata?.sprechrollen?.length) return [];

    const set = new Set<string>();
    selectedMetadata.sprechrollen.forEach((role) => {
      if (role?.rolle) set.add(role.rolle);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
  }, [selectedMetadata]);

  const rollenwertung = useMemo(() => {
    const counts: Record<string, number> = {};

    radioplays.forEach((play) => {
      const like = (play.lieblingscharakter || '').trim();
      if (like) counts[like] = (counts[like] || 0) + 1;

      const hate = (play.mostHatedCharacter || '').trim();
      if (hate) counts[hate] = (counts[hate] || 0) - 1;
    });

    const entries = Object.entries(counts);
    entries.sort((a, b) => b[1] - a[1]);

    const topFive = entries.slice(0, 5);
    const bottomFive = entries.slice(Math.max(entries.length - 5, 0)).sort((a, b) => a[1] - b[1]);

    return { topFive, bottomFive };
  }, [radioplays]);



  // last check persisted in localStorage under 'bobs-archiv-last-berlin-check'
  const [newEpisodesAvailable, setNewEpisodesAvailable] = useState<number>(0);
  const [newEpisodesPreview, setNewEpisodesPreview] = useState<Array<{ nummer?: string; titel?: string }>>([]);

  useEffect(() => {
    const checkNow = async () => {
      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Berlin',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(new Date());

        const obj: Record<string, string> = {};
        parts.forEach((p) => { if (p.type !== 'literal') obj[p.type] = p.value; });
        const dateKey = `${obj.year}-${obj.month}-${obj.day}`;
        const hour = Number(obj.hour);
        const minute = Number(obj.minute);

        if (hour === 4 && minute === 0 && localStorage.getItem('bobs-archiv-last-berlin-check') !== dateKey) {
          try {
            const res = await fetch('https://dreimetadaten.de/data/Serie.json', { cache: 'no-store' });
            if (!res.ok) {
              localStorage.setItem('bobs-archiv-last-berlin-check', dateKey);
              return;
            }

            const payload = await res.json();
            const serie = Array.isArray(payload?.serie) ? payload.serie : [];
            const standardCount = serie.filter((e: any) => !e.unvollständig && e.nummer).length || serie.length;
            const localStandardCount = (episodeMetadataEntries as EpisodeCatalogEntry[]).filter((e) => (e.type ?? 'episode') === 'episode').length;
            if (standardCount > localStandardCount) {
              setNewEpisodesAvailable(standardCount - localStandardCount);
              setNewEpisodesPreview(serie.slice(Math.max(0, serie.length - 10)).map((it: any) => ({ nummer: it.nummer, titel: it.titel })));
            }

            localStorage.setItem('bobs-archiv-last-berlin-check', dateKey);
          } catch {
            // ignore network errors
            localStorage.setItem('bobs-archiv-last-berlin-check', dateKey);
          }
        }
      } catch {
        // ignore
      }
    };

    void checkNow();
    const id = setInterval(() => { void checkNow(); }, 60_000);
    return () => { clearInterval(id); };
  }, []);
  const topRatedEpisodes = useMemo(
    () => radioplays
      .filter((play) => hasGeneralRating(play))
      .map((play) => ({ play, rating: overallRating(play) }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3),
    [radioplays],
  );
  const rankedEpisodes = useMemo(
    () => radioplays
      .filter((play) => hasGeneralRating(play))
      .map((play) => ({ play, rating: overallRating(play) }))
      .sort((a, b) => b.rating - a.rating),
    [radioplays],
  );
  const averageRatedEpisodes = useMemo(
    () => (rankedEpisodes.length > 0
      ? rankedEpisodes.reduce((total, item) => total + item.rating, 0) / rankedEpisodes.length
      : 0),
    [rankedEpisodes],
  );

  const heardEpisodes = useMemo(
    () => radioplays.filter((play) => isHeardEpisode(play)),
    [radioplays],
  );

  const heardEpisodesCount = heardEpisodes.length;
  const heardEpisodesShare = radioplays.length > 0 ? (heardEpisodesCount / radioplays.length) * 100 : 0;
  const heardEpisodesRemaining = Math.max(0, radioplays.length - heardEpisodesCount);
  const heardChartStyle = {
    '--heard-share': `${Math.min(100, Math.max(0, heardEpisodesShare)).toFixed(1)}%`,
  } as CSSProperties;

  const scaryRankedEpisodes = useMemo(
    () => radioplays
      .filter((play) => play.gruselfaktor > 0)
      .map((play) => ({ play, score: play.gruselfaktor }))
      .sort((a, b) => b.score - a.score),
    [radioplays],
  );

  const wiedergabenRankedEpisodes = useMemo(
    () => radioplays
      .filter((play) => isHeardEpisode(play))
      .map((play) => ({ play, score: Math.max(play.wiedergaben, 1) }))
      .sort((a, b) => b.score - a.score),
    [radioplays],
  );
  useEffect(() => {
    try {
      const serialized = JSON.stringify(radioplays);
      STORAGE_WRITE_KEYS.forEach((key) => localStorage.setItem(key, serialized));
    } catch {
      // keep app running even if iOS storage quota/availability fails
    }
  }, [radioplays]);

  useEffect(() => {
    if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') return;
    void navigator.storage.persist();
  }, []);

  useEffect(() => {
    if (!selected) return;
    document.querySelectorAll<HTMLTextAreaElement>('.rating-note-input').forEach((textarea) => {
      autoResizeTextarea(textarea);
    });
  }, [selected]);

  useEffect(() => {
    setRadioplays((current: Radioplay[]) => {
      let changed = false;

      const next = current.map((play: Radioplay) => {
        if (hasHeardEvidence(play) && play.wiedergaben === 0) {
          changed = true;
          return { ...play, wiedergaben: 1 };
        }

        return play;
      });

      return changed ? next : current;
    });
  }, [radioplays]);

  const updateCategory = (id: string, category: RatingCategory, value: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, [category]: value } : play)));
  };

  const updateGruselfaktor = (id: string, gruselfaktor: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, gruselfaktor } : play)));
  };

  const updateToggle = (id: string, field: 'klassiker' | 'bobcastGehoert', checked: boolean) => {
    console.debug('updateToggle', { id, field, checked });
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, [field]: checked } : play)));
  };

  const updateBeschreibung = (id: string, beschreibungDerFolge: string) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, beschreibungDerFolge } : play)));
  };

  const updateZuerstGehoertAm = (id: string, zuerstGehoertAm: string) => {
    console.debug('updateZuerstGehoertAm', { id, zuerstGehoertAm });
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, zuerstGehoertAm } : play)));
  };

  const updateWiedergaben = (id: string, wiedergaben: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, wiedergaben } : play)));
  };

  const updateNostalgie = (id: string, nostalgie: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, nostalgie } : play)));
  };

  const updateLieblingscharakter = (id: string, lieblingscharakter: string) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, lieblingscharakter } : play)));
  };

  const updateMostHatedCharacter = (id: string, mostHatedCharacter: string) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, mostHatedCharacter } : play)));
  };

  const updateRatingNotiz = (id: string, field: RatingNoteKey, value: string) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id
      ? { ...play, ratingNotizen: { ...play.ratingNotizen, [field]: value } }
      : play)));
  };

  const createBackupFileName = () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return `bobs-archiv-backup-${iso}.json`;
  };

  const triggerBackupDownload = (serialized: string, fileName: string) => {
    const blob = new Blob([serialized], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleExportBackup = async () => {
    try {
      const backup: BackupPayload = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        radioplays,
      };
      const serialized = JSON.stringify(backup, null, 2);
      const fileName = createBackupFileName();

      // Use reliable download approach (works on all platforms)
      triggerBackupDownload(serialized, fileName);

      // Optionally try web share API if available (non-blocking)
      if (typeof navigator.share === 'function' && navigator.canShare !== undefined) {
        // Web Share API doesn't reliably support files on all platforms,
        // so we just share text as fallback if needed
        try {
          await navigator.share({
            title: 'Bobs Archiv Backup',
            text: `Backup vom ${new Date().toLocaleDateString('de-DE')}`,
          });
        } catch (shareError) {
          // Share cancelled or failed, but that's ok since we already downloaded
          if ((shareError as Error).name !== 'AbortError') {
            console.debug('Share API not available or cancelled');
          }
        }
      }

      setBackupMessageTone('info');
      setBackupMessage('Backup exportiert. Datei sicher aufheben (z. B. iCloud, Google Drive oder Dateien-App).');
    } catch (error) {
      console.error('Export backup error:', error);
      setBackupMessageTone('error');
      setBackupMessage('Backup konnte nicht exportiert werden. Bitte erneut versuchen.');
    }
  };

  const getImportedRadioplays = (payload: unknown): Array<Partial<Radioplay>> | null => {
    const imported = Array.isArray(payload)
      ? payload
      : (typeof payload === 'object' && payload !== null && Array.isArray((payload as { radioplays?: unknown }).radioplays)
        ? (payload as { radioplays: Array<Partial<Radioplay>> }).radioplays
        : null);

    if (!imported || !imported.length) {
      return null;
    }

    return imported;
  };

  const createFallbackFromImportedItem = (item: Partial<Radioplay> & { id: string }): Radioplay => ({
    id: item.id,
    title: typeof item.title === 'string' ? item.title : 'Die Drei ???',
    episode: normalizeEpisodeLabel(typeof item.episode === 'string' ? item.episode : item.id),
    year: typeof item.year === 'number' ? item.year : 0,
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : undefined,
    zuerstGehoertAm: '',
    wiedergaben: 0,
    nostalgie: 0,
    lieblingscharakter: '',
    mostHatedCharacter: '',
    atmosphaere: 0,
    wiederhoerenswert: 0,
    story: 0,
    charakterdynamik: 0,
    fallquality: 0,
    gruselfaktor: 0,
    klassiker: false,
    bobcastGehoert: false,
    beschreibungDerFolge: '',
    ratingNotizen: createEmptyRatingNotizen(),
  });

  const persistImportedRadioplays = (imported: Array<Partial<Radioplay>>) => {
    const serialized = JSON.stringify(imported);
    STORAGE_WRITE_KEYS.forEach((key) => localStorage.setItem(key, serialized));
    setRadioplays(loadRadioplays());
    setSelectedId('');
    setIsStatsOpen(false);
    setIsRankingListOpen(false);
  };

  const applyImportedPayloadReplace = (payload: unknown) => {
    const imported = getImportedRadioplays(payload);
    if (!imported) {
      throw new Error('invalid-backup');
    }

    persistImportedRadioplays(imported);
  };

  const applyImportedPayloadMerge = (payload: unknown) => {
    const imported = getImportedRadioplays(payload);
    if (!imported) {
      throw new Error('invalid-backup');
    }

    const mergedMap = new Map<string, Radioplay>(radioplays.map((play) => [play.id, play]));

    imported.forEach((item) => {
      if (typeof item.id !== 'string') return;
      const fallback = mergedMap.get(item.id)
        ?? defaultRadioplays.find((entry) => entry.id === item.id)
        ?? createFallbackFromImportedItem(item as Partial<Radioplay> & { id: string });
      mergedMap.set(item.id, hydrateRadioplay(item, fallback));
    });

    persistImportedRadioplays(Array.from(mergedMap.values()));
  };

  const createMergeImportPreview = (imported: Array<Partial<Radioplay>>): MergeImportPreview => {
    const currentById = new Map<string, Radioplay>(radioplays.map((play) => [play.id, play]));
    const importedById = new Map<string, Partial<Radioplay>>();

    imported.forEach((item) => {
      if (typeof item.id !== 'string') return;
      importedById.set(item.id, item);
    });

    let added = 0;
    let updated = 0;
    let unchanged = 0;

    importedById.forEach((item, id) => {
      const current = currentById.get(id);
      const fallback = current
        ?? defaultRadioplays.find((entry) => entry.id === id)
        ?? createFallbackFromImportedItem(item as Partial<Radioplay> & { id: string });
      const merged = hydrateRadioplay(item, fallback);

      if (!current) {
        added += 1;
        return;
      }

      if (JSON.stringify(current) === JSON.stringify(merged)) {
        unchanged += 1;
      } else {
        updated += 1;
      }
    });

    return {
      importedEntries: importedById.size,
      added,
      updated,
      unchanged,
    };
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const shouldImport = window.confirm('Aktuelle lokale Daten werden durch dieses Backup ersetzt. Fortfahren?');
      if (!shouldImport) return;

      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      applyImportedPayloadReplace(parsed);

      setBackupMessageTone('info');
      setBackupMessage('Backup erfolgreich importiert. Alle Daten werden weiterhin nur lokal gespeichert.');
    } catch {
      setBackupMessageTone('error');
      setBackupMessage('Import fehlgeschlagen. Bitte eine gueltige Backup-JSON auswaehlen.');
    } finally {
      event.currentTarget.value = '';
    }
  };

  const handleMergeImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = getImportedRadioplays(parsed);
      if (!imported) {
        throw new Error('invalid-backup');
      }

      const preview = createMergeImportPreview(imported);
      const shouldImport = window.confirm(
        `Merge-Vorschau:\n- Importierte Eintraege: ${preview.importedEntries}\n- Wird aktualisiert: ${preview.updated}\n- Wird hinzugefuegt: ${preview.added}\n- Unveraendert: ${preview.unchanged}\n\nFortfahren?`,
      );
      if (!shouldImport) return;

      applyImportedPayloadMerge(parsed);

      setBackupMessageTone('info');
      setBackupMessage('Merge-Import erfolgreich. Vorhandene Daten wurden behalten und passende Eintraege aktualisiert.');
    } catch {
      setBackupMessageTone('error');
      setBackupMessage('Merge-Import fehlgeschlagen. Bitte eine gueltige Backup-JSON auswaehlen.');
    } finally {
      event.currentTarget.value = '';
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <img className="hero-image" src={`${BASE_URL}header.jpeg`} alt="Bobs Archiv Das ???-Fallometer" />
      </section>

      {newEpisodesAvailable ? (
        <div className="new-episodes-banner">
          <p>
            Neue Folgen verfügbar: {newEpisodesAvailable}.{' '}
            <button type="button" className="linkish-button" onClick={() => {
              if (newEpisodesPreview.length) {
                alert(newEpisodesPreview.map((p) => `${p.nummer ?? ''}: ${p.titel ?? ''}`).join('\n'));
              } else {
                window.open('https://dreimetadaten.de/index.html', '_blank');
              }
            }}>
              Anzeigen
            </button>
          </p>
        </div>
      ) : null}

      <section className={`layout ${selected && !isStatsOpen ? 'with-details' : ''}`}>
        {!selected && !isStatsOpen ? (
          <div className="panel list-panel">
            <div className="panel-header">
              <div>
                <h2>Archiv</h2>
                <span>{filteredRadioplays.length} von {radioplays.length} Einträgen</span>
              </div>
            </div>

            <label className="archive-search">
              <span>Suche nach Folge oder Titel</span>
              <input
                type="search"
                value={archiveSearch}
                onChange={(event) => setArchiveSearch(event.target.value)}
                placeholder="z. B. 12 oder Gespensterschloss"
                list="archive-title-suggestions"
              />
            </label>

            <datalist id="archive-title-suggestions">
              {archiveSuggestions.map((item) => (
                <option key={item.id} value={episodeNameFromLabel(radioplays.find((play) => play.id === item.id)?.episode ?? item.label)} />
              ))}
            </datalist>

            {archiveSuggestions.length ? (
              <div className="archive-suggestions" aria-label="Titelvorschläge">
                {archiveSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="archive-suggestion"
                    onClick={() => setArchiveSearch(item.label)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="cards">
              {filteredRadioplays.map((play) => (
                <button
                  key={play.id}
                  className={`play-card ${selectedId === play.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedId(play.id);
                    setIsStatsOpen(false);
                  }}
                  aria-label={play.episode}
                >
                  <img
                    className={`cover-image ${isEpisodeRated(play) ? 'rated' : 'unrated'}`}
                    src={getCoverSource(play)}
                    alt={`${play.episode} Cover`}
                    loading="eager"
                    decoding="async"
                    onError={handleCoverError}
                  />
                </button>
              ))}
            </div>

            {!filteredRadioplays.length ? <p className="empty-state">Keine Folgen gefunden.</p> : null}

            <section className="backup-tools" aria-label="Backup und Wiederherstellung">
              <h3>Daten-Backup</h3>
              <p>
                Exportiere dein Archiv als JSON und importiere es spaeter wieder. Alle Daten bleiben lokal auf deinem Geraet.
              </p>
              <div className="backup-actions">
                <button type="button" className="backup-button" onClick={() => { void handleExportBackup(); }}>
                  Backup exportieren
                </button>
                <button
                  type="button"
                  className="backup-button backup-button-secondary"
                  onClick={() => replaceImportFileRef.current?.click()}
                >
                  Backup importieren
                </button>
                <button
                  type="button"
                  className="backup-button backup-button-secondary"
                  onClick={() => mergeImportFileRef.current?.click()}
                >
                  Backup mergen
                </button>
                <input
                  ref={replaceImportFileRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    void handleImportBackup(event);
                  }}
                />
                <input
                  ref={mergeImportFileRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    void handleMergeImportBackup(event);
                  }}
                />
              </div>
              {backupMessage ? (
                <p className={`backup-message ${backupMessageTone === 'error' ? 'backup-message-error' : ''}`}>
                  {backupMessage}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}

        {selected && !isStatsOpen ? (
          <div className="panel detail-panel">
            <>
              {(() => {
                const generalRating = overallRating(selected);
                const ratedGeneral = hasGeneralRating(selected);

                return (
                  <>
              <button className="back-button" onClick={() => {
                setSelectedId('');
                setIsStatsOpen(false);
              }}>
                ← Zurück zum Archiv
              </button>

              <div className="panel-header detail-header">
                <div>
                  <h2>{`${selected.title} ${episodeNameFromLabel(selected.episode)}`}</h2>
                  <p className="detail-episode-number">{episodeNumberFromLabel(selected.episode)}</p>
                  <p className="detail-year">{selected.year}</p>
                  {selectedMetadata?.autor ? (
                    <p className="detail-author">{selectedMetadata.autor}</p>
                  ) : null}
                  {selectedMetadata?.gesamtdauerMs ? (
                    <p className="detail-duration">{formatDuration(selectedMetadata.gesamtdauerMs)}</p>
                  ) : null}
                  {selectedMetadata?.sprechrollen?.length ? (
                    <details className="detail-cast">
                      <summary>Charaktere ({selectedMetadata.sprechrollen.length})</summary>
                      <div className="cast-list">
                        {selectedMetadata.sprechrollen.map((role) => (
                          <span key={`${role.rolle}-${role.sprecher}-${role.pseudonym ?? ''}`} className="cast-chip">
                            {role.rolle}: {role.sprecher}{role.pseudonym ? ` (${role.pseudonym})` : ''}
                          </span>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
                <img className="detail-cover" src={getCoverSource(selected)} alt={`${selected.episode} Cover`} onError={handleCoverError} />
              </div>
              <div className="rating-badge">
                {ratedGeneral ? `${ratingLabel(generalRating)} · ${generalRating.toFixed(1)}/5` : 'Noch nicht bewertet'}
              </div>

              <div className="stars" aria-label={`Allgemeine Bewertung ${generalRating.toFixed(1)} von 5`}>
                {Array.from({ length: 5 }, (_, index) => {
                  const star = index + 1;
                  const fill = ratedGeneral ? Math.max(0, Math.min(1, generalRating - index)) : 0;

                  return (
                    <span key={star} className="star-meter" aria-hidden="true">
                      <span className="star-base">★</span>
                      <span className="star-fill" style={{ width: `${fill * 100}%` }}>★</span>
                    </span>
                  );
                })}
              </div>

              <label className="field">
                <span>Beschreibung der Folge</span>
                <textarea
                  rows={5}
                  value={selected.beschreibungDerFolge}
                  onChange={(event) => updateBeschreibung(selected.id, event.target.value)}
                  placeholder="Kommentar zur Folge..."
                />
              </label>

              <div className="first-heard-row">
                <label className="field">
                  <span>Zuerst gehört am</span>
                  <div className="date-input-row">
                    <input
                      type="date"
                      value={selected.zuerstGehoertAm}
                      onChange={(event) => updateZuerstGehoertAm(selected.id, event.target.value)}
                    />
                    {selected.zuerstGehoertAm ? (
                      <button
                        type="button"
                        className="clear-date-button"
                        onClick={() => updateZuerstGehoertAm(selected.id, '')}
                        onTouchEnd={() => updateZuerstGehoertAm(selected.id, '')}
                        aria-label="Datum löschen"
                      >
                        Kein Datum
                      </button>
                    ) : null}
                  </div>
                </label>

                <label className="field field-small-number">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    aria-label="Wiedergaben"
                    value={selected.wiedergaben}
                    onChange={(event) => updateWiedergaben(selected.id, Math.max(0, Number(event.target.value) || 0))}
                  />
                </label>
              </div>

              <label className="field">
                <span>Lieblingscharakter</span>
                <input
                  type="text"
                  value={selected.lieblingscharakter}
                  onChange={(event) => updateLieblingscharakter(selected.id, event.target.value)}
                  placeholder="z. B. Peter Shaw"
                  list="charakter-suggestions"
                />
              </label>

              <label className="field">
                <span>Most hated Charakter</span>
                <input
                  type="text"
                  value={selected.mostHatedCharacter}
                  onChange={(event) => updateMostHatedCharacter(selected.id, event.target.value)}
                  placeholder="z. B. Skinny Norris"
                  list="charakter-suggestions"
                />
              </label>

              <datalist id="charakter-suggestions">
                {selectedEpisodeCharacters.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              {ratingCategories.map((category) => (
                <label className="field" key={category.key}>
                  <span>{category.label}</span>
                  <div className="rating-stars" role="group" aria-label={`${category.label} Bewertung`}>
                    {ratingStarValues.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`rating-star ${selected[category.key] >= value ? 'active' : ''}`}
                        onClick={() => updateCategory(selected.id, category.key, selected[category.key] === value ? 0 : value)}
                        aria-pressed={selected[category.key] >= value}
                        aria-label={`${category.label}: ${value}`}
                      >
                        <img
                          className="rating-icon"
                          src={ratingIconPath((selected[category.key] >= value ? ratingIconPair(category.key).on : ratingIconPair(category.key).off))}
                          alt=""
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="rating-note-input"
                    rows={1}
                    value={selected.ratingNotizen[category.key]}
                    onInput={(event) => autoResizeTextarea(event.currentTarget)}
                    onChange={(event) => updateRatingNotiz(selected.id, category.key, event.target.value)}
                    placeholder="Notiz..."
                  />
                </label>
              ))}

              <label className="field">
                <span>Nostalgie</span>
                <div className="rating-stars" role="group" aria-label="Nostalgie Bewertung">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rating-star nostalgia ${selected.nostalgie >= value ? 'active' : ''}`}
                      onClick={() => updateNostalgie(selected.id, selected.nostalgie === value ? 0 : value)}
                      aria-pressed={selected.nostalgie >= value}
                      aria-label={`Nostalgie: ${value}`}
                    >
                      <img
                        className="rating-icon"
                        src={ratingIconPath(selected.nostalgie >= value ? ratingIconPair('nostalgie').on : ratingIconPair('nostalgie').off)}
                        alt=""
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="rating-note-input"
                  rows={1}
                  value={selected.ratingNotizen.nostalgie}
                  onInput={(event) => autoResizeTextarea(event.currentTarget)}
                  onChange={(event) => updateRatingNotiz(selected.id, 'nostalgie', event.target.value)}
                  placeholder="Notiz..."
                />
              </label>

              <label className="field">
                <span>Gruselfaktor: {selected.gruselfaktor}/5</span>
                <div className="rating-stars" role="group" aria-label="Gruselfaktor Bewertung">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rating-star ${selected.gruselfaktor >= value ? 'active' : ''}`}
                      onClick={() => updateGruselfaktor(selected.id, selected.gruselfaktor === value ? 0 : value)}
                      aria-pressed={selected.gruselfaktor >= value}
                      aria-label={`Gruselfaktor: ${value}`}
                    >
                      <img
                        className="rating-icon"
                        src={ratingIconPath(selected.gruselfaktor >= value ? ratingIconPair('gruselfaktor').on : ratingIconPair('gruselfaktor').off)}
                        alt=""
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="rating-note-input"
                  rows={1}
                  value={selected.ratingNotizen.gruselfaktor}
                  onInput={(event) => autoResizeTextarea(event.currentTarget)}
                  onChange={(event) => updateRatingNotiz(selected.id, 'gruselfaktor', event.target.value)}
                  placeholder="Notiz..."
                />
              </label>

              <label className="field">
                <span>
                    <button
                        type="button"
                        className="toggle-icon-button"
                        onClick={() => updateToggle(selected.id, 'klassiker', !selected.klassiker)}
                        aria-pressed={selected.klassiker}
                        aria-label="Klassiker umschalten"
                      >
                    <img
                      className={`rating-icon klassiker-icon ${selected.klassiker ? 'klassiker-icon-active' : ''}`}
                      src={ratingIconPath(selected.klassiker ? 's2' : 's')}
                      alt=""
                      aria-hidden="true"
                    />
                  </button>{' '}
                  Klassiker
                </span>
              </label>

              <label className="field">
                <span>
                    <button
                        type="button"
                        className="toggle-icon-button"
                        onClick={() => updateToggle(selected.id, 'bobcastGehoert', !selected.bobcastGehoert)}
                        aria-pressed={selected.bobcastGehoert}
                        aria-label="Bobcast gehört umschalten"
                      >
                    <img
                      className="rating-icon bobcast-icon"
                      src={ratingIconPath(selected.bobcastGehoert ? 'p2' : 'p')}
                      alt=""
                      aria-hidden="true"
                    />
                  </button>{' '}
                  Bobcast gehört
                </span>
              </label>
                  </>
                );
              })()}
            </>
          </div>
        ) : null}

        {isStatsOpen ? (
          <div className="panel stats-panel">
            <div className="panel-header">
              <h2>Statistik</h2>
            </div>

            <div className="heard-summary">
              <div className="heard-chart-card">
                <div
                  className="heard-chart"
                  style={heardChartStyle}
                  role="img"
                  aria-label={`Bereits gehört: ${heardEpisodesCount} von ${radioplays.length} Folgen`}
                >
                  <div className="heard-chart-center">
                    <span className="heard-chart-number">{heardEpisodesCount}</span>
                    <span className="heard-chart-text">gehört</span>
                  </div>
                </div>

                <div className="heard-chart-copy">
                  <h3>Bereits gehört</h3>
                  <p>
                    {radioplays.length > 0
                      ? `${heardEpisodesCount} von ${radioplays.length} Folgen (${heardEpisodesShare.toFixed(0)}%)`
                      : 'Noch keine Folgen vorhanden'}
                  </p>
                  <p>{heardEpisodesRemaining} Folgen noch offen</p>
                </div>
              </div>

              <div className="heard-chart-copy">
                <h3>Charakter-Rankings</h3>
                <div className="rollenwertung-grid">
                  <div>
                    <h4>Lieblingscharaktere</h4>
                    {rollenwertung.topFive.length === 0 && <p>Keine Nennungen</p>}
                    <ol>
                      {rollenwertung.topFive.map(([name, score]) => (
                        <li key={`top-${name}`}>{name} ({score > 0 ? `+${score}` : score})</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4>Most hated Charaktere</h4>
                    {rollenwertung.bottomFive.length === 0 && <p>Keine Nennungen</p>}
                    <ol>
                      {rollenwertung.bottomFive.map(([name, score]) => (
                        <li key={`bot-${name}`}>{name} ({score > 0 ? `+${score}` : score})</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="beste-folgen-title">Beste Folgen</h3>

            <div
              className="podium podium-clickable"
              role="button"
              tabIndex={0}
              onClick={() => setIsRankingListOpen((current) => !current)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setIsRankingListOpen((current) => !current);
                }
              }}
              aria-label="Podium öffnen, um alle Rankings zu zeigen"
            >
              {[1, 0, 2].map((index) => {
                const item = topRatedEpisodes[index];
                const rank = index + 1;
                const heightClass = rank === 1 ? 'podium-rank-first' : rank === 2 ? 'podium-rank-second' : 'podium-rank-third';

                return (
                  <div key={rank} className={`podium-item ${heightClass}`}>
                    {item ? (
                      <>
                        <p className="podium-rating">{item.rating.toFixed(1)}/5</p>
                        <button
                          className="podium-cover-button"
                          type="button"
                          onClick={() => {
                            setSelectedId(item.play.id);
                            setIsStatsOpen(false);
                          }}
                          aria-label={`${item.play.episode} öffnen`}
                        >
                          <img
                            className="podium-cover"
                            src={getCoverSource(item.play)}
                            alt={`${item.play.episode} Cover`}
                            onError={handleCoverError}
                          />
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="podium-rating">-</p>
                        <div className="podium-cover podium-placeholder" />
                      </>
                    )}
                    <div className="podium-step">
                      <p className="podium-rank">#{rank}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="top-flop-grid">
              <div className="top-flop-card">
                <p className="top-flop-label">Top-Folge</p>
                {rankedEpisodes[0] ? (
                  <>
                    <img
                      className="top-flop-cover"
                      src={getCoverSource(rankedEpisodes[0].play)}
                      alt={`${rankedEpisodes[0].play.episode} Cover`}
                      onError={handleCoverError}
                    />
                    <p className="top-flop-score">{rankedEpisodes[0].rating.toFixed(1)}/5</p>
                  </>
                ) : (
                  <p className="top-flop-empty">Noch keine Bewertung</p>
                )}
              </div>

              <div className="top-flop-card top-flop-average-card">
                <div className="top-flop-average-icon" aria-hidden="true">
                  <span className="top-flop-mean-symbol">Ø</span>
                </div>
                <p className="top-flop-score">{rankedEpisodes.length > 0 ? `${averageRatedEpisodes.toFixed(1)}/5` : '-'}</p>
              </div>

              <div className="top-flop-card">
                <p className="top-flop-label">Flop-Folge</p>
                {rankedEpisodes[rankedEpisodes.length - 1] ? (
                  <>
                    <img
                      className="top-flop-cover"
                      src={getCoverSource(rankedEpisodes[rankedEpisodes.length - 1].play)}
                      alt={`${rankedEpisodes[rankedEpisodes.length - 1].play.episode} Cover`}
                      onError={handleCoverError}
                    />
                    <p className="top-flop-score">{rankedEpisodes[rankedEpisodes.length - 1].rating.toFixed(1)}/5</p>
                  </>
                ) : (
                  <p className="top-flop-empty">Noch keine Bewertung</p>
                )}
              </div>
            </div>

            {isRankingListOpen ? (
              <div className="ranking-list">
                {rankedEpisodes.map((item, index) => (
                  <button
                    key={item.play.id}
                    type="button"
                    className="ranking-item"
                    onClick={() => {
                      setSelectedId(item.play.id);
                      setIsStatsOpen(false);
                      setIsRankingListOpen(false);
                    }}
                    aria-label={`${item.play.episode} öffnen`}
                  >
                    <span className="ranking-position">#{index + 1}</span>
                    <img className="ranking-cover" src={getCoverSource(item.play)} alt={`${item.play.episode} Cover`} onError={handleCoverError} />
                    <span className="ranking-title">{item.play.episode}</span>
                    <span className="ranking-score">{item.rating.toFixed(1)}/5</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="scary-section">
              <h3 className="scary-title">gruseligste Folgen</h3>

              <div className="ranking-list">
                {scaryRankedEpisodes.slice(0, 5).map((item, index) => (
                  <button
                    key={`scary-top5-${item.play.id}`}
                    type="button"
                    className="ranking-item"
                    onClick={() => {
                      setSelectedId(item.play.id);
                      setIsStatsOpen(false);
                      setIsRankingListOpen(false);
                    }}
                    aria-label={`${item.play.episode} öffnen`}
                  >
                    <span className="ranking-position">#{index + 1}</span>
                    <img className="ranking-cover" src={getCoverSource(item.play)} alt={`${item.play.episode} Cover`} onError={handleCoverError} />
                    <span className="ranking-title">{item.play.episode}</span>
                    <span className="ranking-score">{item.score}/5</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="scary-section">
              <h3 className="scary-title">meist gehörte Folgen</h3>

              <div className="ranking-list">
                {wiedergabenRankedEpisodes.slice(0, 5).map((item, index) => (
                  <button
                    key={`wied-top5-${item.play.id}`}
                    type="button"
                    className="ranking-item"
                    onClick={() => {
                      setSelectedId(item.play.id);
                      setIsStatsOpen(false);
                      setIsRankingListOpen(false);
                    }}
                    aria-label={`${item.play.episode} öffnen`}
                  >
                    <span className="ranking-position">#{index + 1}</span>
                    <img className="ranking-cover" src={getCoverSource(item.play)} alt={`${item.play.episode} Cover`} onError={handleCoverError} />
                    <span className="ranking-title">{item.play.episode}</span>
                    <span className="ranking-score">{item.score}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : null}
      </section>

      <footer className="app-beam" aria-label="Navigation">
        <button className="beam-button beam-button-left" type="button" onClick={() => {
          setSelectedId('');
          setIsStatsOpen(false);
          setIsRankingListOpen(false);
        }} aria-label="Archiv öffnen">
          <svg className="beam-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5z" fill="none" stroke="currentColor" stroke-width="1.8"/>
            <path d="M6.5 7V5.8A1.8 1.8 0 0 1 8.3 4h7.4A1.8 1.8 0 0 1 17.5 5.8V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M8 12h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>

        <div className="beam-divider" aria-hidden="true" />

        <button className="beam-button beam-button-right" type="button" aria-label="Trophy" onClick={() => {
          setIsStatsOpen(true);
          setSelectedId('');
          setIsRankingListOpen(false);
        }}>
          <svg className="beam-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5h8v3a4 4 0 0 1-8 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M8 7H5.5A1.5 1.5 0 0 0 4 8.5v1A2.5 2.5 0 0 0 6.5 12H8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M16 7h2.5A1.5 1.5 0 0 1 20 8.5v1A2.5 2.5 0 0 1 17.5 12H16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M12 12v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M9 19h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M10.5 16h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </footer>
    </main>
  );
}
