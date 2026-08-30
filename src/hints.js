const HINT_SEQUENCES = [
  ['type', 'first', 'outline'],
  ['last', 'outline', 'type'],
  ['outline', 'first', 'last'],
  ['first', 'type', 'outline'],
  ['type', 'outline', 'last'],
  ['outline', 'last', 'first']
];

export function hintSequenceForPuzzle(puzzleId) {
  const numericId = Number.parseInt(puzzleId, 10);
  const index = Number.isFinite(numericId) ? Math.abs(numericId) % HINT_SEQUENCES.length : 0;
  return [...HINT_SEQUENCES[index]];
}

function clueText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function comparableText(value = '') {
  return clueText(value)
    .toLocaleLowerCase('en-US')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function smartHintForPhrase(phrase = {}) {
  const curated = clueText(phrase.hint);
  if (curated) return curated;

  const note = clueText(phrase.note);
  const answer = comparableText(phrase.answer);
  if (!note || note.length < 10 || note.length > 160) return '';
  if (answer && comparableText(note).includes(answer)) return '';

  const recording = note.match(/^Recorded by (.+)\.$/i);
  if (recording && /song|music/i.test(phrase.type || '')) {
    return `A song recorded by ${recording[1]}.`;
  }

  // Automatically generated book credits can include editors or edition
  // contributors, so they remain generic unless a clue is curated by hand.
  if (/book/i.test(phrase.type || '')) return '';
  return note;
}

export function hintSequenceForPhrase(puzzleId, phrase) {
  const sequence = hintSequenceForPuzzle(puzzleId);
  if (!smartHintForPhrase(phrase)) return sequence;
  const replaceIndex = sequence.includes('type')
    ? sequence.indexOf('type')
    : sequence.findIndex((kind) => kind === 'first' || kind === 'last');
  if (replaceIndex >= 0) sequence[replaceIndex] = 'smart';
  return sequence;
}

export function phraseTypeHint(type = '') {
  if (/expression/i.test(type)) return 'An expression';
  return `Phrase type: ${type}`;
}
