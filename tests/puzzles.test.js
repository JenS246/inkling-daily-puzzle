import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePuzzle, getDailyPuzzle, normalizeAnswer, puzzleByDate, puzzles } from '../src/puzzles.js';
import { MAX_GUESSES, MAX_HINTS, completeDailyStats, emptyState, getPuzzleProgress, loadState, remainingHints } from '../src/storage.js';

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
    if (puzzle.date >= '2026-08-28') {
      assert.ok(Math.max(...derivePuzzle(puzzle).words.map(({ frequency }) => frequency)) >= 3, `${puzzle.date}: cloud needs a strong repeated word`);
    }
    assert.equal(dates.has(puzzle.date), false, `${puzzle.date}: duplicate date`);
    assert.equal(ids.has(puzzle.id), false, `${puzzle.id}: duplicate id`);
    dates.add(puzzle.date);
    ids.add(puzzle.id);
  }
});

test('the daily schedule advances its date and continues beyond the first bank cycle', () => {
  assert.equal(getDailyPuzzle('2026-08-29').date, '2026-08-29');
  assert.equal(getDailyPuzzle('2026-08-29').id, 186);
  assert.equal(getDailyPuzzle('2026-10-15').date, '2026-10-15');
  assert.notEqual(getDailyPuzzle('2026-10-15').id, getDailyPuzzle('2026-08-29').id);
  assert.notDeepEqual(
    getDailyPuzzle('2026-08-28').phrases.map(({ answer }) => answer),
    getDailyPuzzle('2026-09-29').phrases.map(({ answer }) => answer)
  );
  assert.equal(puzzleByDate('2026-08-22'), undefined);
});

test('the 480-edition rotation stays unique and puzzle-safe', () => {
  const editions = new Set();
  const start = Date.parse('2026-08-28T00:00:00Z');
  for (let offset = 0; offset < 480; offset += 1) {
    const date = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
    const puzzle = puzzleByDate(date);
    const derived = derivePuzzle(puzzle);
    const edition = puzzle.phrases.map(({ answer }) => normalizeAnswer(answer)).sort().join('|');
    assert.equal(puzzle.phrases.length, 4, `${date}: expected four phrases`);
    assert.equal(new Set(puzzle.phrases.map(({ answer }) => normalizeAnswer(answer))).size, 4, `${date}: answers must be distinct`);
    assert.ok(Math.max(...derived.words.map(({ frequency }) => frequency)) >= 3, `${date}: cloud needs a strong repeated word`);
    for (const phrase of derived.phrases) assert.equal(new Set(phrase.words).size, phrase.words.length, `${date}: phrase repeats a cloud word`);
    assert.equal(editions.has(edition), false, `${date}: repeated edition`);
    editions.add(edition);
  }
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
  state.puzzles[puzzles[0].date] = { hints: 9 };
  assert.equal(getPuzzleProgress(state, puzzles[0]).hints, MAX_HINTS);
});

test('legacy progress migrates into the ten-guess Inkprint', () => {
  const state = emptyState();
  state.puzzles[puzzles[0].date] = {
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
