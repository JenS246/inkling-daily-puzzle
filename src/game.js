import { PALETTES, derivePuzzle, getDailyPuzzle, normalizeAnswer, puzzleByDate, puzzles, utcDateKey } from './puzzles.js';
import { completeDailyStats, getPuzzleProgress, loadState, saveState } from './storage.js';

const ui = {
  issueLine: document.querySelector('#issue-line'),
  archiveNotice: document.querySelector('#archive-notice'),
  gameplayStage: document.querySelector('.gameplay-stage'),
  wordCloud: document.querySelector('#word-cloud'),
  phraseForm: document.querySelector('#phrase-form'),
  phraseInput: document.querySelector('#phrase-input'),
  phraseLedger: document.querySelector('#phrase-ledger'),
  remainingCount: document.querySelector('#remaining-count'),
  feedback: document.querySelector('#feedback'),
  submitButton: document.querySelector('#submit-button'),
  hintButton: document.querySelector('#hint-button'),
  completion: document.querySelector('#completion'),
  completionKicker: document.querySelector('#completion-kicker'),
  connection: document.querySelector('#connection'),
  connectionNote: document.querySelector('#connection-note'),
  shareButton: document.querySelector('#share-button'),
  shareFallback: document.querySelector('#share-fallback'),
  shareText: document.querySelector('#share-text'),
  archiveList: document.querySelector('#archive-list'),
  statisticsList: document.querySelector('#statistics-list'),
  themeToggle: document.querySelector('#theme-toggle'),
  contrastToggle: document.querySelector('#contrast-toggle'),
  utilityMenu: document.querySelector('#utility-menu')
};

let state = loadState();
const dailyPuzzle = getDailyPuzzle();
let puzzle = derivePuzzle(dailyPuzzle);
let activeHintWords = new Set();
let formTimer = 0;

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function progress() {
  return getPuzzleProgress(state, puzzle);
}

function writeProgress(nextProgress) {
  state.puzzles[puzzle.date] = nextProgress;
  saveState(state);
}

function colorForWord(word) {
  const hash = hashString(`${puzzle.id}:${word}:ink`);
  if (hash % 10 < 6) return 'var(--ink)';
  const palette = PALETTES[puzzle.palette] || PALETTES.bottle;
  return palette[hash % palette.length];
}

function usedCount(word) {
  const solved = new Set(progress().solved);
  return puzzle.phrases.reduce((count, phrase, index) => {
    return count + (solved.has(index) && phrase.words.includes(word) ? 1 : 0);
  }, 0);
}

function renderCloud(newlyFoundWords = []) {
  const foundSet = new Set(newlyFoundWords);
  const shuffled = [...puzzle.words].sort((a, b) => {
    return hashString(`${puzzle.id}:${a.word}`) - hashString(`${puzzle.id}:${b.word}`);
  });

  ui.wordCloud.replaceChildren();
  for (const entry of shuffled) {
    const word = document.createElement('span');
    word.className = 'cloud-word';
    word.textContent = entry.word.toLocaleUpperCase('en-US');
    word.dataset.word = entry.word;
    word.dataset.frequency = String(entry.frequency);
    word.dataset.length = entry.word.length >= 10 ? 'very-long' : entry.word.length >= 8 ? 'long' : 'standard';
    const marks = usedCount(entry.word);
    word.dataset.useMark = marks ? '/'.repeat(marks) : '';
    word.style.setProperty('--word-color', colorForWord(entry.word));
    word.setAttribute('role', 'listitem');
    word.setAttribute('aria-label', `${entry.word}, appears in ${entry.frequency} ${entry.frequency === 1 ? 'phrase' : 'phrases'}`);
    word.classList.toggle('is-used', marks > 0);
    word.classList.toggle('is-hinted', activeHintWords.has(entry.word));
    word.classList.toggle('just-found', foundSet.has(entry.word));
    ui.wordCloud.append(word);
  }
}

function renderLedger(newlyFoundIndex = -1) {
  const solved = new Set(progress().solved);
  const remaining = puzzle.phrases.length - solved.size;
  ui.remainingCount.textContent = remaining ? `${remaining} remaining` : 'All found';
  ui.phraseLedger.replaceChildren();
  puzzle.phrases.forEach((phrase, index) => {
    if (!solved.has(index)) return;
    const item = document.createElement('li');
    item.textContent = phrase.answer;
    item.classList.toggle('just-found', index === newlyFoundIndex);
    ui.phraseLedger.append(item);
  });
}

function signalForm(className) {
  clearTimeout(formTimer);
  ui.phraseForm.classList.remove('is-correct', 'is-wrong');
  requestAnimationFrame(() => ui.phraseForm.classList.add(className));
  formTimer = window.setTimeout(() => ui.phraseForm.classList.remove(className), 620);
}

function submitAttempt(event) {
  event.preventDefault();
  if (progress().complete) return;
  const submitted = normalizeAnswer(ui.phraseInput.value);
  if (!submitted) {
    ui.phraseInput.focus();
    return;
  }

  const solved = new Set(progress().solved);
  const anyMatch = puzzle.phrases.findIndex((phrase) => normalizeAnswer(phrase.answer) === submitted);
  if (anyMatch >= 0 && solved.has(anyMatch)) {
    ui.feedback.textContent = 'Already found.';
    signalForm('is-wrong');
    ui.phraseInput.select();
    return;
  }

  const match = puzzle.phrases.findIndex((phrase, index) => {
    return !solved.has(index) && normalizeAnswer(phrase.answer) === submitted;
  });

  if (match >= 0) {
    const nextSolved = [...progress().solved, match];
    const complete = nextSolved.length === puzzle.phrases.length;
    writeProgress({
      ...progress(),
      solved: nextSolved,
      complete,
      completedAt: complete ? new Date().toISOString() : null
    });
    state.stats.phrasesFound += 1;
    if (complete && puzzle.date === utcDateKey()) {
      state.stats = completeDailyStats(state.stats, puzzle.date);
    }
    saveState(state);
    activeHintWords.clear();
    ui.feedback.textContent = complete ? 'Complete.' : 'Found.';
    ui.phraseInput.value = '';
    signalForm('is-correct');
    renderPuzzleState(match);
    ui.phraseInput.focus();
    return;
  }

  writeProgress({ ...progress(), incorrect: progress().incorrect + 1 });
  state.stats.totalIncorrect += 1;
  saveState(state);
  ui.feedback.textContent = 'Try again.';
  signalForm('is-wrong');
  ui.phraseInput.select();
}

function useHint() {
  const unsolvedIndex = puzzle.phrases.findIndex((_, index) => !progress().solved.includes(index));
  if (unsolvedIndex < 0) return;
  const currentLevel = progress().hints;
  const level = Math.min(currentLevel + 1, 3);
  const target = puzzle.phrases[unsolvedIndex];
  if (level > currentLevel) {
    writeProgress({ ...progress(), hints: level });
    state.stats.hintsUsed += 1;
    saveState(state);
  }

  if (level === 1) {
    ui.feedback.textContent = `Type: ${target.type}.`;
  }
  if (level === 2) ui.feedback.textContent = `Starts with ${target.words[0].toLocaleUpperCase('en-US')}.`;
  if (level === 3) {
    activeHintWords = new Set(target.words);
    ui.feedback.textContent = 'The outlined words belong together.';
  }
  renderPuzzleState();
  ui.utilityMenu.open = false;
}

function renderCompletion() {
  const result = progress();
  ui.completion.hidden = !result.complete;
  if (!result.complete) return;
  ui.completionKicker.textContent = `INKLING #${puzzle.id}`;
  ui.connection.textContent = puzzle.connection;
  ui.connectionNote.textContent = puzzle.connectionNote;
}

function renderPuzzleState(newlyFoundIndex = -1) {
  const result = progress();
  const foundWords = newlyFoundIndex >= 0 ? puzzle.phrases[newlyFoundIndex].words : [];
  ui.gameplayStage.classList.toggle('is-complete', result.complete);
  ui.submitButton.disabled = result.complete;
  ui.phraseInput.disabled = result.complete;
  ui.hintButton.disabled = result.complete;
  ui.hintButton.textContent = result.complete
    ? 'Puzzle complete'
    : result.hints >= 3
      ? 'Show final hint'
      : `Use hint ${result.hints + 1} of 3`;
  renderCloud(foundWords);
  renderLedger(newlyFoundIndex);
  renderCompletion();
}

function loadPuzzle(nextPuzzle) {
  puzzle = derivePuzzle(nextPuzzle);
  activeHintWords = new Set();
  const result = progress();
  if (result.hints >= 3) {
    const unsolved = puzzle.phrases.find((_, index) => !result.solved.includes(index));
    if (unsolved) activeHintWords = new Set(unsolved.words);
  }
  ui.issueLine.textContent = formatDate(puzzle.date).toLocaleUpperCase('en-US');
  ui.archiveNotice.hidden = puzzle.date === utcDateKey();
  ui.feedback.textContent = '';
  ui.phraseInput.value = '';
  ui.shareFallback.hidden = true;
  renderPuzzleState();
}

function archiveStatus(dateKey) {
  const result = state.puzzles[dateKey];
  if (result?.complete) return 'Solved';
  if (result && (result.solved.length || result.incorrect || result.hints)) return 'In progress';
  return 'Unplayed';
}

function renderArchive() {
  const groups = Map.groupBy
    ? Map.groupBy(puzzles, (entry) => entry.date.slice(0, 7))
    : puzzles.reduce((map, entry) => {
        const key = entry.date.slice(0, 7);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entry);
        return map;
      }, new Map());

  ui.archiveList.replaceChildren();
  for (const [monthKey, entries] of groups) {
    const group = document.createElement('section');
    group.className = 'archive-month';
    const heading = document.createElement('h2');
    heading.textContent = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${monthKey}-15T12:00:00Z`));
    group.append(heading);
    const list = document.createElement('ol');
    for (const entry of entries) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#puzzle/${entry.date}`;
      link.innerHTML = `<span>${formatDate(entry.date)}</span><span class="archive-dots" aria-hidden="true"></span><span>${archiveStatus(entry.date)}</span>`;
      link.setAttribute('aria-label', `${formatDate(entry.date)}, puzzle ${entry.id}, ${archiveStatus(entry.date)}`);
      item.append(link);
      list.append(item);
    }
    group.append(list);
    ui.archiveList.append(group);
  }
}

function renderStatistics() {
  const items = [
    ['Current streak', state.stats.currentStreak],
    ['Longest streak', state.stats.longestStreak],
    ['Daily puzzles solved', state.stats.dailyPuzzlesSolved],
    ['Phrases found', state.stats.phrasesFound],
    ['Misses', state.stats.totalIncorrect],
    ['Hints used', state.stats.hintsUsed]
  ];
  ui.statisticsList.replaceChildren();
  items.forEach(([label, value]) => {
    const group = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = String(value);
    group.append(term, description);
    ui.statisticsList.append(group);
  });
}

function resultText() {
  const result = progress();
  const marks = puzzle.phrases.map((_, index) => result.solved.includes(index) ? '●' : '○').join(' ');
  const streak = puzzle.date === utcDateKey() ? `\nStreak: ${state.stats.currentStreak}` : '\nArchive puzzle';
  return `INKLING #${puzzle.id}\n✣ ${result.solved.length}/${puzzle.phrases.length}\n${marks}\nMisses: ${result.incorrect}\nHints: ${result.hints}${streak}`;
}

async function shareResult() {
  const text = resultText();
  try {
    if (navigator.share) {
      await navigator.share({ title: `INKLING #${puzzle.id}`, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    ui.shareButton.textContent = 'Copied';
    window.setTimeout(() => { ui.shareButton.textContent = 'Share result'; }, 1600);
  } catch {
    ui.shareText.value = text;
    ui.shareFallback.hidden = false;
    ui.shareText.focus();
    ui.shareText.select();
  }
}

function applyPreferences() {
  const theme = state.preferences.theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.contrast = state.preferences.highContrast ? 'high' : 'standard';
  const dark = theme === 'dark';
  ui.themeToggle.textContent = dark ? 'Light paper' : 'Dark ink';
  ui.themeToggle.setAttribute('aria-pressed', String(dark));
  ui.contrastToggle.setAttribute('aria-pressed', String(state.preferences.highContrast));
}

function toggleTheme() {
  state.preferences.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  saveState(state);
  applyPreferences();
}

function toggleContrast() {
  state.preferences.highContrast = !state.preferences.highContrast;
  saveState(state);
  applyPreferences();
}

function showView(routeName) {
  const viewName = routeName === 'puzzle' ? 'today' : routeName;
  document.querySelectorAll('.view').forEach((view) => {
    view.hidden = view.dataset.view !== viewName;
  });
  document.querySelectorAll('[data-route]').forEach((link) => {
    const active = link.dataset.route === viewName;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (viewName === 'archive') renderArchive();
  if (viewName === 'statistics') renderStatistics();
  ui.utilityMenu.open = false;
}

function route() {
  const hash = location.hash.slice(1) || 'today';
  if (hash.startsWith('puzzle/')) {
    const archived = puzzleByDate(hash.split('/')[1]);
    if (archived) {
      loadPuzzle(archived);
      showView('puzzle');
      window.scrollTo(0, 0);
      return;
    }
  }
  if (hash === 'today') loadPuzzle(dailyPuzzle);
  showView(['today', 'archive', 'statistics', 'how-to-play'].includes(hash) ? hash : 'today');
  window.scrollTo(0, 0);
}

ui.phraseForm.addEventListener('submit', submitAttempt);
ui.phraseInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  event.preventDefault();
  ui.phraseForm.requestSubmit();
});
ui.phraseInput.addEventListener('input', () => {
  ui.feedback.textContent = '';
  ui.phraseForm.classList.remove('is-correct', 'is-wrong');
});
ui.hintButton.addEventListener('click', useHint);
ui.shareButton.addEventListener('click', shareResult);
ui.themeToggle.addEventListener('click', toggleTheme);
ui.contrastToggle.addEventListener('click', toggleContrast);
window.addEventListener('hashchange', route);

applyPreferences();
route();
