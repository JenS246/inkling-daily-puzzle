import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(root, 'data', 'raw');
const outDir = path.join(root, 'data', 'generated');
const gameCount = 365;
const startDate = Date.parse('2026-08-30T00:00:00Z');
const startId = 187;
const dayMs = 86_400_000;

const stopHubs = new Set(`a about after all an and are as at back be been being before but by can cannot come comes could did do does down each every few for from get gets got had has have he her hers him his how i if in into is it its know knows last little make makes many may me might more most much must my never no nor not of off old on once one only or other our ours out over own put same she should so some such take takes than that the their theirs them then there these they this those through to too under up us very was way we were what when where which while who why will with would you your yours`.split(' '));
const placeholders = new Set('someone somebody something oneself ones xyz abc'.split(' '));
const blocklist = new Set(fs.readFileSync(path.join(root, 'data', 'blocklist.txt'), 'utf8')
  .split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')));
const blockedStems = ['bastard', 'bitch', 'cunt', 'fagg', 'fuck', 'kill', 'nigger', 'penis', 'porn', 'prostitut', 'shit', 'suicid', 'whore'];
const wordIsBlocked = (word) => blocklist.has(word) || blockedStems.some((stem) => word.startsWith(stem));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function clean(value) {
  let answer = String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[‐‑‒–—−-]/g, ' ')
    .trim().replace(/[.!?]+$/g, '').trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US');
  if (!/^[a-z ]+$/.test(answer)) return null;
  const words = answer.split(' ');
  if (words.length < 3 || words.length > 7) return null;
  if (words.some((word) => wordIsBlocked(word) || placeholders.has(word))) return null;
  if (new Set(words).size !== words.length) return null;
  return answer;
}

const candidates = [];
function add(value, type, source, rank, note = '') {
  const answer = clean(value);
  const noteWords = String(note).toLocaleLowerCase('en-US').match(/[a-z]+/g) || [];
  if (answer && !noteWords.some(wordIsBlocked)) candidates.push({ answer, type, source, rank, note });
}

for (const [file, type, source] of [
  ['idiomash.txt', 'idiom', 'idiomash'],
  ['cstafie-idioms.txt', 'idiom', 'cstafie idioms'],
  ['proverbs.txt', 'proverb', 'proverbs gist']
]) {
  fs.readFileSync(path.join(rawDir, file), 'utf8').split(/\r?\n/)
    .forEach((line, rank) => add(line, type, source, rank));
}

fs.readFileSync(path.join(rawDir, 'rolling-stone-songs.txt'), 'utf8').split(/\r?\n/)
  .forEach((line, rank) => {
    if (line.startsWith('#') || !line.includes(' - ')) return;
    const splitAt = line.lastIndexOf(' - ');
    add(line.slice(0, splitAt), 'song title', 'Rolling Stone songs', rank, `Recorded by ${line.slice(splitAt + 3)}.`);
  });

parseCsv(fs.readFileSync(path.join(rawDir, 'goodbooks.csv'), 'utf8')).forEach((row, rank) => {
  if (rank >= 2500) return;
  const title = row.original_title || row.title;
  const year = row.original_publication_year ? ` (${Math.trunc(Number(row.original_publication_year))})` : '';
  const authors = row.authors.split(',').map((author) => author.trim())
    .filter((author) => /^[\x20-\x7E]+$/.test(author)).slice(0, 2).join(' and ');
  add(title, 'book title', 'Goodbooks 10k', rank, `${authors}${year}.`);
});

parseCsv(fs.readFileSync(path.join(rawDir, 'movies.csv'), 'utf8')).forEach((row, rank) => {
  if (rank >= 2500) return;
  if (Number(String(row.Votes).replaceAll(',', '')) < 25_000) return;
  add(row['Movie Name'], 'movie title', 'IMDb ranked movies', rank);
});

const sourceBase = {
  idiomash: 850,
  'cstafie idioms': 520,
  'proverbs gist': 610,
  'Rolling Stone songs': 950,
  'Goodbooks 10k': 1000,
  'IMDb ranked movies': 1000
};

const merged = new Map();
for (const item of candidates) {
  const existing = merged.get(item.answer);
  const score = sourceBase[item.source] - Math.min(item.rank, 3500) / 8;
  if (!existing) merged.set(item.answer, { ...item, sources: [item.source], score });
  else {
    if (!existing.sources.includes(item.source)) existing.sources.push(item.source);
    if (score > existing.score) Object.assign(existing, { type: item.type, source: item.source, rank: item.rank, note: item.note, score });
    existing.score += 180;
  }
}

const master = [...merged.values()].map((item) => ({
  ...item,
  score: Math.round(item.score + (item.answer.split(' ').length <= 5 ? 35 : 0))
})).sort((a, b) => b.score - a.score || a.answer.localeCompare(b.answer));

const gameEligible = master.filter((item) =>
  !['cstafie idioms', 'proverbs gist'].includes(item.source) || item.sources.length > 1 ||
  (item.source === 'cstafie idioms' && item.rank < 500)
);
const hubs = new Map();
for (const item of gameEligible) {
  for (const word of new Set(item.answer.split(' '))) {
    if (word.length < 3 || stopHubs.has(word)) continue;
    if (!hubs.has(word)) hubs.set(word, []);
    hubs.get(word).push(item);
  }
}

const typeName = (type) => ({
  'book title': 'book title',
  'movie title': 'movie title',
  'song title': 'song title',
  idiom: 'idiom',
  proverb: 'proverb'
}[type] || type);
const paletteNames = ['bottle', 'orchard', 'press', 'harbor', 'plum'];
const answerUses = new Map();
const usedEditions = new Set();
const games = [];
let pass = 0;

function hubPriority([word, items]) {
  const usable = items.filter((item) => (answerUses.get(item.answer) || 0) < 2);
  const titleMix = new Set(usable.map((item) => item.type)).size;
  return usable.slice(0, 8).reduce((sum, item) => sum + item.score, 0) + titleMix * 120 + Math.min(usable.length, 20) * 20 - word.length;
}

function tooSimilar(candidate, chosen, hub) {
  const words = new Set(candidate.answer.split(' ').filter((word) => word !== hub));
  return chosen.some((item) => {
    const other = new Set(item.answer.split(' ').filter((word) => word !== hub));
    const intersection = [...words].filter((word) => other.has(word)).length;
    const union = new Set([...words, ...other]).size;
    return union > 0 && intersection / union >= 0.75;
  });
}

function sentenceList(values) {
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

for (const maxUses of [1, 2]) {
  pass = 0;
  while (games.length < gameCount && pass < 5) {
    const orderedHubs = [...hubs.entries()].sort((a, b) => hubPriority(b) - hubPriority(a));
    let added = 0;
    for (const [hub, items] of orderedHubs) {
      if (games.length >= gameCount) break;
      const usable = items.filter((item) => (answerUses.get(item.answer) || 0) < maxUses);
      if (usable.length < 4) continue;
      usable.sort((a, b) => b.score - a.score || a.answer.localeCompare(b.answer));
      const chosen = [];
      const seenTypes = new Set();
      for (const item of usable) {
        if (chosen.length >= 4) break;
        if (tooSimilar(item, chosen, hub)) continue;
        if (!seenTypes.has(item.type) || chosen.length >= 2) {
          chosen.push(item);
          seenTypes.add(item.type);
        }
      }
      if (chosen.length < 4) continue;
      const edition = chosen.map((item) => item.answer).sort().join('|');
      if (usedEditions.has(edition)) continue;
      const id = startId + games.length;
      const date = new Date(startDate + games.length * dayMs).toISOString().slice(0, 10);
      const types = [...new Set(chosen.map((item) => typeName(item.type)))];
      games.push({
        id,
        date,
        phrases: chosen.map(({ answer, type, note }) => ({ answer, type, note })),
        connection: `${hub[0].toUpperCase()}${hub.slice(1)} in four phrases`,
        connectionNote: `All four answers — ${sentenceList(types)} — share the word ${hub}.`,
        palette: paletteNames[games.length % paletteNames.length],
        hub
      });
      chosen.forEach((item) => answerUses.set(item.answer, (answerUses.get(item.answer) || 0) + 1));
      usedEditions.add(edition);
      added += 1;
    }
    if (!added) break;
    pass += 1;
  }
}

if (games.length < gameCount) throw new Error(`Only built ${games.length} of ${gameCount} requested games.`);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'master-phrases.json'), `${JSON.stringify(master, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'master-phrases.txt'), `${master.map((item) => item.answer).join('\n')}\n`);

const generatedSource = `// Generated by scripts/build-puzzle-bank.mjs. Do not hand edit.\nexport const GENERATED_PUZZLES = ${JSON.stringify(games.map(({ hub, ...game }) => game), null, 2)};\n`;
fs.writeFileSync(path.join(root, 'src', 'generated-puzzles.js'), generatedSource);

const lengthCounts = Object.fromEntries([3, 4, 5, 6, 7].map((length) => [length, master.filter((item) => item.answer.split(' ').length === length).length]));
const sourceCounts = {};
for (const item of master) for (const source of item.sources) sourceCounts[source] = (sourceCounts[source] || 0) + 1;
const typeCounts = {};
for (const game of games) for (const phrase of game.phrases) typeCounts[phrase.type] = (typeCounts[phrase.type] || 0) + 1;
const report = {
  rawCandidates: candidates.length,
  cleanUniquePhrases: master.length,
  wordsPerPhrase: lengthCounts,
  phrasesBySource: sourceCounts,
  games: games.length,
  phraseSlots: games.length * 4,
  uniquePhrasesUsed: answerUses.size,
  phraseReuseRate: Number((1 - answerUses.size / (games.length * 4)).toFixed(4)),
  maximumPhraseUses: Math.max(...answerUses.values()),
  gamesWithFourWayHub: games.filter((game) => game.phrases.every((phrase) => phrase.answer.split(' ').includes(game.hub))).length,
  phraseTypesUsed: typeCounts,
  firstDate: games[0].date,
  lastDate: games.at(-1).date
};
fs.writeFileSync(path.join(outDir, 'quality-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
