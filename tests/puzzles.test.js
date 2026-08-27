import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePuzzle, normalizeAnswer, puzzles } from '../src/puzzles.js';
import { completeDailyStats, emptyState, getPuzzleProgress, loadState } from '../src/storage.js';

test('every cloud word is derived from at least one phrase', () => {
  for (const puzzle of puzzles) {
    const derived = derivePuzzle(puzzle);
    assert.ok(derived.words.length > 0);
    for (const entry of derived.words) assert.ok(entry.frequency >= 1 && entry.frequency <= puzzle.phrases.length);
    for (const phrase of derived.phrases) assert.equal(new Set(phrase.words).size, phrase.words.length, `${puzzle.date}: phrases cannot repeat a cloud word`);
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
