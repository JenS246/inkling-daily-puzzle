# INKLING

INKLING is a production-ready daily hidden-phrase puzzle. Every word in the cloud belongs to at least one answer, and the word's size shows how many answers contain it. Color is decorative only.

The interface is intentionally closer to an inked typographic painting than a standard game app: a dense word mass, daily print-like ink palettes, and almost no visible interface around the puzzle.

## How it works

- One official puzzle is selected by its UTC calendar date. Thirty-two hand-built themes and rotating phrase pools create 480 unique numbered daily editions before any set can repeat.
- `src/puzzles.js` stores puzzle content separately from the application.
- Unique cloud words, word frequencies, and shared-word relationships are derived automatically.
- `src/game.js` renders the words in deterministic order. CSS packs them into a dense, responsive composition without using phrase membership.
- Players type a complete phrase and press Enter or select Try it. They have ten guesses to find all four phrases.
- Every attempt fills one cell in a 5-by-2 Inkprint: four increasing patterns for solved phrases, inkblots for misses, and faint cells for unused guesses.
- Solved phrases join the Found ledger, which also shows how many remain; their cloud words receive an ink-settle animation.
- A word fades only when every phrase that uses it has been found.
- Every puzzle offers three progressively stronger hints from the top bar. The revealed hint stays clearly visible above the answer field.
- First-time players see a one-time editorial How to Play sheet. The permanent `?` control opens the expanded instructions and a puzzle-like LIGHT example.
- Finished puzzles produce a spoiler-free Inkprint with score, guesses, elapsed time, and hints. A visual preview appears before sharing.
- The archive is a bounded calendar. Future dates cannot be opened, while phases and inkblots distinguish solved, failed, in-progress, and unplayed puzzles.
- Progress, streaks, appearance, statistics, hints, and archive results live in browser `localStorage` only.
- Archive completions do not affect the daily streak.
- The app has no backend, account system, analytics, cookies, or external runtime dependencies.

## Run locally

INKLING is a static ES module application. Serve it over HTTP from the project root:

```bash
npm run dev
```

Then open [http://localhost:4173](http://localhost:4173).

## Test

```bash
npm test
npm run check
```

The tests cover puzzle derivation, phrase word uniqueness, answer normalization, corrupted local data, and UTC streak behavior.

## Add a puzzle

Add a recipe to `DAILY_RECIPES` in `src/puzzles.js`:

```js
{
  id: 185,
  date: '2026-08-28',
  phrases: [
    { answer: 'example phrase', type: 'idiom', note: '' }
  ],
  connection: 'The finished connection',
  connectionNote: 'A short optional explanation.',
  palette: 'orchard'
}
```

Do not repeat a word inside a single phrase. A word shared by different phrases should appear normally in each answer; the program will render it once and compute its frequency.

## Accessibility

- A semantic, screen-reader-labeled word list
- A native form that works with Enter and the Try it button
- Minimum 44px touch targets for every interactive control
- Strong focus states and live feedback regions
- Color-independent solve, used-word, and archive states
- Light, dark, and high-contrast appearances
- Reduced-motion support

## Design references

The original design studies and the two generated v2 gameplay references are preserved in `docs/design-references/`. The v2 mobile and desktop studies established the denser ink-painting direction, minimal typed-answer flow, and quiet Found ledger used by the live interface.

## Important URLs and services

- Production site: https://jens246.github.io/inkling-daily-puzzle/
- Source repository: https://github.com/JenS246/inkling-daily-puzzle
- Hosting: GitHub Pages
- Backend services: none

## License

MIT
