import { PALETTES, derivePuzzle, getDailyPuzzle, normalizeAnswer, puzzleByDate, puzzles, utcDateKey } from './puzzles.js';
import { MAX_GUESSES, MAX_HINTS, completeDailyStats, getPuzzleProgress, loadState, remainingHints, saveState } from './storage.js?v=20260829e';
import { hintSequenceForPuzzle, phraseTypeHint } from './hints.js?v=20260829k';

const ui = {
  issueLine: document.querySelector('#issue-line'),
  archiveNotice: document.querySelector('#archive-notice'),
  gameplayStage: document.querySelector('.gameplay-stage'),
  wordCloud: document.querySelector('#word-cloud'),
  phraseForm: document.querySelector('#phrase-form'),
  phraseInput: document.querySelector('#phrase-input'),
  phraseLedger: document.querySelector('#phrase-ledger'),
  remainingCount: document.querySelector('#remaining-count'),
  remainingLabel: document.querySelector('#remaining-label'),
  phaseTrack: document.querySelector('#phase-track'),
  guessesLeft: document.querySelector('#guesses-left'),
  feedback: document.querySelector('#feedback'),
  submitButton: document.querySelector('#submit-button'),
  hintButton: document.querySelector('#hint-button'),
  hintCount: document.querySelector('#hint-count'),
  hintReveal: document.querySelector('#hint-reveal'),
  completion: document.querySelector('#completion'),
  completionTitle: document.querySelector('#completion-title'),
  inkprintCard: document.querySelector('#inkprint-card'),
  inkprintGrid: document.querySelector('#inkprint-grid'),
  inkprintMetrics: document.querySelector('#inkprint-metrics'),
  inkprintDate: document.querySelector('#inkprint-date'),
  shareButton: document.querySelector('#share-button'),
  shareDialog: document.querySelector('#share-dialog'),
  sharePreviewNumber: document.querySelector('#share-preview-number'),
  sharePreviewGrid: document.querySelector('#share-preview-grid'),
  sharePreviewMetrics: document.querySelector('#share-preview-metrics'),
  sharePreviewDate: document.querySelector('#share-preview-date'),
  shareClose: document.querySelector('#share-close'),
  shareConfirm: document.querySelector('#share-confirm'),
  shareFallback: document.querySelector('#share-fallback'),
  shareText: document.querySelector('#share-text'),
  archiveList: document.querySelector('#archive-list'),
  calendarMonth: document.querySelector('#calendar-month'),
  calendarPrevious: document.querySelector('#calendar-previous'),
  calendarNext: document.querySelector('#calendar-next'),
  statisticsList: document.querySelector('#statistics-list'),
  themeToggle: document.querySelector('#theme-toggle'),
  contrastToggle: document.querySelector('#contrast-toggle'),
  utilityMenu: document.querySelector('#utility-menu'),
  welcomeDialog: document.querySelector('#welcome-dialog'),
  welcomeClose: document.querySelector('#welcome-close')
};

let state = loadState();
const dailyPuzzle = getDailyPuzzle();
let puzzle = derivePuzzle(dailyPuzzle);
let activeHintWords = new Set();
let formTimer = 0;
let viewportSettleTimers = [];
let archiveMonthKey = dailyPuzzle.date.slice(0, 7);

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

function isOver(result = progress()) {
  return result.complete || result.failed;
}

function compactDate(dateKey = puzzle.date) {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}${String(Number(day)).padStart(2, '0')}`;
}

function shareDate(dateKey = puzzle.date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${dateKey}T12:00:00Z`)).toUpperCase();
}

function elapsedTime(result = progress()) {
  if (!result.startedAt) return '--:--';
  const end = result.endedAt || result.completedAt || new Date().toISOString();
  const seconds = Math.max(0, Math.round((Date.parse(end) - Date.parse(result.startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function resultMetrics(result = progress()) {
  return `${result.solved.length}/${puzzle.phrases.length} · ${result.attempts.length}/${MAX_GUESSES} · ${elapsedTime(result)} · 💡${result.hints}`;
}

function renderResultMetrics(result = progress()) {
  const values = [
    `${result.solved.length}/${puzzle.phrases.length}`,
    `${result.attempts.length}/${MAX_GUESSES}`,
    elapsedTime(result),
    `💡${result.hints}`
  ];
  const fragments = [];
  values.forEach((value, index) => {
    if (index) fragments.push(document.createTextNode(' · '));
    const token = document.createElement('span');
    token.className = 'inkprint-metric';
    token.textContent = value;
    fragments.push(token);
  });
  ui.inkprintMetrics.replaceChildren(...fragments);
  ui.inkprintMetrics.setAttribute('aria-label', resultMetrics(result));
}

function shareMetrics(result = progress()) {
  const phrases = `${result.solved.length} ${result.solved.length === 1 ? 'phrase' : 'phrases'}`;
  const guesses = `${result.attempts.length} ${result.attempts.length === 1 ? 'guess' : 'guesses'}`;
  const hints = `${result.hints} ${result.hints === 1 ? 'hint' : 'hints'}`;
  return `${phrases} | ${guesses} | ${hints} | ${elapsedTime(result)}`;
}

function renderShareMetrics(result = progress()) {
  const values = [
    `${result.solved.length} ${result.solved.length === 1 ? 'phrase' : 'phrases'}`,
    `${result.attempts.length} ${result.attempts.length === 1 ? 'guess' : 'guesses'}`,
    `${result.hints} ${result.hints === 1 ? 'hint' : 'hints'}`,
    elapsedTime(result)
  ];
  ui.sharePreviewMetrics.replaceChildren(...values.map((value) => {
    const item = document.createElement('span');
    item.textContent = value;
    return item;
  }));
  ui.sharePreviewMetrics.setAttribute('aria-label', shareMetrics(result));
}

function renderInkprintGrid(container, result = progress()) {
  let solvedCount = 0;
  container.replaceChildren();
  for (let index = 0; index < MAX_GUESSES; index += 1) {
    const attempt = result.attempts[index];
    const cell = document.createElement('span');
    cell.className = 'inkprint-cell';
    cell.dataset.guess = String(index + 1);
    if (!attempt) {
      cell.classList.add('is-unused');
      cell.dataset.state = 'unused';
      cell.setAttribute('aria-label', `Guess ${index + 1}, unused`);
    } else if (attempt.kind === 'miss') {
      cell.classList.add('is-miss');
      cell.dataset.state = 'inkblot';
      cell.setAttribute('aria-label', `Guess ${index + 1}, inkblot`);
    } else {
      solvedCount += 1;
      cell.classList.add('is-solve', `pattern-${Math.min(solvedCount, 4)}`);
      cell.dataset.state = 'phrase';
      cell.setAttribute('aria-label', `Guess ${index + 1}, phrase found`);
    }
    container.append(cell);
  }
}

function inkprintSymbols(result = progress()) {
  const shades = ['▧', '▦', '▩', '■'];
  let solvedCount = 0;
  return Array.from({ length: MAX_GUESSES }, (_, index) => {
    const attempt = result.attempts[index];
    if (!attempt) return '□';
    if (attempt.kind === 'miss') return '✺';
    const symbol = shades[Math.min(solvedCount, shades.length - 1)];
    solvedCount += 1;
    return symbol;
  });
}

function colorForWord(word, index) {
  const palette = PALETTES[puzzle.palette] || PALETTES.bottle;
  const paletteOffset = hashString(`${puzzle.id}:palette`) % palette.length;
  if (index < palette.length) return palette[(index + paletteOffset) % palette.length];
  const hash = hashString(`${puzzle.id}:${word}:ink`);
  if (hash % 10 < 3) return 'var(--ink)';
  return palette[(hash + index + paletteOffset) % palette.length];
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
  shuffled.forEach((entry, index) => {
    const word = document.createElement('span');
    word.className = 'cloud-word';
    word.textContent = entry.word.toLocaleUpperCase('en-US');
    word.dataset.word = entry.word;
    word.dataset.frequency = String(entry.frequency);
    word.dataset.length = entry.word.length >= 10 ? 'very-long' : entry.word.length >= 8 ? 'long' : 'standard';
    const marks = usedCount(entry.word);
    word.dataset.useMark = marks ? '/'.repeat(marks) : '';
    word.style.setProperty('--word-color', colorForWord(entry.word, index));
    word.setAttribute('role', 'listitem');
    word.setAttribute('aria-label', `${entry.word}, appears in ${entry.frequency} ${entry.frequency === 1 ? 'phrase' : 'phrases'}`);
    word.classList.toggle('is-used', marks >= entry.frequency);
    word.classList.toggle('is-partly-used', marks > 0 && marks < entry.frequency);
    word.classList.toggle('is-hinted', activeHintWords.has(entry.word));
    word.classList.toggle('just-found', foundSet.has(entry.word));
    ui.wordCloud.append(word);
  });
}

function renderLedger(newlyFoundIndex = -1) {
  const result = progress();
  const solved = new Set(result.solved);
  const remaining = puzzle.phrases.length - solved.size;
  ui.remainingCount.textContent = String(remaining);
  ui.remainingLabel.textContent = 'remaining';
  ui.phaseTrack.replaceChildren();
  renderInkprintGrid(ui.phaseTrack, result);
  const guessesRemaining = MAX_GUESSES - result.attempts.length;
  ui.guessesLeft.textContent = isOver(result)
    ? `${result.attempts.length} of ${MAX_GUESSES} guesses`
    : `${guessesRemaining} ${guessesRemaining === 1 ? 'guess' : 'guesses'} left`;
  ui.phaseTrack.setAttribute('aria-label', `${result.attempts.length} of ${MAX_GUESSES} guesses used`);
  const solvedOrder = result.attempts.filter((attempt) => attempt.kind === 'solve').map((attempt) => attempt.phrase);
  ui.phraseLedger.replaceChildren();
  puzzle.phrases.forEach((phrase, index) => {
    if (!solved.has(index)) return;
    const item = document.createElement('li');
    item.textContent = phrase.answer;
    item.dataset.pattern = String(solvedOrder.indexOf(index) + 1);
    item.classList.toggle('just-found', index === newlyFoundIndex);
    ui.phraseLedger.append(item);
  });
}

function hintMessage(result = progress()) {
  if (isOver(result)) return '';
  const lastHint = result.lastHint;
  if (!lastHint || result.solved.includes(lastHint.phrase)) return '';
  const target = puzzle.phrases[lastHint.phrase];
  if (!target) return '';
  if (lastHint.kind === 'type') {
    return phraseTypeHint(target.type);
  }
  if (lastHint.kind === 'first') return `First word: ${target.words[0].toLocaleUpperCase('en-US')}`;
  if (lastHint.kind === 'last') return `Last word: ${target.words.at(-1).toLocaleUpperCase('en-US')}`;
  if (lastHint.kind === 'outline' && activeHintWords.size) return 'Outlined words belong together.';
  return '';
}

function renderHintReveal() {
  const message = hintMessage();
  ui.hintReveal.hidden = !message;
  ui.hintReveal.textContent = message;
  if (message) ui.hintReveal.dataset.level = String(progress().hints);
}

function signalForm(className) {
  clearTimeout(formTimer);
  ui.phraseForm.classList.remove('is-correct', 'is-wrong');
  requestAnimationFrame(() => ui.phraseForm.classList.add(className));
  formTimer = window.setTimeout(() => ui.phraseForm.classList.remove(className), 620);
}

function submitAttempt(event) {
  event.preventDefault();
  if (isOver()) return;
  const submitted = normalizeAnswer(ui.phraseInput.value);
  if (!submitted) {
    ui.phraseInput.focus();
    return;
  }

  const current = progress();
  const solved = new Set(current.solved);
  const now = new Date().toISOString();
  const startedAt = current.startedAt || now;
  const anyMatch = puzzle.phrases.findIndex((phrase) => normalizeAnswer(phrase.answer) === submitted);
  if (anyMatch >= 0 && solved.has(anyMatch)) {
    ui.feedback.textContent = 'Already found.';
    signalForm('is-wrong');
    ui.phraseInput.select();
    return;
  }

  // An outline is a one-guess nudge, whether the guess is right or wrong.
  activeHintWords.clear();

  const match = puzzle.phrases.findIndex((phrase, index) => {
    return !solved.has(index) && normalizeAnswer(phrase.answer) === submitted;
  });

  if (match >= 0) {
    const nextSolved = [...current.solved, match];
    const attempts = [...current.attempts, { kind: 'solve', phrase: match }];
    const complete = nextSolved.length === puzzle.phrases.length;
    const failed = !complete && attempts.length >= MAX_GUESSES;
    writeProgress({
      ...current,
      solved: nextSolved,
      attempts,
      startedAt,
      complete,
      failed,
      completedAt: complete ? now : null,
      endedAt: complete || failed ? now : null
    });
    state.stats.phrasesFound += 1;
    if (complete && puzzle.date === dailyPuzzle.date) {
      state.stats = completeDailyStats(state.stats, puzzle.date);
    }
    saveState(state);
    ui.feedback.textContent = complete ? 'Inkprint complete.' : failed ? 'Ink ran dry.' : 'Pattern found.';
    ui.phraseInput.value = '';
    signalForm('is-correct');
    renderPuzzleState(match);
    if (complete || failed) window.setTimeout(openSharePreview, 360);
    if (!complete && !failed) ui.phraseInput.focus();
    return;
  }

  const attempts = [...current.attempts, { kind: 'miss' }];
  const failed = attempts.length >= MAX_GUESSES;
  writeProgress({
    ...current,
    incorrect: current.incorrect + 1,
    attempts,
    startedAt,
    failed,
    endedAt: failed ? now : null
  });
  state.stats.totalIncorrect += 1;
  saveState(state);
  ui.feedback.textContent = failed ? 'Ink ran dry.' : 'Inkblot. Try again.';
  signalForm('is-wrong');
  renderPuzzleState();
  if (failed) window.setTimeout(openSharePreview, 360);
  if (!failed) ui.phraseInput.select();
}

function useHint() {
  if (isOver()) return;
  const unsolvedIndex = puzzle.phrases.findIndex((_, index) => !progress().solved.includes(index));
  if (unsolvedIndex < 0) return;
  const currentLevel = progress().hints;
  const level = Math.min(currentLevel + 1, MAX_HINTS);
  const target = puzzle.phrases[unsolvedIndex];
  const kind = hintSequenceForPuzzle(puzzle.id)[level - 1];
  if (level > currentLevel) {
    writeProgress({ ...progress(), hints: level, lastHint: { kind, phrase: unsolvedIndex } });
    state.stats.hintsUsed += 1;
    saveState(state);
  }

  if (kind === 'outline') {
    activeHintWords = new Set(target.words);
  } else {
    activeHintWords.clear();
  }
  ui.feedback.textContent = '';
  renderPuzzleState();
  ui.hintReveal.animate?.(
    [{ transform: 'translateY(-5px)', opacity: .2 }, { transform: 'translateY(0)', opacity: 1 }],
    { duration: 280, easing: 'ease-out' }
  );
}

function renderCompletion() {
  const result = progress();
  ui.completion.hidden = !isOver(result);
  if (!isOver(result)) return;
  ui.completionTitle.textContent = `INKPRINT #${puzzle.id}`;
  ui.completion.classList.toggle('is-failed', result.failed);
  renderInkprintGrid(ui.inkprintGrid, result);
  renderResultMetrics(result);
  ui.inkprintDate.textContent = compactDate();
}

function renderPuzzleState(newlyFoundIndex = -1) {
  const result = progress();
  const foundWords = newlyFoundIndex >= 0 ? puzzle.phrases[newlyFoundIndex].words : [];
  if (isOver(result)) activeHintWords.clear();
  ui.gameplayStage.classList.toggle('is-complete', isOver(result));
  ui.gameplayStage.classList.toggle('is-failed', result.failed);
  ui.submitButton.disabled = isOver(result);
  ui.phraseInput.disabled = isOver(result);
  const hintsLeft = remainingHints(result.hints);
  const hintLabel = hintsLeft === 0 ? 'No hints remaining' : `${hintsLeft} ${hintsLeft === 1 ? 'hint' : 'hints'} remaining`;
  ui.hintButton.disabled = isOver(result) || hintsLeft === 0;
  ui.hintCount.textContent = `${hintsLeft} REMAINING`;
  ui.hintButton.setAttribute('aria-label', hintLabel);
  renderCloud(foundWords);
  renderLedger(newlyFoundIndex);
  renderHintReveal();
  renderCompletion();
  syncHeaderControls();
}

function loadPuzzle(nextPuzzle) {
  puzzle = derivePuzzle(nextPuzzle);
  activeHintWords = new Set();
  ui.issueLine.textContent = formatDate(puzzle.date).toLocaleUpperCase('en-US');
  ui.archiveNotice.hidden = puzzle.date === dailyPuzzle.date;
  ui.feedback.textContent = '';
  ui.phraseInput.value = '';
  ui.shareFallback.hidden = true;
  if (ui.shareDialog.open) ui.shareDialog.close();
  renderPuzzleState();
}

function archiveStatus(dateKey) {
  const result = state.puzzles[dateKey];
  if (result?.complete) return 'Solved';
  const attempts = Array.isArray(result?.attempts)
    ? result.attempts.length
    : (result?.solved?.length || 0) + (result?.incorrect || 0);
  if (result?.failed || attempts >= MAX_GUESSES) return 'Inkblotted';
  if (result && (result.solved?.length || result.incorrect || result.hints)) return 'In progress';
  return 'Unplayed';
}

function renderArchive() {
  const [year, month] = archiveMonthKey.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingDays = monthStart.getUTCDay();
  const today = utcDateKey();
  const earliestMonth = [...puzzles].sort((a, b) => a.date.localeCompare(b.date))[0].date.slice(0, 7);
  const currentMonth = today.slice(0, 7);
  ui.calendarMonth.textContent = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(monthStart);
  ui.calendarPrevious.disabled = archiveMonthKey <= earliestMonth;
  ui.calendarNext.disabled = archiveMonthKey >= currentMonth;
  ui.archiveList.replaceChildren();
  for (let index = 0; index < leadingDays; index += 1) {
    const blank = document.createElement('span');
    blank.className = 'calendar-day is-blank';
    ui.archiveList.append(blank);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${archiveMonthKey}-${String(day).padStart(2, '0')}`;
    const entry = puzzleByDate(dateKey);
    const isFuture = dateKey > today;
    const cell = document.createElement(entry && !isFuture ? 'a' : 'span');
    cell.className = 'calendar-day';
    cell.dataset.future = String(isFuture);
    const number = document.createElement('span');
    number.className = 'calendar-number';
    number.textContent = String(day);
    cell.append(number);
    if (entry && !isFuture) {
      const status = archiveStatus(dateKey);
      const statusClass = status === 'Solved'
        ? 'complete'
        : status === 'Inkblotted'
          ? 'failed'
          : status === 'In progress'
            ? 'progress'
            : 'unplayed';
      cell.classList.add(`is-${statusClass}`);
      cell.href = `#puzzle/${dateKey}`;
      cell.setAttribute('aria-label', `${formatDate(dateKey)}, puzzle ${entry.id}, ${status}`);
    } else {
      cell.classList.add(isFuture ? 'is-future' : 'is-empty');
      if (isFuture) cell.setAttribute('aria-label', `${formatDate(dateKey)}, future date`);
    }
    ui.archiveList.append(cell);
  }
}

function changeArchiveMonth(delta) {
  const [year, month] = archiveMonthKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  archiveMonthKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
  renderArchive();
}

function renderStatistics() {
  const items = [
    ['Current streak', state.stats.currentStreak],
    ['Longest streak', state.stats.longestStreak],
    ['Daily puzzles solved', state.stats.dailyPuzzlesSolved],
    ['Phrases found', state.stats.phrasesFound],
    ['Splatters', state.stats.totalIncorrect],
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
  const symbols = inkprintSymbols(result);
  return `INKPRINT #${puzzle.id}\n${symbols.slice(0, 5).join('')}\n${symbols.slice(5).join('')}\n\n${shareMetrics(result)} | ${shareDate()}\n\nhttps://jens246.github.io/inkling-daily-puzzle/`;
}

function openSharePreview() {
  const result = progress();
  ui.sharePreviewNumber.textContent = `#${puzzle.id}`;
  renderInkprintGrid(ui.sharePreviewGrid, result);
  renderShareMetrics(result);
  ui.sharePreviewDate.textContent = shareDate();
  ui.shareFallback.hidden = true;
  ui.shareConfirm.textContent = 'Copy Inkprint';
  if (!ui.shareDialog.open) ui.shareDialog.showModal();
}

async function shareResult(button = ui.shareButton) {
  const text = resultText();
  try {
    await navigator.clipboard.writeText(text);
    const original = button === ui.shareConfirm ? 'Copy Inkprint' : 'Share Your Inkprint';
    button.textContent = 'Copied';
    window.setTimeout(() => { button.textContent = original; }, 1200);
  } catch {
    openSharePreview();
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

function syncVisibleViewport() {
  const viewport = window.visualViewport;
  const viewportHeight = Math.round(viewport?.height || window.innerHeight);
  const inputActive = document.activeElement === ui.phraseInput;
  const keyboardOpen = inputActive && viewportHeight < window.innerHeight - 100;
  document.documentElement.style.setProperty('--visible-viewport-height', `${viewportHeight}px`);
  document.documentElement.style.setProperty('--visible-viewport-top', `${Math.round(viewport?.offsetTop || 0)}px`);
  document.body.dataset.keyboardOpen = String(keyboardOpen);
}

function settleVisibleViewport() {
  syncVisibleViewport();
  viewportSettleTimers.forEach((timer) => window.clearTimeout(timer));
  viewportSettleTimers = [60, 240, 700].map((delay) => window.setTimeout(syncVisibleViewport, delay));
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
  document.body.dataset.activeView = viewName;
  document.documentElement.dataset.activeView = viewName;
  syncHeaderControls(viewName);
  ui.utilityMenu.open = false;
}

function syncHeaderControls(viewName = document.body.dataset.activeView || 'today') {
  const isGameView = viewName === 'today';
  ui.hintButton.hidden = !isGameView || isOver();
  ui.issueLine.hidden = !isGameView || puzzle.date !== dailyPuzzle.date;
}

function route() {
  const hash = location.hash.slice(1) || 'today';
  const standardViews = ['today', 'archive', 'statistics', 'how-to-play'];
  if (hash.startsWith('puzzle/')) {
    const archived = puzzleByDate(hash.split('/')[1]);
    if (archived) {
      loadPuzzle(archived);
      showView('puzzle');
      window.scrollTo(0, 0);
      return;
    }
  }
  const view = standardViews.includes(hash) ? hash : 'today';
  if (view === 'today') loadPuzzle(dailyPuzzle);
  showView(view);
  window.scrollTo(0, 0);
}

ui.phraseForm.addEventListener('submit', submitAttempt);
ui.phraseInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  event.preventDefault();
  ui.phraseForm.requestSubmit();
});
ui.phraseInput.addEventListener('input', () => {
  const current = progress();
  if (!current.startedAt && ui.phraseInput.value.trim()) {
    writeProgress({ ...current, startedAt: new Date().toISOString() });
  }
  ui.feedback.textContent = '';
  ui.phraseForm.classList.remove('is-correct', 'is-wrong');
});
ui.phraseInput.addEventListener('focus', settleVisibleViewport);
ui.phraseInput.addEventListener('blur', settleVisibleViewport);
ui.hintButton.addEventListener('click', useHint);
ui.welcomeClose.addEventListener('click', () => {
  state.preferences.welcomed = true;
  saveState(state);
  ui.welcomeDialog.close();
  if (document.body.dataset.activeView === 'today') ui.phraseInput.focus();
  else location.hash = 'today';
});
ui.welcomeDialog.addEventListener('close', () => {
  state.preferences.welcomed = true;
  saveState(state);
});
ui.calendarPrevious.addEventListener('click', () => changeArchiveMonth(-1));
ui.calendarNext.addEventListener('click', () => changeArchiveMonth(1));
ui.inkprintCard.addEventListener('click', openSharePreview);
ui.shareButton.addEventListener('click', () => shareResult(ui.shareButton));
ui.shareClose.addEventListener('click', () => ui.shareDialog.close());
ui.shareDialog.addEventListener('click', (event) => {
  if (event.target === ui.shareDialog) ui.shareDialog.close();
});
ui.shareConfirm.addEventListener('click', () => shareResult(ui.shareConfirm));
ui.themeToggle.addEventListener('click', toggleTheme);
ui.contrastToggle.addEventListener('click', toggleContrast);
document.addEventListener('pointerdown', (event) => {
  if (ui.utilityMenu.open && !ui.utilityMenu.contains(event.target)) ui.utilityMenu.open = false;
});
window.addEventListener('hashchange', route);
window.addEventListener('resize', syncVisibleViewport);
window.addEventListener('load', settleVisibleViewport);
window.addEventListener('pageshow', settleVisibleViewport);
window.addEventListener('orientationchange', settleVisibleViewport);
window.visualViewport?.addEventListener('resize', syncVisibleViewport);
window.visualViewport?.addEventListener('scroll', syncVisibleViewport);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') settleVisibleViewport();
});

applyPreferences();
route();
settleVisibleViewport();
if (!state.preferences.welcomed) ui.welcomeDialog.showModal();
