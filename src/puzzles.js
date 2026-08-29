import { GENERATED_PUZZLES } from './generated-puzzles.js';

export const PALETTES = {
  bottle: ['#214f3b', '#9c3327', '#a27616', '#213f62', '#272824'],
  orchard: ['#31533d', '#6a304d', '#3f4542', '#42617a', '#9a5d2d'],
  press: ['#8d392d', '#252723', '#9a741b', '#334b66', '#48604b'],
  harbor: ['#1f5356', '#8d4032', '#263b56', '#645046', '#252723'],
  plum: ['#5b304f', '#2e563e', '#324d68', '#8b522c', '#292a27']
};

const LEGACY_PUZZLES = [
  {
    id: 186,
    date: '2026-08-29',
    phrases: [
      { answer: 'change of heart', type: 'idiom', note: '' },
      { answer: 'heart of gold', type: 'idiom', note: '' },
      { answer: 'heart on your sleeve', type: 'idiom', note: '' },
      { answer: 'take heart', type: 'expression', note: '' }
    ],
    connection: 'The heart as character',
    connectionNote: 'It can change, shine, show itself, or find courage.',
    palette: 'plum'
  },
  {
    id: 185,
    date: '2026-08-28',
    phrases: [
      { answer: 'first impression', type: 'judgment', note: '' },
      { answer: 'first class', type: 'travel', note: '' },
      { answer: 'first aid', type: 'safety', note: '' },
      { answer: 'love at first sight', type: 'romance', note: '' }
    ],
    connection: 'Four kinds of first',
    connectionNote: 'An opinion, a ticket, emergency help, and sudden romance all begin the same way.',
    palette: 'press'
  },
  {
    id: 184,
    date: '2026-08-27',
    phrases: [
      { answer: 'money talks', type: 'common expression', note: 'Influence often speaks more loudly than argument.' },
      { answer: 'time is money', type: 'proverb', note: 'A line associated with Benjamin Franklin and the value of time.' },
      { answer: 'money for nothing', type: 'music', note: 'The title of a 1985 Dire Straits song.' },
      { answer: 'show me the money', type: 'movie quotation', note: 'An emphatic line from the 1996 film Jerry Maguire.' }
    ],
    connection: 'Money in four registers',
    connectionNote: 'A maxim, a proverb, a song title, and a movie quotation all spend the same word.',
    palette: 'bottle'
  },
  {
    id: 183,
    date: '2026-08-26',
    phrases: [
      { answer: 'break the ice', type: 'idiom', note: 'To ease the first awkwardness of a meeting.' },
      { answer: 'ice cream', type: 'food', note: '' },
      { answer: 'cream of the crop', type: 'idiom', note: 'The best of a group.' },
      { answer: 'crop circle', type: 'popular culture', note: '' }
    ],
    connection: 'A word-to-word chain',
    connectionNote: 'The last word of each phrase opens the next one.',
    palette: 'press'
  },
  {
    id: 182,
    date: '2026-08-25',
    phrases: [
      { answer: 'record player', type: 'music', note: '' },
      { answer: 'player of the game', type: 'sports', note: '' },
      { answer: 'game theory', type: 'mathematics', note: '' },
      { answer: 'theory of everything', type: 'physics', note: '' }
    ],
    connection: 'From vinyl to the universe',
    connectionNote: 'Each phrase hands its last word to the next field.',
    palette: 'harbor'
  },
  {
    id: 181,
    date: '2026-08-24',
    phrases: [
      { answer: 'right as rain', type: 'idiom', note: 'In good order or health.' },
      { answer: 'rain check', type: 'expression', note: 'A postponement, originally a ticket issued at rained-out baseball games.' },
      { answer: 'check mate', type: 'wordplay', note: 'A spaced reading that bridges the chain to mate.' },
      { answer: 'mate for life', type: 'natural history', note: '' }
    ],
    connection: 'Passing the word along',
    connectionNote: 'The closing word becomes the opening word, one phrase at a time.',
    palette: 'orchard'
  },
  {
    id: 180,
    date: '2026-08-23',
    phrases: [
      { answer: 'read between the lines', type: 'idiom', note: 'Look for meaning that is implied rather than stated.' },
      { answer: 'lines in the sand', type: 'expression', note: 'Boundaries that should not be crossed.' },
      { answer: 'the sandman', type: 'folklore', note: 'A figure said to bring sleep and dreams.' },
      { answer: 'enter sandman', type: 'music', note: 'A 1991 Metallica song.' }
    ],
    connection: 'What waits between waking and sleep',
    connectionNote: 'Printed lines give way to sand, folklore, and a famous song.',
    palette: 'plum'
  },
  {
    id: 179,
    date: '2026-08-22',
    phrases: [
      { answer: 'out of the blue', type: 'idiom', note: '' },
      { answer: 'once in a blue moon', type: 'idiom', note: '' },
      { answer: 'blue blood', type: 'expression', note: '' },
      { answer: 'blue ribbon', type: 'award', note: '' }
    ],
    connection: 'Blue phrases',
    connectionNote: '',
    palette: 'harbor'
  },
  {
    id: 178,
    date: '2026-08-21',
    phrases: [
      { answer: 'draw the line', type: 'idiom', note: '' },
      { answer: 'walk the line', type: 'expression', note: '' },
      { answer: 'line of duty', type: 'expression', note: '' },
      { answer: 'punch line', type: 'comedy', note: '' }
    ],
    connection: 'Line phrases',
    connectionNote: '',
    palette: 'press'
  },
  {
    id: 177,
    date: '2026-08-20',
    phrases: [
      { answer: 'upper hand', type: 'idiom', note: '' },
      { answer: 'second hand', type: 'timekeeping', note: '' },
      { answer: 'lend a hand', type: 'expression', note: '' },
      { answer: 'hand in glove', type: 'idiom', note: '' }
    ],
    connection: 'Hand phrases',
    connectionNote: '',
    palette: 'orchard'
  },
  {
    id: 176,
    date: '2026-08-19',
    phrases: [
      { answer: 'head over heels', type: 'idiom', note: '' },
      { answer: 'keep your head', type: 'expression', note: '' },
      { answer: 'head in the clouds', type: 'idiom', note: '' },
      { answer: 'off the top of my head', type: 'expression', note: '' }
    ],
    connection: 'Head phrases',
    connectionNote: '',
    palette: 'plum'
  },
  {
    id: 175,
    date: '2026-08-18',
    phrases: [
      { answer: 'cold shoulder', type: 'idiom', note: '' },
      { answer: 'cold feet', type: 'idiom', note: '' },
      { answer: 'cold comfort', type: 'expression', note: '' },
      { answer: 'in cold blood', type: 'idiom', note: '' }
    ],
    connection: 'Cold phrases',
    connectionNote: '',
    palette: 'bottle'
  },
  {
    id: 174,
    date: '2026-08-17',
    phrases: [
      { answer: 'point of view', type: 'expression', note: '' },
      { answer: 'beside the point', type: 'idiom', note: '' },
      { answer: 'point blank', type: 'expression', note: '' },
      { answer: 'breaking point', type: 'idiom', note: '' }
    ],
    connection: 'Point phrases',
    connectionNote: '',
    palette: 'press'
  },
  {
    id: 173,
    date: '2026-08-16',
    phrases: [
      { answer: 'open secret', type: 'expression', note: '' },
      { answer: 'open mind', type: 'expression', note: '' },
      { answer: 'open book', type: 'idiom', note: '' },
      { answer: 'open season', type: 'expression', note: '' }
    ],
    connection: 'Open phrases',
    connectionNote: '',
    palette: 'orchard'
  }
];

const DAILY_START = '2026-08-30';
const DAILY_START_ID = 187;
const DAY_MS = 86_400_000;
function dateOffset(dateKey) {
  const value = Date.parse(`${dateKey}T00:00:00Z`);
  const start = Date.parse(`${DAILY_START}T00:00:00Z`);
  if (!Number.isFinite(value)) return -1;
  return Math.floor((value - start) / DAY_MS);
}


export const puzzles = [...GENERATED_PUZZLES].reverse().concat(LEGACY_PUZZLES);

export function normalizeAnswer(value) {
  return value
    .toLocaleLowerCase('en-US')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function phraseWords(answer) {
  return normalizeAnswer(answer).split(' ').filter(Boolean);
}

export function derivePuzzle(puzzle) {
  const frequencies = new Map();
  const phraseWordSets = puzzle.phrases.map(({ answer }) => new Set(phraseWords(answer)));
  phraseWordSets.forEach((words) => words.forEach((word) => frequencies.set(word, (frequencies.get(word) || 0) + 1)));

  return {
    ...puzzle,
    phrases: puzzle.phrases.map((phrase) => ({ ...phrase, words: phraseWords(phrase.answer) })),
    words: [...frequencies.entries()].map(([word, frequency]) => ({ word, frequency })),
    frequencies
  };
}

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyPuzzle(dateKey = utcDateKey()) {
  return puzzleByDate(dateKey) || puzzles[0];
}

export function puzzleByDate(dateKey) {
  const exact = puzzles.find((puzzle) => puzzle.date === dateKey);
  if (exact) return exact;
  const offset = dateOffset(dateKey);
  if (offset < 0) return undefined;
  const base = GENERATED_PUZZLES[offset % GENERATED_PUZZLES.length];
  return { ...base, date: dateKey, id: DAILY_START_ID + offset };
}
