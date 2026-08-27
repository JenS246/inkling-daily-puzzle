# INKLING

INKLING is a production-ready daily hidden-phrase puzzle. Every word in the cloud belongs to at least one answer, and the word's size shows how many answers contain it. Color is decorative only.

The interface is intentionally closer to a small literary puzzle page than a standard game app: sharp rules, asymmetrical type, daily print-like ink palettes, and no tile grid.

## How it works

- One official puzzle is selected by its UTC calendar date.
- `src/puzzles.js` stores puzzle content separately from the application.
- Unique cloud words, answer lengths, word frequencies, and shared-word relationships are derived automatically.
- `src/game.js` measures every word after fonts load and uses deterministic collision-aware packing. Placement changes with the viewport but never uses phrase membership.
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

Add a record to the `puzzles` array in `src/puzzles.js`:

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

- Semantic word buttons with spoken frequency labels
- Full keyboard navigation and shortcuts
- Minimum 44px touch targets for puzzle words and mobile controls
- Strong focus states and live feedback regions
- Color-independent solve, used-word, and archive states
- Light, dark, and high-contrast appearances
- Reduced-motion and reduced-transparency preferences

## Design references

The four generated design studies used before implementation are preserved in `docs/design-references/`. They cover the mobile puzzle, desktop puzzle, archive, and statistics/how-to views. The live interface follows their typographic system while keeping gameplay data and placement fully functional.

## Important URLs and services

- Production site: https://jens246.github.io/inkling-daily-puzzle/
- Source repository: https://github.com/JenS246/inkling-daily-puzzle
- Hosting: GitHub Pages
- Backend services: none

## License

MIT
