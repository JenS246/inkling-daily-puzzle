# INKLING

INKLING is a production-ready daily hidden-phrase puzzle. Every word in the cloud belongs to at least one answer, and the word's size shows how many answers contain it. Color is decorative only.

The interface is intentionally closer to an inked typographic painting than a standard game app: a dense word mass, daily print-like ink palettes, and almost no visible interface around the puzzle.

## How it works

- One official puzzle is selected by its UTC calendar date. The generated bank is queued entirely in the future: 365 distinct numbered editions from August 30, 2026 through August 29, 2027. Already-issued puzzles remain unchanged.
- `src/generated-puzzles.js` stores the reproducible game bank separately from application logic.
- Every game has exactly four answers and a meaningful hub word present in all four, so the largest cloud word always participates in every answer.
- The bank uses 1,032 distinct phrases across 1,460 slots; no phrase appears more than twice.
- `src/hints.js` gives each numbered puzzle a stable, varied sequence of three hint types.
- Unique cloud words, word frequencies, and shared-word relationships are derived automatically.
- `src/game.js` renders the words in deterministic order. CSS packs them into a dense, responsive composition without using phrase membership.
- Players can tap cloud words in order to build a guess or type a complete phrase, then press Enter. The guess line renders selected words as subtle text buttons; tapping one removes it so it can be added back in a different order. They have ten guesses to find all four phrases.
- Every attempt fills one cell in a 5-by-2 Inkprint: four increasing patterns for solved phrases, inkblots for misses, and faint cells for unused guesses.
- Solved phrases join the Found ledger, which also shows how many remain; their cloud words receive an ink-settle animation.
- Cloud words remain fully colored throughout play, so solved answers do not reveal later ones.
- Every puzzle offers three hints from the top bar. Hint types and order vary by puzzle; an outlined-word hint lasts for one guess.
- First-time players see a one-time editorial How to Play sheet. The permanent `?` control opens the expanded instructions and a puzzle-like LIGHT example.
- Finished puzzles open a spoiler-free preview of the exact 1080-by-1080 full-color Inkprint image they can share. The image uses the daily game palette across its header, print registration strips, guess patterns, and score details. Supported phones use the native image share sheet, desktop browsers copy the PNG, and a download plus compact-text fallback remains available.
- The archive is a bounded calendar. Future dates cannot be opened; filled, shaded, slashed, and blank dates distinguish solved, in-progress, failed, and unplayed puzzles.
- Twelve hand-built archive puzzles cover August 16-27, 2026, before the rotating daily schedule begins.
- Progress, streaks, appearance, statistics, hints, and archive results live in browser `localStorage` only.
- User-facing puzzle dates use clear conventional labels such as `Sept 2, 2026`.
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

The tests cover the 365-game bank, four-way word overlap, phrase reuse limits,
answer cleanliness, puzzle derivation, hint rotation, answer normalization,
corrupted local data, and UTC streak behavior.

## Refresh the source lists

The checked-in raw inputs and generated outputs make the content pipeline
auditable and reproducible:

```bash
npm run data:download
npm run data:build
```

The build combines public idiom, proverb, popular-book, ranked-movie, and
Rolling Stone song-title lists. It converts dashes to spaces, keeps only 3–7
word answers made of letters and spaces, removes placeholders and
family-unsafe terms, requires English-language book data, applies strict
popularity thresholds to books and movies, and excludes phrases in the
editorial denylist. The issued August 30 puzzle is reserved unchanged while
364 regenerated games fill August 31, 2026 through August 29, 2027. See
`data/SOURCES.md` for source URLs and
`data/generated/quality-report.json` for exact build statistics.

## Add a legacy puzzle

Add a dated object to `LEGACY_PUZZLES` in `src/puzzles.js`:

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

- Screen-reader-labeled word buttons with exposed selected state
- A native form that works with Enter and the Enter button
- Minimum 44px touch targets for every interactive control
- Strong focus states and live feedback regions
- Color-independent solve, used-word, and archive states
- Light, dark, and high-contrast appearances
- Reduced-motion support

## Design references

The original design studies and the two generated v2 gameplay references are preserved in `docs/design-references/`. The v2 mobile and desktop studies established the denser ink-painting direction, minimal typed-answer flow, and quiet Found ledger used by the live interface.

## Important URLs and services

- Production site: https://jens246.github.io/inkling-daily-puzzle/
- Admin game list: https://jens246.github.io/inkling-daily-puzzle/admin.html
- Source repository: https://github.com/JenS246/inkling-daily-puzzle
- Hosting: GitHub Pages
- Backend services: none

## License

MIT
