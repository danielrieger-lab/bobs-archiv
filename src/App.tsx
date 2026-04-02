import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type SyntheticEvent } from 'react';

type Radioplay = {
  id: string;
  title: string;
  episode: string;
  year: number;
  coverImage?: string;
  wiedergaben: number;
  lieblingscharakter: string;
  atmosphaere: number;
  wiederhoerenswert: number;
  story: number;
  charakterdynamik: number;
  fallquality: number;
  gruselfaktor: number;
  klassiker: boolean;
  bobcastGehoert: boolean;
  beschreibungDerFolge: string;
};

type AddEpisodeForm = {
  folgennummer: string;
  titel: string;
  jahr: string;
  coverImage: string;
};

const STORAGE_KEY = 'bobs-archiv-fallometer-ratings-v1';
const BASE_URL = import.meta.env.BASE_URL;

const EPISODE_SEED = `Folge 1: und der Superpapagei (12.10.1979)
Folge 2: und der Phantomsee (13.10.1979)
Folge 3: und der Karpatenhund (14.10.1979)
Folge 4: und die schwarze Katze (15.10.1979)
Folge 5: und der Fluch des Rubins (16.10.1979)
Folge 6: und der sprechende Totenkopf (17.10.1979)
Folge 7: und der unheimliche Drache (31.10.1979)
Folge 8: und der grüne Geist (01.11.1979)
Folge 9: und die rätselhaften Bilder (02.11.1979)
Folge 10: und die flüsternde Mumie (01.03.1980)
Folge 11: und das Gespensterschloss (02.03.1980)
Folge 12: und der seltsame Wecker (03.03.1980)
Folge 13: und der lachende Schatten (31.03.1980)
Folge 14: und das Bergmonster (01.04.1980)
Folge 15: und der rasende Löwe (02.04.1980)
Folge 16: und der Zauberspiegel (01.10.1980)
Folge 17: und die gefährliche Erbschaft (02.10.1980)
Folge 18: und die Geisterinsel (03.10.1980)
Folge 19: und der Teufelsberg (04.10.1980)
Folge 20: und die flammende Spur (09.10.1980)
Folge 21: und der tanzende Teufel (10.10.1980)
Folge 22: und der verschwundene Schatz (13.05.1981)
Folge 23: und das Aztekenschwert (14.05.1981)
Folge 24: und die silberne Spinne (15.05.1981)
Folge 25: und die singende Schlange (19.10.1981)
Folge 26: und die Silbermine (20.10.1981)
Folge 27: und der magische Kreis (20.10.1981)
Folge 28: und der Doppelgänger (22.10.1981)
Folge 29: Die Originalmusik (07.06.1982)
Folge 30: und das Riff der Haie (20.06.1982)
Folge 31: und das Narbengesicht (11.03.1983)
Folge 32: und der Ameisenmensch (12.03.1983)
Folge 33: und die bedrohte Ranch (21.10.1983)
Folge 34: und der rote Pirat (05.04.1984)
Folge 35: und der Höhlenmensch (16.10.1984)
Folge 36: und der Super-Wal (29.05.1985)
Folge 37: und der heimliche Hehler (01.11.1985)
Folge 38: und der unsichtbare Gegner (17.03.1986)
Folge 39: und die Perlenvögel (18.03.1986)
Folge 40: und der Automarder (27.11.1986)
Folge 41: und das Volk der Winde (17.09.1987)
Folge 42: und der weinende Sarg (26.10.1987)
Folge 43: und der höllische Werwolf (01.10.1988)
Folge 44: und der gestohlene Preis (02.10.1988)
Folge 45: und das Gold der Wikinger (01.04.1989)
Folge 46: und der schrullige Millionär (08.04.1989)
Folge 47: und der giftige Gockel (24.11.1989)
Folge 48: und die gefährlichen Fässer (25.11.1989)
Folge 49: und die Comic-Diebe (26.11.1990)
Folge 50: und der verschwundene Filmstar (19.03.1991)
Folge 51: und der riskante Ritt (20.03.1991)
Folge 52: und die Musikpiraten (12.07.1991)
Folge 53: und die Automafia (13.07.1991)
Folge 54: Gefahr in Verzug (17.02.1992)
Folge 55: Gekaufte Spieler (18.02.1992)
Folge 56: Angriff der Computer-Viren (14.09.1992)
Folge 57: Tatort Zirkus (18.07.1994)
Folge 58: und der verrückte Maler (18.07.1994)
Folge 59: Giftiges Wasser (10.08.1994)
Folge 60: Dopingmixer (11.08.1994)
Folge 61: und die Rache des Tigers (27.02.1995)
Folge 62: Spuk im Hotel (28.02.1995)
Folge 63: Fußball-Gangster (28.08.1995)
Folge 64: Geisterstadt (28.08.1995)
Folge 65: Diamantenschmuggel (04.12.1995)
Folge 66: und die Schattenmänner (04.12.1995)
Folge 67: und das Geheimnis der Särge (01.04.1996)
Folge 68: und der Schatz am Bergsee (02.04.1996)
Folge 69: Späte Rache (05.08.1996)
Folge 70: Schüsse aus dem Dunkel (05.08.1996)
Folge 71: und die verschwundene Seglerin (07.10.1996)
Folge 72: Dreckiger Deal (07.10.1996)
Folge 73: Poltergeist (10.02.1997)
Folge 74: und das brennende Schwert (10.02.1997)
Folge 75: Die Spur des Raben (14.07.1997)
Folge 76: Stimmen aus dem Nichts (08.09.1997)
Folge 77: Pistenteufel (08.12.1997)
Folge 78: Das leere Grab (12.01.1998)
Folge 79: Im Bann des Voodoo (09.03.1998)
Folge 80: Geheimakte Ufo (11.05.1998)
Folge 81: Verdeckte Fouls (08.06.1998)
Folge 82: Die Karten des Bösen (12.10.1998)
Folge 83: Meuterei auf hoher See (08.02.1999)
Folge 84: Musik des Teufels (08.02.1999)
Folge 85: Feuerturm (10.05.1999)
Folge 86: Nacht in Angst (09.08.1999)
Folge 87: Wolfsgesicht (11.10.1999)
Folge 88: Vampir im Internet (13.12.1999)
Folge 89: Tödliche Spur (15.05.2000)
Folge 90: Der Feuerteufel (15.05.2000)
Folge 91: Labyrinth der Götter (14.08.2000)
Folge 92: Todesflug (09.10.2000)
Folge 93 und das Geisterschiff (27.11.2000)
Folge 94: Das schwarze Monster (27.11.2000)
Folge 95: Botschaft von Geisterhand (12.02.2001)
Folge 96: und der rote Rächer (09.04.2001)
Folge 97: Insektenstachel (11.06.2001)
Folge 98: Tal des Schreckens (13.08.2001)
Folge 99: Rufmord (10.09.2001)
Folge 100: Toteninsel (15.10.2001)
Folge 101: und das Hexen-Handy (03.12.2001)
Folge 102: Doppelte Täuschung (11.03.2002)
Folge 103: Erbe des Meisterdiebes (13.05.2002)
Folge 104: Gift per E-Mail (08.07.2002)
Folge 105: Der Nebelberg (16.09.2002)
Folge 106: Der Mann ohne Kopf (16.09.2002)
Folge 107: und der Schatz der Mönche (13.01.2003)
Folge 108: Die sieben Tore (07.04.2003)
Folge 109: Gefährliches Quiz (07.04.2003)
Folge 110: Panik im Park (10.06.2003)
Folge 111: Höhle des Grauens (11.08.2003)
Folge 112: Schlucht der Dämonen (13.10.2003)
Folge 113: Auge des Drachen (24.11.2003)
Folge 114: Die Villa der Toten (09.02.2004)
Folge 115: Auf tödlichem Kurs (05.04.2004)
Folge 116: Codename: Cobra (14.06.2004)
Folge 117: Der finstere Rivale (06.09.2004)
Folge 118: Düsteres Vermächtnis (06.09.2004)
Folge 119: Geheime Schlüssel (29.11.2004)
Folge 120: Der schwarze Skorpion (10.01.2005)
Folge 121: Spur ins Nichts (04.04.2008)
Folge 122: und der Geisterzug (04.04.2008)
Folge 123: Fußballfieber (09.05.2008)
Folge 124: Geister-Canyon (11.07.2008)
Folge 125: Feuermond (10.10.2008)
Folge 126: Schrecken aus dem Moor (14.11.2008)
Folge 127: Schwarze Madonna (05.12.2008)
Folge 128: Schatten über Hollywood (06.02.2009)
Folge 129: SMS aus dem Grab (13.03.2009)
Folge 130: Fluch des Drachen (15.05.2009)
Folge 131: Haus des Schreckens (03.07.2009)
Folge 132: Spuk im Netz (21.08.2009)
Folge 133: Fels der Dämonen (02.10.2009)
Folge 134: Der tote Mönch (02.10.2009)
Folge 135: Fluch des Piraten (27.11.2009)
Folge 136: und das versunkene Dorf (05.02.2010)
Folge 137: Pfad der Angst (12.03.2010)
Folge 138: Die Geheime Treppe (21.05.2010)
Folge 139: Das Geheimnis der Diva (09.07.2010)
Folge 140: Stadt der Vampire (20.08.2010)
Folge 141: und die Fußball-Falle (01.10.2010)
Folge 142: Tödliches Eis (03.12.2010)
Folge 143: und die Pokerhölle (03.12.2010)
Folge 144: Zwillinge in der Finsternis (28.01.2011)
Folge 145: und die Rache der Samurai (04.03.2011)
Folge 146: Der Biss der Bestie (06.05.2011)
Folge 147: Grusel auf Campbell Castle (24.06.2011)
Folge 148: und die feurige Flut (19.08.2011)
Folge 149: Der namenlose Gegner (30.09.2011)
Folge 150: Geisterbucht (11.11.2011)
Folge 151: Schwarze Sonne (20.01.2012)
Folge 152: Skateboardfieber (02.03.2012)
Folge 153: und das Fußballphantom (13.04.2012)
Folge 154: Botschaft aus der Unterwelt (18.05.2012)
Folge 155: und der Meister des Todes (13.07.2012)
Folge 156: Im Netz des Drachen (24.08.2012)
Folge 157: Im Zeichen der Schlangen (28.09.2012)
Folge 158: und der Feuergeist (30.11.2012)
Folge 159: Nacht der Tiger (11.01.2013)
Folge 160: Geheiminisvolle Botschaften (01.03.2013)
Folge 161: die blutenden Bilder (10.05.2013)
Folge 162: und der schreiende Nebel (12.07.2013)
Folge 163: und der verschollene Pilot (30.08.2013)
Folge 164: Fußball-Teufel (04.10.2013)
Folge 165: Schatten des Giganten (29.11.2013)
Folge 166: und die brennende Stadt (17.01.2014)
Folge 167: und das blaue Biest (21.02.2014)
Folge 168: GPS-Gangster (02.05.2014)
Folge 169: Die Spur des Spielers (04.07.2014)
Folge 170: Straße des Grauens (29.08.2014)
Folge 171: und das Phantom aus dem Meer (03.10.2014)
Folge 172: und der Eisenmann (28.11.2014)
Folge 173: Dämon der Rache (16.01.2015)
Folge 174: und das Tuch der Toten (06.03.2015)
Folge 175: Schattenwelt (15.05.2015)
Folge 176: und der gestohlene Sieg (10.07.2015)
Folge 177: Der Geist des Goldgräbers (02.10.2015)
Folge 178: Der gefiederte Schrecken (04.12.2015)
Folge 179: Die Rache des Untoten (15.01.2016)
Folge 180: und die flüsternden Puppen (04.03.2016)
Folge 181: Das Kabinett des Zauberers (13.05.2016)
Folge 182: Im Haus des Henkers (22.07.2016)
Folge 183: und der letzte Song (30.09.2016)
Folge 184: und der Hexengarten (02.12.2016)
Folge 185: und der Mann ohne Augen (20.01.2017)
Folge 186: Insel des Vergessens (10.03.2017)
Folge 187: und das silberne Amulett (19.05.2017)
Folge 188: Signale aus dem Jenseits (28.07.2017)
Folge 189: und der unsichtbare Passagier (29.09.2017)
Folge 190: und die Kammer der Rätsel (01.12.2017)
Folge 191: Verbrechen im Nichts (26.01.2018)
Folge 192: Im Bann des Drachen (02.03.2018)
Folge 193: Schrecken aus der Tiefe (11.05.2018)
Folge 194: und die Zeitreisende (20.07.2018)
Folge 195: Im Reich der Ungeheuer (28.09.2018)
Folge 196: Geheimnis des Bauchredners (30.11.2018)
Folge 197: Im Auge des Sturms (18.01.2019)
Folge 198: Die Legende der Gaukler (08.03.2019)
Folge 199: und der grüne Kobold (17.05.2019)
Folge 200: Feuriges Auge (19.07.2019)
Folge 201: Höhenangst (27.09.2019)
Folge 202: Das weiße Grab (29.11.2019)
Folge 203: Tauchgang ins Ungewisse (31.01.2020)
Folge 204: Der dunkle Wächter (13.03.2020)
Folge 205: Das rätselhafte Erbe (15.05.2020)
Folge 206: und der Mottenmann (17.07.2020)
Folge 207: Die falschen Detektive (25.09.2020)
Folge 208: Kelch des Schicksals (15.01.2021)
Folge 209: Kreaturen der Nacht (12.03.2021)
Folge 210: und die schweigende Grotte (11.06.2021)
Folge 211: und der Jadekönig (16.07.2021)
Folge 212: und der weiße Leopard (17.09.2021)
Folge 213: der Fluch der Medusa (26.11.2021)
Folge 214: und der Geisterbunker (04.02.2022)
Folge 215: und die verlorene Zeit (25.03.2022)
Folge 216: Die Schwingen des Unheils (27.05.2022)
Folge 217: und der Kristallschädel (15.07.2022)
Folge 218: Im Netz der Lügen (16.09.2022)
Folge 219: und die Teufelsklippe (18.11.2022)
Folge 220: Im Wald der Gefahren (20.01.2023)
Folge 221: Manuskript des Satans (03.03.2023)
Folge 222: Die Gesetzlosen (12.05.2023)
Folge 223: und der Knochenmann (28.07.2023)
Folge 224: Die Yacht des Verrats (24.11.2023)
Folge 225: Der Puppenmacher (26.01.2024)
Folge 226: Die Spur der Toten (22.03.2024)
Folge 227: Melodie der Rache (10.05.2024)
Folge 228: Der Ruf der Krähen (12.07.2024)
Folge 229: Das Drehbuch der Täuschung (06.09.2024)
Folge 230: Der Tag der Toten (08.11.2024)
Folge 231: Und der Dreiäugige Schakal (17.01.2025)
Folge 232: Die Stadt aus Gold (21.03.2025)
Folge 233: Die Nacht der Gewitter (23.05.2025)
Folge 234: Und der Lebende Tresor (25.07.2025)
Folge 235: Und das Fantasmofon (12.09.2025)
Folge 236: Im Bann des Barrakudas (12.12.2025)
Folge 237: Und der Rote Büffel (20.02.2026`;

function parseYearFromLine(line: string): number {
  const yearMatch = line.match(/(19|20)\d{2}/);
  return yearMatch ? Number(yearMatch[0]) : 0;
}

function buildDefaultRadioplays(): Radioplay[] {
  return EPISODE_SEED
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parsed = line.match(/^Folge\s*(\d+)\s*:?\s*(.+?)(?:\s*\(([^)]*)\)?)?$/i);
      const episodeNumber = parsed?.[1] ?? String(index + 1);
      const episodeName = parsed?.[2]?.trim() ?? line;

      return {
        id: episodeNumber,
        title: 'Die Drei ???',
        episode: `Folge ${episodeNumber}: ${episodeName}`,
        year: parseYearFromLine(line),
        coverImage: undefined,
        wiedergaben: 0,
        lieblingscharakter: '',
        atmosphaere: 0,
        wiederhoerenswert: 0,
        story: 0,
        charakterdynamik: 0,
        fallquality: 0,
        gruselfaktor: 0,
        klassiker: false,
        bobcastGehoert: false,
        beschreibungDerFolge: '',
      };
    });
}

const defaultRadioplays: Radioplay[] = buildDefaultRadioplays();

type RatingCategory = 'atmosphaere' | 'wiederhoerenswert' | 'story' | 'charakterdynamik' | 'fallquality';

const ratingCategories: Array<{ key: RatingCategory; label: string }> = [
  { key: 'atmosphaere', label: 'Atmosphäre' },
  { key: 'wiederhoerenswert', label: 'Wiederhörenswert' },
  { key: 'story', label: 'Story' },
  { key: 'charakterdynamik', label: 'Charakterdynamik' },
  { key: 'fallquality', label: 'Fallquality' },
];

function overallRating(play: Radioplay): number {
  const sum = play.atmosphaere + play.wiederhoerenswert + play.story + play.charakterdynamik + play.fallquality;
  const normalized = sum / 10;
  return Math.max(0, Math.min(5, (normalized + 1) * 2.5));
}

function hasGeneralRating(play: Radioplay): boolean {
  return (
    play.atmosphaere !== 0
    || play.wiederhoerenswert !== 0
    || play.story !== 0
    || play.charakterdynamik !== 0
    || play.fallquality !== 0
  );
}

function normalizeEpisodeLabel(value: string): string {
  return value.replace(/^(Folge\s*\d+)\s*::\s*/i, '$1: ').replace(/\s{2,}/g, ' ').trim();
}

function episodeNameFromLabel(value: string): string {
  const normalized = normalizeEpisodeLabel(value);
  const match = normalized.match(/^Folge\s*\d+\s*:\s*(.+)$/i);
  return match?.[1]?.trim() ?? normalized;
}

function episodeNumberFromLabel(value: string): string {
  const normalized = normalizeEpisodeLabel(value);
  const match = normalized.match(/^Folge\s*(\d+)\s*:/i);
  return match?.[1] ? `Folge ${match[1]}` : '';
}

function hydrateRadioplay(raw: Partial<Radioplay>, fallback: Radioplay): Radioplay {
  return {
    ...fallback,
    ...raw,
    episode: normalizeEpisodeLabel(typeof raw.episode === 'string' ? raw.episode : fallback.episode),
    coverImage: typeof raw.coverImage === 'string' ? raw.coverImage : fallback.coverImage,
    wiedergaben: typeof raw.wiedergaben === 'number' ? raw.wiedergaben : 0,
    lieblingscharakter: typeof raw.lieblingscharakter === 'string' ? raw.lieblingscharakter : '',
    atmosphaere: typeof raw.atmosphaere === 'number' ? raw.atmosphaere : 0,
    wiederhoerenswert: typeof raw.wiederhoerenswert === 'number' ? raw.wiederhoerenswert : 0,
    story: typeof raw.story === 'number' ? raw.story : 0,
    charakterdynamik: typeof raw.charakterdynamik === 'number' ? raw.charakterdynamik : 0,
    fallquality: typeof raw.fallquality === 'number' ? raw.fallquality : 0,
    gruselfaktor: typeof raw.gruselfaktor === 'number' ? raw.gruselfaktor : 0,
    klassiker: typeof raw.klassiker === 'boolean' ? raw.klassiker : false,
    bobcastGehoert: typeof raw.bobcastGehoert === 'boolean' ? raw.bobcastGehoert : false,
    beschreibungDerFolge: typeof raw.beschreibungDerFolge === 'string' ? raw.beschreibungDerFolge : '',
  };
}

function loadRadioplays(): Radioplay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRadioplays;
    const parsed = JSON.parse(raw) as Array<Partial<Radioplay>>;
    if (!Array.isArray(parsed) || !parsed.length) return defaultRadioplays;
    return defaultRadioplays.map((fallback) => {
      const existing = parsed.find((item) => item.id === fallback.id);
      return existing ? hydrateRadioplay(existing, fallback) : fallback;
    });
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

function coverPath(id: string): string {
  return `${BASE_URL}covers/folge-${id.padStart(3, '0')}.png`;
}

function createEmptyAddEpisodeForm(): AddEpisodeForm {
  return {
    folgennummer: '',
    titel: '',
    jahr: '',
    coverImage: '',
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsDataURL(file);
  });
}

function getCoverSource(play: Pick<Radioplay, 'id' | 'coverImage'>): string {
  return play.coverImage || coverPath(play.id);
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
  const [isRankingListOpen, setIsRankingListOpen] = useState(false);
  const [isScaryRankingListOpen, setIsScaryRankingListOpen] = useState(false);
  const [isWiedergabenRankingListOpen, setIsWiedergabenRankingListOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddEpisodeForm>(createEmptyAddEpisodeForm);
  const selected = useMemo(
    () => radioplays.find((play: Radioplay) => play.id === selectedId),
    [radioplays, selectedId],
  );
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
  const topScaryEpisodes = useMemo(
    () => radioplays
      .filter((play) => play.gruselfaktor > 0)
      .map((play) => ({ play, score: play.gruselfaktor }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    [radioplays],
  );
  const scaryRankedEpisodes = useMemo(
    () => radioplays
      .filter((play) => play.gruselfaktor > 0)
      .map((play) => ({ play, score: play.gruselfaktor }))
      .sort((a, b) => b.score - a.score),
    [radioplays],
  );
  const topWiedergabenEpisodes = useMemo(
    () => radioplays
      .filter((play) => play.wiedergaben > 0)
      .map((play) => ({ play, score: play.wiedergaben }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    [radioplays],
  );
  const wiedergabenRankedEpisodes = useMemo(
    () => radioplays
      .filter((play) => play.wiedergaben > 0)
      .map((play) => ({ play, score: play.wiedergaben }))
      .sort((a, b) => b.score - a.score),
    [radioplays],
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(radioplays));
  }, [radioplays]);

  const updateCategory = (id: string, category: RatingCategory, value: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, [category]: value } : play)));
  };

  const updateGruselfaktor = (id: string, gruselfaktor: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, gruselfaktor } : play)));
  };

  const updateToggle = (id: string, field: 'klassiker' | 'bobcastGehoert', checked: boolean) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, [field]: checked } : play)));
  };

  const updateBeschreibung = (id: string, beschreibungDerFolge: string) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, beschreibungDerFolge } : play)));
  };

  const updateWiedergaben = (id: string, wiedergaben: number) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, wiedergaben } : play)));
  };

  const updateLieblingscharakter = (id: string, lieblingscharakter: string) => {
    setRadioplays((current: Radioplay[]) => current.map((play: Radioplay) => (play.id === id ? { ...play, lieblingscharakter } : play)));
  };

  const openAddForm = () => {
    setAddForm(createEmptyAddEpisodeForm());
    setIsAddOpen(true);
  };

  const closeAddForm = () => {
    setIsAddOpen(false);
    setAddForm(createEmptyAddEpisodeForm());
  };

  const handleCoverFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAddForm((current) => ({ ...current, coverImage: '' }));
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setAddForm((current) => ({ ...current, coverImage: dataUrl }));
  };

  const handleAddEpisodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const folgennummer = addForm.folgennummer.trim();
    const titel = addForm.titel.trim();
    const jahr = Number(addForm.jahr);

    if (!folgennummer || !titel || !Number.isFinite(jahr)) {
      return;
    }

    const nextId = String(
      radioplays.reduce((max, play) => {
        const numericId = Number(play.id);
        return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
      }, 0) + 1,
    );

    const newEpisode: Radioplay = {
      id: nextId,
      title: 'Die Drei ???',
      episode: `Folge ${folgennummer}: ${titel} (${jahr})`,
      year: jahr,
      coverImage: addForm.coverImage || undefined,
      wiedergaben: 0,
      lieblingscharakter: '',
      atmosphaere: 0,
      wiederhoerenswert: 0,
      story: 0,
      charakterdynamik: 0,
      fallquality: 0,
      gruselfaktor: 0,
      klassiker: false,
      bobcastGehoert: false,
      beschreibungDerFolge: '',
    };

    setRadioplays((current) => [...current, newEpisode]);
    setSelectedId(nextId);
    setIsStatsOpen(false);
    setIsRankingListOpen(false);
    setIsScaryRankingListOpen(false);
    setIsWiedergabenRankingListOpen(false);
    closeAddForm();
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <img className="hero-image" src={`${BASE_URL}header.jpeg`} alt="Bobs Archiv Das ???-Fallometer" />
      </section>

      <section className={`layout ${selected && !isStatsOpen ? 'with-details' : ''}`}>
        {!selected && !isStatsOpen ? (
          <div className="panel list-panel">
            <div className="panel-header">
              <h2>Archiv</h2>
              <span>{radioplays.length} Einträge</span>
            </div>

            <div className="cards">
              {radioplays.map((play) => (
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
                    loading="lazy"
                    onError={handleCoverError}
                  />
                </button>
              ))}
            </div>
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

              <label className="field">
                <span>Wiedergaben</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={selected.wiedergaben}
                  onChange={(event) => updateWiedergaben(selected.id, Math.max(0, Number(event.target.value) || 0))}
                />
              </label>

              <label className="field">
                <span>Lieblingscharakter</span>
                <input
                  type="text"
                  value={selected.lieblingscharakter}
                  onChange={(event) => updateLieblingscharakter(selected.id, event.target.value)}
                  placeholder="z. B. Peter Shaw"
                />
              </label>

              {ratingCategories.map((category) => (
                <label className="field" key={category.key}>
                  <span>{category.label}: {selected[category.key]}</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={selected[category.key]}
                    onChange={(event) => updateCategory(selected.id, category.key, Number(event.target.value))}
                  />
                </label>
              ))}

              <label className="field">
                <span>Gruselfaktor: {selected.gruselfaktor}/5</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={selected.gruselfaktor}
                  onChange={(event) => updateGruselfaktor(selected.id, Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>
                  <input
                    type="checkbox"
                    checked={selected.klassiker}
                    onChange={(event) => updateToggle(selected.id, 'klassiker', event.target.checked)}
                  />{' '}
                  Klassiker
                </span>
              </label>

              <label className="field">
                <span>
                  <input
                    type="checkbox"
                    checked={selected.bobcastGehoert}
                    onChange={(event) => updateToggle(selected.id, 'bobcastGehoert', event.target.checked)}
                  />{' '}
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
                    <p className="top-flop-title">{rankedEpisodes[0].play.episode}</p>
                    <p className="top-flop-score">{rankedEpisodes[0].rating.toFixed(1)}/5</p>
                  </>
                ) : (
                  <p className="top-flop-title">Noch keine Bewertung</p>
                )}
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
                    <p className="top-flop-title">{rankedEpisodes[rankedEpisodes.length - 1].play.episode}</p>
                    <p className="top-flop-score">{rankedEpisodes[rankedEpisodes.length - 1].rating.toFixed(1)}/5</p>
                  </>
                ) : (
                  <p className="top-flop-title">Noch keine Bewertung</p>
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
              <h3 className="scary-title">Peter - der Schisser - Shaw Ranking</h3>

              <div
                className="podium podium-clickable"
                role="button"
                tabIndex={0}
                onClick={() => setIsScaryRankingListOpen((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsScaryRankingListOpen((current) => !current);
                  }
                }}
                aria-label="Grusel-Podium öffnen, um alle Grusel-Rankings zu zeigen"
              >
                {[1, 0, 2].map((index) => {
                  const item = topScaryEpisodes[index];
                  const rank = index + 1;
                  const heightClass = rank === 1 ? 'podium-rank-first' : rank === 2 ? 'podium-rank-second' : 'podium-rank-third';

                  return (
                    <div key={`scary-${rank}`} className={`podium-item ${heightClass}`}>
                      {item ? (
                        <>
                          <p className="podium-rating">{item.score}/5</p>
                          <button
                            className="podium-cover-button"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(item.play.id);
                              setIsStatsOpen(false);
                              setIsRankingListOpen(false);
                              setIsScaryRankingListOpen(false);
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

              {isScaryRankingListOpen ? (
                <div className="ranking-list">
                  {scaryRankedEpisodes.map((item, index) => (
                    <button
                      key={`scary-list-${item.play.id}`}
                      type="button"
                      className="ranking-item"
                      onClick={() => {
                        setSelectedId(item.play.id);
                        setIsStatsOpen(false);
                        setIsRankingListOpen(false);
                        setIsScaryRankingListOpen(false);
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
              ) : null}
            </div>

            <div className="scary-section">
              <h3 className="scary-title">Wiedergaben Ranking</h3>

              <div
                className="podium podium-clickable"
                role="button"
                tabIndex={0}
                onClick={() => setIsWiedergabenRankingListOpen((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsWiedergabenRankingListOpen((current) => !current);
                  }
                }}
                aria-label="Wiedergaben-Podium öffnen, um alle Wiedergaben-Rankings zu zeigen"
              >
                {[1, 0, 2].map((index) => {
                  const item = topWiedergabenEpisodes[index];
                  const rank = index + 1;
                  const heightClass = rank === 1 ? 'podium-rank-first' : rank === 2 ? 'podium-rank-second' : 'podium-rank-third';

                  return (
                    <div key={`wied-${rank}`} className={`podium-item ${heightClass}`}>
                      {item ? (
                        <>
                          <p className="podium-rating">{item.score}</p>
                          <button
                            className="podium-cover-button"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(item.play.id);
                              setIsStatsOpen(false);
                              setIsRankingListOpen(false);
                              setIsScaryRankingListOpen(false);
                              setIsWiedergabenRankingListOpen(false);
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

              {isWiedergabenRankingListOpen ? (
                <div className="ranking-list">
                  {wiedergabenRankedEpisodes.map((item, index) => (
                    <button
                      key={`wied-list-${item.play.id}`}
                      type="button"
                      className="ranking-item"
                      onClick={() => {
                        setSelectedId(item.play.id);
                        setIsStatsOpen(false);
                        setIsRankingListOpen(false);
                        setIsScaryRankingListOpen(false);
                        setIsWiedergabenRankingListOpen(false);
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
              ) : null}
            </div>

          </div>
        ) : null}
      </section>

      {!selected && !isStatsOpen ? (
        <button className="floating-add-button" type="button" onClick={openAddForm} aria-label="Neue Episode hinzufügen">
        <svg className="floating-add-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
        </button>
      ) : null}

      {isAddOpen ? (
        <div className="add-overlay" role="presentation" onClick={closeAddForm}>
          <div className="add-modal" role="dialog" aria-modal="true" aria-labelledby="add-episode-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h2 id="add-episode-title">Neue Episode</h2>
              <button className="back-button" type="button" onClick={closeAddForm}>
                Schließen
              </button>
            </div>

            <form className="add-form" onSubmit={handleAddEpisodeSubmit}>
              <label className="field">
                <span>Folgennummer</span>
                <input
                  type="text"
                  value={addForm.folgennummer}
                  onChange={(event) => setAddForm((current) => ({ ...current, folgennummer: event.target.value }))}
                  placeholder="z. B. 238"
                  required
                />
              </label>

              <label className="field">
                <span>Titel</span>
                <input
                  type="text"
                  value={addForm.titel}
                  onChange={(event) => setAddForm((current) => ({ ...current, titel: event.target.value }))}
                  placeholder="z. B. Der neue Fall"
                  required
                />
              </label>

              <label className="field">
                <span>Jahr</span>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={addForm.jahr}
                  onChange={(event) => setAddForm((current) => ({ ...current, jahr: event.target.value }))}
                  placeholder="2026"
                  required
                />
              </label>

              <label className="field">
                <span>Coverbild</span>
                <input type="file" accept="image/*" onChange={handleCoverFileChange} />
              </label>

              {addForm.coverImage ? <img className="add-cover-preview" src={addForm.coverImage} alt="Cover Vorschau" /> : null}

              <button className="submit-button" type="submit">Episode hinzufügen</button>
            </form>
          </div>
        </div>
      ) : null}

      <footer className="app-beam" aria-label="Navigation">
        <button className="beam-button beam-button-left" type="button" onClick={() => {
          setSelectedId('');
          setIsStatsOpen(false);
          setIsRankingListOpen(false);
          setIsScaryRankingListOpen(false);
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
          setIsScaryRankingListOpen(false);
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
