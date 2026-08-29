const STORAGE_KEY = 'inkling-progress-v1';
export const MAX_GUESSES = 10;

export const emptyState = () => ({
  version: 1,
  puzzles: {},
  stats: {
    currentStreak: 0,
    longestStreak: 0,
    dailyPuzzlesSolved: 0,
    phrasesFound: 0,
    totalIncorrect: 0,
    hintsUsed: 0,
    lastDailyCompletion: null
  },
  preferences: {
    theme: 'system',
    highContrast: false,
    welcomed: false
  }
});

function safeObject(value, fallback) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

export function loadState(storage = globalThis.localStorage) {
  if (!storage) return emptyState();
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || raw.version !== 1) return emptyState();
    const base = emptyState();
    return {
      ...base,
      ...raw,
      puzzles: safeObject(raw.puzzles, {}),
      stats: { ...base.stats, ...safeObject(raw.stats, {}) },
      preferences: { ...base.preferences, ...safeObject(raw.preferences, {}) }
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A private or full browser store should not make the puzzle unplayable.
  }
}

export function getPuzzleProgress(state, puzzle) {
  const saved = safeObject(state.puzzles[puzzle.date], {});
  const solved = Array.isArray(saved.solved) ? saved.solved : [];
  const incorrect = Number.isFinite(saved.incorrect) ? saved.incorrect : 0;
  const legacyAttempts = [
    ...solved.map((phrase) => ({ kind: 'solve', phrase })),
    ...Array.from({ length: incorrect }, () => ({ kind: 'miss' }))
  ].slice(0, MAX_GUESSES);
  const attempts = Array.isArray(saved.attempts) ? saved.attempts.slice(0, MAX_GUESSES) : legacyAttempts;
  const complete = Boolean(saved.complete);
  return {
    solved: [],
    incorrect: 0,
    hints: 0,
    complete: false,
    failed: false,
    completedAt: null,
    startedAt: null,
    endedAt: null,
    attempts: [],
    ...saved,
    solved,
    incorrect,
    attempts,
    complete,
    failed: !complete && attempts.length >= MAX_GUESSES
  };
}

function dayDistance(fromKey, toKey) {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / 86400000);
}

export function completeDailyStats(stats, dateKey) {
  if (stats.lastDailyCompletion === dateKey) return stats;
  const distance = stats.lastDailyCompletion ? dayDistance(stats.lastDailyCompletion, dateKey) : null;
  const currentStreak = distance === 1 ? stats.currentStreak + 1 : 1;
  return {
    ...stats,
    currentStreak,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    dailyPuzzlesSolved: stats.dailyPuzzlesSolved + 1,
    lastDailyCompletion: dateKey
  };
}

export { STORAGE_KEY };
