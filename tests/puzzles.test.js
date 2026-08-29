import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTES, derivePuzzle, getDailyPuzzle, normalizeAnswer, puzzleByDate, puzzles } from '../src/puzzles.js';
import { MAX_GUESSES, MAX_HINTS, completeDailyStats, emptyState, getPuzzleProgress, loadState, puzzleSignature, remainingHints } from '../src/storage.js';
import { hintSequenceForPuzzle, phraseTypeHint } from '../src/hints.js';

test('every cloud word is derived from at least one phrase', () => {
  for (const puzzle of puzzles) {
    const derived = derivePuzzle(puzzle);
    assert.ok(derived.words.length > 0);
    for (const entry of derived.words) assert.ok(entry.frequency >= 1 && entry.frequency <= puzzle.phrases.length);
    for (const phrase of derived.phrases) assert.equal(new Set(phrase.words).size, phrase.words.length, `${puzzle.date}: phrases cannot repeat a cloud word`);
  }
});

test('the curated daily bank has four distinct phrases and a strong repeated word', () => {
  const dates = new Set();
  const ids = new Set();
  for (const puzzle of puzzles) {
    assert.equal(puzzle.phrases.length, 4, `${puzzle.date}: expected four phrases`);
    assert.equal(new Set(puzzle.phrases.map(({ answer }) => normalizeAnswer(answer))).size, 4, `${puzzle.date}: answers must be distinct`);
    if (puzzle.date >= '2026-08-30') {
      assert.ok(Math.max(...derivePuzzle(puzzle).words.map(({ frequency }) => frequency)) >= 3, `${puzzle.date}: cloud needs a strong repeated word`);
    }
    assert.equal(dates.has(puzzle.date), false, `${puzzle.date}: duplicate date`);
    assert.equal(ids.has(puzzle.id), false, `${puzzle.id}: duplicate id`);
    dates.add(puzzle.date);
    ids.add(puzzle.id);
  }
});

test('every puzzle has enough words for a complete themed color set', () => {
  for (const puzzle of puzzles) {
    const palette = PALETTES[puzzle.palette];
    assert.ok(palette, `${puzzle.date}: unknown palette`);
    assert.equal(new Set(palette).size, palette.length, `${puzzle.date}: palette colors must be distinct`);
    assert.ok(derivePuzzle(puzzle).words.length >= palette.length, `${puzzle.date}: not enough words to show the full palette`);
  }
});

test('the daily schedule advances its date and continues beyond the first bank cycle', () => {
  assert.equal(getDailyPuzzle('2026-08-30').date, '2026-08-30');
  assert.equal(getDailyPuzzle('2026-08-30').id, 187);
  assert.equal(getDailyPuzzle('2026-10-15').date, '2026-10-15');
  assert.notEqual(getDailyPuzzle('2026-10-15').id, getDailyPuzzle('2026-08-29').id);
  assert.notDeepEqual(
    getDailyPuzzle('2026-08-30').phrases.map(({ answer }) => answer),
    getDailyPuzzle('2026-09-30').phrases.map(({ answer }) => answer)
  );
  assert.equal(puzzleByDate('2026-08-16')?.id, 173);
  assert.equal(puzzleByDate('2026-08-15'), undefined);
});

test('the 365-edition annual bank stays unique and puzzle-safe', () => {
  const editions = new Set();
  const phraseUses = new Map();
  const start = Date.parse('2026-08-30T00:00:00Z');
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
    const puzzle = puzzleByDate(date);
    const derived = derivePuzzle(puzzle);
    const edition = puzzle.phrases.map(({ answer }) => normalizeAnswer(answer)).sort().join('|');
    assert.equal(puzzle.phrases.length, 4, `${date}: expected four phrases`);
    assert.equal(new Set(puzzle.phrases.map(({ answer }) => normalizeAnswer(answer))).size, 4, `${date}: answers must be distinct`);
    assert.equal(Math.max(...derived.words.map(({ frequency }) => frequency)), 4, `${date}: cloud needs a four-way hub word`);
    for (const phrase of derived.phrases) assert.equal(new Set(phrase.words).size, phrase.words.length, `${date}: phrase repeats a cloud word`);
    for (const phrase of puzzle.phrases) {
      assert.match(phrase.answer, /^[a-z ]+$/, `${date}: answer must contain letters and spaces only`);
      assert.ok(phrase.answer.split(' ').length >= 3 && phrase.answer.split(' ').length <= 7, `${date}: answer must contain 3–7 words`);
      phraseUses.set(phrase.answer, (phraseUses.get(phrase.answer) || 0) + 1);
    }
    assert.equal(editions.has(edition), false, `${date}: repeated edition`);
    editions.add(edition);
  }
  assert.ok(phraseUses.size >= 1000, 'bank should use the source material efficiently');
  assert.ok(Math.max(...phraseUses.values()) <= 2, 'no answer should appear more than twice');
});

test('frequency counts phrase membership rather than repeated spelling', () => {
  const derived = derivePuzzle({
    id: 1,
    date: '2026-01-01',
    phrases: [{ answer: 'very very good' }, { answer: 'good day' }],
    connection: '',
    palette: 'bottle'
  });
  assert.equal(derived.frequencies.get('very'), 1);
  assert.equal(derived.frequencies.get('good'), 2);
});

test('answers normalize punctuation and spacing', () => {
  assert.equal(normalizeAnswer("  Money’s   worth! "), 'moneys worth');
});

test('daily completion increments once and respects consecutive UTC dates', () => {
  const base = emptyState().stats;
  const first = completeDailyStats(base, '2026-08-26');
  const duplicate = completeDailyStats(first, '2026-08-26');
  const second = completeDailyStats(duplicate, '2026-08-27');
  assert.equal(first.currentStreak, 1);
  assert.deepEqual(duplicate, first);
  assert.equal(second.currentStreak, 2);
  assert.equal(second.dailyPuzzlesSolved, 2);
});

test('invalid local data falls back safely', () => {
  const storage = { getItem: () => '{broken' };
  assert.deepEqual(loadState(storage), emptyState());
  assert.equal(getPuzzleProgress(emptyState(), puzzles[0]).complete, false);
});

test('hint availability counts down clearly and never exceeds three hints', () => {
  assert.equal(MAX_HINTS, 3);
  assert.deepEqual([0, 1, 2, 3].map(remainingHints), [3, 2, 1, 0]);
  assert.equal(remainingHints(4), 0);

  const state = emptyState();
  state.puzzles[puzzles[0].date] = { signature: puzzleSignature(puzzles[0]), hints: 9 };
  assert.equal(getPuzzleProgress(state, puzzles[0]).hints, MAX_HINTS);
});

test('hint types vary by puzzle while every puzzle keeps three distinct hints', () => {
  const sequences = Array.from({ length: 12 }, (_, index) => hintSequenceForPuzzle(180 + index));
  for (const sequence of sequences) {
    assert.equal(sequence.length, MAX_HINTS);
    assert.equal(new Set(sequence).size, MAX_HINTS);
    assert.ok(sequence.includes('outline'));
  }
  assert.ok(new Set(sequences.map((sequence) => sequence.join('|'))).size > 1);
});

test('expression hints read naturally without a type label', () => {
  assert.equal(phraseTypeHint('expression'), 'An expression');
  assert.equal(phraseTypeHint('common expression'), 'An expression');
  assert.equal(phraseTypeHint('idiom'), 'Phrase type: idiom');
});

test('legacy progress migrates into the ten-guess Inkprint', () => {
  const state = emptyState();
  state.puzzles[puzzles[0].date] = {
    signature: puzzleSignature(puzzles[0]),
    solved: [0, 1],
    incorrect: 8,
    hints: 1,
    complete: false,
    completedAt: null
  };
  const progress = getPuzzleProgress(state, puzzles[0]);
  assert.equal(progress.attempts.length, MAX_GUESSES);
  assert.deepEqual(progress.attempts.slice(0, 3), [
    { kind: 'solve', phrase: 0 },
    { kind: 'solve', phrase: 1 },
    { kind: 'miss' }
  ]);
  assert.equal(progress.failed, true);
});

test('a completed puzzle never migrates as failed', () => {
  const state = emptyState();
  state.puzzles[puzzles[0].date] = {
    signature: puzzleSignature(puzzles[0]),
    solved: [0, 1, 2, 3],
    incorrect: 6,
    complete: true,
    attempts: Array.from({ length: MAX_GUESSES }, (_, index) => index < 4
      ? { kind: 'solve', phrase: index }
      : { kind: 'miss' })
  };
  const progress = getPuzzleProgress(state, puzzles[0]);
  assert.equal(progress.complete, true);
  assert.equal(progress.failed, false);
});

test('progress resets when a date receives different phrase content', () => {
  const state = emptyState();
  state.puzzles[puzzles[0].date] = {
    signature: 'an old phrase bank',
    solved: [0, 1, 2, 3],
    complete: true
  };
  assert.deepEqual(getPuzzleProgress(state, puzzles[0]).solved, []);
  assert.equal(getPuzzleProgress(state, puzzles[0]).complete, false);
});
