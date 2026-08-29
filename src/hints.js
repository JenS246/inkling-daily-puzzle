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
