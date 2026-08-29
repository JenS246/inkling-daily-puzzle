export const PALETTES = {
  bottle: ['#214f3b', '#9c3327', '#a27616', '#213f62', '#272824'],
  orchard: ['#31533d', '#6a304d', '#3f4542', '#42617a', '#9a5d2d'],
  press: ['#8d392d', '#252723', '#9a741b', '#334b66', '#48604b'],
  harbor: ['#1f5356', '#8d4032', '#263b56', '#645046', '#252723'],
  plum: ['#5b304f', '#2e563e', '#324d68', '#8b522c', '#292a27']
};

const LEGACY_PUZZLES = [
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
  }
];

const DAILY_START = '2026-08-28';
const DAILY_START_ID = 185;
const DAY_MS = 86_400_000;
const PHRASE_COMBINATIONS = [
  [0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 2, 5], [0, 1, 3, 4], [0, 1, 3, 5],
  [0, 1, 4, 5], [0, 2, 3, 4], [0, 2, 3, 5], [0, 2, 4, 5], [0, 3, 4, 5],
  [1, 2, 3, 4], [1, 2, 3, 5], [1, 2, 4, 5], [1, 3, 4, 5], [2, 3, 4, 5]
];

const DAILY_RECIPES = [
  {
    phrases: [
      ['first impression', 'judgment'],
      ['first class', 'travel'],
      ['first aid', 'safety'],
      ['love at first sight', 'romance'],
      ['first and foremost', 'expression'],
      ['ladies first', 'courtesy']
    ],
    connection: 'Four kinds of first',
    connectionNote: 'An opinion, a ticket, emergency help, and sudden romance all begin the same way.',
    palette: 'press'
  },
  {
    phrases: [
      ['change of heart', 'idiom'],
      ['heart of gold', 'idiom'],
      ['heart on your sleeve', 'idiom'],
      ['take heart', 'expression'],
      ['young at heart', 'expression'],
      ['bottom of my heart', 'expression']
    ],
    connection: 'The heart as character',
    connectionNote: 'It can change, shine, show itself, or find courage.',
    palette: 'plum'
  },
  {
    phrases: [
      ['green with envy', 'idiom'],
      ['green light', 'signal'],
      ['green thumb', 'gardening'],
      ['green around the gills', 'idiom'],
      ['green as grass', 'simile'],
      ['green belt', 'planning']
    ],
    connection: 'Shades of green',
    connectionNote: 'Jealousy, permission, gardening skill, and nausea share one color.',
    palette: 'orchard'
  },
  {
    phrases: [
      ['silver lining', 'idiom'],
      ['silver screen', 'cinema'],
      ['born with a silver spoon', 'idiom'],
      ['silver bullet', 'metaphor'],
      ['silver anniversary', 'tradition'],
      ['silver fox', 'description']
    ],
    connection: 'Silver beyond the metal',
    connectionNote: 'Optimism, movies, privilege, and a perfect solution all borrow the same shine.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['home stretch', 'sports idiom'],
      ['hit home', 'idiom'],
      ['close to home', 'expression'],
      ['bring home the bacon', 'idiom'],
      ['home field advantage', 'sports'],
      ['home truth', 'expression']
    ],
    connection: 'Ways of coming home',
    connectionNote: 'A finish, an emotional truth, personal relevance, and earning a living all lead home.',
    palette: 'bottle'
  },
  {
    phrases: [
      ['open book', 'idiom'],
      ['book of life', 'metaphor'],
      ['throw the book at someone', 'idiom'],
      ['one for the books', 'expression'],
      ['book smart', 'description'],
      ['by the book', 'idiom']
    ],
    connection: 'Books without reading',
    connectionNote: 'Character, destiny, punishment, and a memorable event are written into these phrases.',
    palette: 'press'
  },
  {
    phrases: [
      ['upper hand', 'idiom'],
      ['second hand', 'timekeeping'],
      ['hand in glove', 'idiom'],
      ['lend a hand', 'expression'],
      ['hand over fist', 'idiom'],
      ['hand on heart', 'expression']
    ],
    connection: 'What a hand can mean',
    connectionNote: 'Advantage, time, close cooperation, and help are all close at hand.',
    palette: 'orchard'
  },
  {
    phrases: [
      ['see the light', 'idiom'],
      ['light as a feather', 'simile'],
      ['in a different light', 'expression'],
      ['light bulb moment', 'idiom'],
      ['light of day', 'expression'],
      ['guiding light', 'metaphor']
    ],
    connection: 'Light as understanding',
    connectionNote: 'Realization, weight, perspective, and inspiration all brighten the language.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['face value', 'idiom'],
      ['poker face', 'expression'],
      ['face the music', 'idiom'],
      ['put on a brave face', 'idiom'],
      ['face the facts', 'expression'],
      ['straight face', 'expression']
    ],
    connection: 'The face we show',
    connectionNote: 'Surface meaning, hidden emotion, consequences, and courage all meet face-to-face.',
    palette: 'plum'
  },
  {
    phrases: [
      ['common ground', 'expression'],
      ['stand your ground', 'idiom'],
      ['ground rules', 'expression'],
      ['hit the ground running', 'idiom'],
      ['break new ground', 'idiom'],
      ['from the ground up', 'expression']
    ],
    connection: 'Where we stand',
    connectionNote: 'Agreement, resolve, expectations, and a fast start all begin on the ground.',
    palette: 'bottle'
  },
  {
    phrases: [
      ['word of mouth', 'expression'],
      ['have a word', 'expression'],
      ['last word', 'idiom'],
      ['spread the word', 'expression'],
      ['a word to the wise', 'proverb'],
      ['give your word', 'expression']
    ],
    connection: 'Words in circulation',
    connectionNote: 'A recommendation, a conversation, final authority, and news all travel by word.',
    palette: 'press'
  },
  {
    phrases: [
      ['eye of the storm', 'idiom'],
      ['apple of my eye', 'idiom'],
      ['keep an eye on', 'expression'],
      ['in the public eye', 'expression'],
      ['evil eye', 'folklore'],
      ['catch your eye', 'expression']
    ],
    connection: 'Four ways of seeing',
    connectionNote: 'Calm, affection, attention, and fame all sit in the eye.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['long story short', 'expression'],
      ['long time no see', 'greeting'],
      ['before long', 'expression'],
      ['long shot', 'idiom'],
      ['long in the tooth', 'idiom'],
      ['long haul', 'expression']
    ],
    connection: 'Long and short of it',
    connectionNote: 'A summary, a reunion, a wait, and unlikely odds all stretch the same word.',
    palette: 'orchard'
  },
  {
    phrases: [
      ['mind over matter', 'saying'],
      ['peace of mind', 'expression'],
      ['change your mind', 'expression'],
      ['never mind', 'expression'],
      ['bear in mind', 'expression'],
      ['open mind', 'expression']
    ],
    connection: 'States of mind',
    connectionNote: 'Resolve, reassurance, reconsideration, and dismissal are all mental turns.',
    palette: 'plum'
  },
  {
    phrases: [
      ['run for cover', 'expression'],
      ['run of the mill', 'idiom'],
      ['run out of steam', 'idiom'],
      ['home run', 'baseball'],
      ['run its course', 'expression'],
      ['dry run', 'expression']
    ],
    connection: 'Runs in every direction',
    connectionNote: 'Escape, ordinariness, exhaustion, and baseball all use the same stride.',
    palette: 'bottle'
  },
  {
    phrases: [
      ['call it a day', 'idiom'],
      ['save the day', 'expression'],
      ['red-letter day', 'expression'],
      ['day after tomorrow', 'time'],
      ['day in court', 'expression'],
      ['make my day', 'movie quotation']
    ],
    connection: 'A day worth naming',
    connectionNote: 'Stopping, rescuing, celebrating, and looking ahead each make a different day.',
    palette: 'press'
  },
  {
    phrases: [
      ['water under the bridge', 'idiom'],
      ['test the waters', 'idiom'],
      ['fish out of water', 'idiom'],
      ["like water off a duck's back", 'simile'],
      ['water down', 'expression'],
      ['keep your head above water', 'idiom']
    ],
    connection: 'Water as experience',
    connectionNote: 'The past, caution, discomfort, and resilience all flow through these phrases.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['fire away', 'expression'],
      ['trial by fire', 'idiom'],
      ['play with fire', 'idiom'],
      ['set the world on fire', 'idiom'],
      ['under fire', 'expression'],
      ['ring of fire', 'music']
    ],
    connection: 'What fire tests',
    connectionNote: 'Speaking freely, ordeal, danger, and ambition all burn with the same word.',
    palette: 'plum'
  },
  {
    phrases: [
      ['hit the road', 'expression'],
      ['middle of the road', 'idiom'],
      ['end of the road', 'expression'],
      ['road less traveled', 'allusion'],
      ['rocky road', 'food'],
      ['road to nowhere', 'expression']
    ],
    connection: 'Four points on the road',
    connectionNote: 'Departure, moderation, finality, and an uncommon choice all share the route.',
    palette: 'orchard'
  },
  {
    phrases: [
      ['bright side', 'idiom'],
      ['on the safe side', 'expression'],
      ['flip side', 'expression'],
      ['by your side', 'expression'],
      ['wrong side of bed', 'idiom'],
      ['side effect', 'medicine']
    ],
    connection: 'Choosing a side',
    connectionNote: 'Optimism, caution, contrast, and loyalty each take a position.',
    palette: 'bottle'
  },
  {
    phrases: [
      ['out of this world', 'idiom'],
      ['world of difference', 'idiom'],
      ['small world', 'expression'],
      ['world class', 'description'],
      ['world wide web', 'technology'],
      ['world peace', 'aspiration']
    ],
    connection: 'The world in scale',
    connectionNote: 'Astonishment, contrast, coincidence, and excellence stretch one enormous word.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['moment of truth', 'idiom'],
      ['never a dull moment', 'expression'],
      ['in a moment', 'expression'],
      ['spur of the moment', 'idiom'],
      ['at the moment', 'expression'],
      ['magic moment', 'expression']
    ],
    connection: 'Moments that change pace',
    connectionNote: 'Decision, excitement, immediacy, and impulse each occupy a moment.',
    palette: 'press'
  },
  {
    phrases: [
      ['under the table', 'idiom'],
      ['bring to the table', 'idiom'],
      ['table manners', 'etiquette'],
      ['coffee table', 'furniture'],
      ['table of contents', 'publishing'],
      ['round table', 'discussion']
    ],
    connection: 'Around the table',
    connectionNote: 'Secrecy, contribution, etiquette, and furniture all gather in one place.',
    palette: 'orchard'
  },
  {
    phrases: [
      ['cold feet', 'idiom'],
      ['cold shoulder', 'idiom'],
      ['stone cold', 'expression'],
      ['out in the cold', 'idiom'],
      ['cold snap', 'weather'],
      ['cold turkey', 'idiom']
    ],
    connection: 'Four kinds of cold',
    connectionNote: 'Nerves, rejection, intensity, and exclusion all lower the temperature.',
    palette: 'plum'
  },
  {
    phrases: [
      ['beat the clock', 'idiom'],
      ['skip a beat', 'expression'],
      ['beat around the bush', 'idiom'],
      ['beat the odds', 'idiom'],
      ['beat a dead horse', 'idiom'],
      ['beat generation', 'culture']
    ],
    connection: 'Beating more than rhythm',
    connectionNote: 'Time, surprise, avoidance, and unlikely success all move to a beat.',
    palette: 'bottle'
  },
  {
    phrases: [
      ['high and dry', 'idiom'],
      ['high hopes', 'expression'],
      ['high time', 'idiom'],
      ['aim high', 'expression'],
      ['high five', 'gesture'],
      ['high society', 'description']
    ],
    connection: 'Different kinds of high',
    connectionNote: 'Abandonment, optimism, urgency, and ambition all point upward.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['fine line', 'idiom'],
      ['line of fire', 'expression'],
      ['end of the line', 'expression'],
      ['draw the line', 'idiom'],
      ['line in the sand', 'idiom'],
      ['party line', 'politics']
    ],
    connection: 'Where lines lead',
    connectionNote: 'Distinction, danger, finality, and a boundary are all drawn with one word.',
    palette: 'press'
  },
  {
    phrases: [
      ['soft spot', 'idiom'],
      ['sweet spot', 'idiom'],
      ['spot on', 'expression'],
      ['hit the spot', 'idiom'],
      ['blind spot', 'expression'],
      ['spot check', 'inspection']
    ],
    connection: 'Finding the spot',
    connectionNote: 'Affection, optimal position, accuracy, and satisfaction all land there.',
    palette: 'plum'
  },
  {
    phrases: [
      ['stepping stone', 'metaphor'],
      ['set in stone', 'idiom'],
      ['heart of stone', 'idiom'],
      ['leave no stone unturned', 'idiom'],
      ['stone age', 'history'],
      ['stone wall', 'description']
    ],
    connection: 'What stone can stand for',
    connectionNote: 'Progress, permanence, hardness, and persistence share the same material.',
    palette: 'orchard'
  },
  {
    phrases: [
      ['head over heels', 'idiom'],
      ['head start', 'expression'],
      ['keep your head', 'idiom'],
      ['head in the clouds', 'idiom'],
      ['head honcho', 'slang'],
      ['head for the hills', 'expression']
    ],
    connection: 'Where the head goes',
    connectionNote: 'Love, advantage, composure, and daydreaming all move the head.',
    palette: 'harbor'
  },
  {
    phrases: [
      ['hit the mark', 'idiom'],
      ['make your mark', 'idiom'],
      ['mark my words', 'expression'],
      ['off the mark', 'idiom'],
      ['question mark', 'punctuation'],
      ['mark of distinction', 'expression']
    ],
    connection: 'Marks of accuracy',
    connectionNote: 'Success, influence, certainty, and error are measured against the same mark.',
    palette: 'bottle'
  },
  {
    phrases: [
      ['close call', 'idiom'],
      ['wake-up call', 'expression'],
      ['call of duty', 'expression'],
      ['call the shots', 'idiom'],
      ['last call', 'expression'],
      ['judgment call', 'expression']
    ],
    connection: 'Calls that demand action',
    connectionNote: 'A narrow escape, warning, obligation, and authority all arrive as a call.',
    palette: 'press'
  }
];

function dateOffset(dateKey) {
  const value = Date.parse(`${dateKey}T00:00:00Z`);
  const start = Date.parse(`${DAILY_START}T00:00:00Z`);
  if (!Number.isFinite(value)) return -1;
  return Math.floor((value - start) / DAY_MS);
}

function dateAtOffset(offset) {
  return new Date(Date.parse(`${DAILY_START}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

function scheduledPuzzle(recipe, date, id, cycle = 0) {
  const selection = PHRASE_COMBINATIONS[cycle % PHRASE_COMBINATIONS.length];
  return {
    id,
    date,
    phrases: selection.map((index) => {
      const [answer, type, note = ''] = recipe.phrases[index];
      return { answer, type, note };
    }),
    connection: recipe.connection,
    connectionNote: recipe.connectionNote,
    palette: recipe.palette
  };
}

const FIRST_CYCLE = DAILY_RECIPES.map((recipe, index) => scheduledPuzzle(
  recipe,
  dateAtOffset(index),
  DAILY_START_ID + index
));

export const puzzles = [...FIRST_CYCLE].reverse().concat(LEGACY_PUZZLES);

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
  return scheduledPuzzle(
    DAILY_RECIPES[offset % DAILY_RECIPES.length],
    dateKey,
    DAILY_START_ID + offset,
    Math.floor(offset / DAILY_RECIPES.length)
  );
}
