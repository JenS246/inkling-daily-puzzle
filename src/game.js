import { PALETTES, derivePuzzle, getDailyPuzzle, normalizeAnswer, puzzleByDate, puzzles, utcDateKey } from './puzzles.js';
import { completeDailyStats, getPuzzleProgress, loadState, saveState } from './storage.js';

const ui = {
  issueLine: document.querySelector('#issue-line'),
  phraseCount: document.querySelector('#phrase-count'),
  archiveNotice: document.querySelector('#archive-notice'),
  wordCloud: document.querySelector('#word-cloud'),
  phraseLedger: document.querySelector('#phrase-ledger'),
  currentAttempt: document.querySelector('#current-attempt'),
  mistakeCount: document.querySelector('#mistake-count'),
  feedback: document.querySelector('#feedback'),
  undoButton: document.querySelector('#undo-button'),
  clearButton: document.querySelector('#clear-button'),
  submitButton: document.querySelector('#submit-button'),
  hintButton: document.querySelector('#hint-button'),
  completion: document.querySelector('#completion'),
  completionKicker: document.querySelector('#completion-kicker'),
  completionSummary: document.querySelector('#completion-summary'),
  connection: document.querySelector('#connection'),
  connectionNote: document.querySelector('#connection-note'),
  shareButton: document.querySelector('#share-button'),
  shareFallback: document.querySelector('#share-fallback'),
  shareText: document.querySelector('#share-text'),
  archiveList: document.querySelector('#archive-list'),
  statisticsList: document.querySelector('#statistics-list'),
  themeToggle: document.querySelector('#theme-toggle'),
  contrastToggle: document.querySelector('#contrast-toggle'),
  welcomeDialog: document.querySelector('#welcome-dialog')
};

let state = loadState();
let dailyPuzzle = getDailyPuzzle();
let puzzle = derivePuzzle(dailyPuzzle);
let attempt = [];
let activeHintWords = new Set();
let layoutFrame = 0;

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(dateKey, includeYear = false) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC'
  }).format(date);
}

function progress() {
  return getPuzzleProgress(state, puzzle);
}

function writeProgress(nextProgress) {
  state.puzzles[puzzle.date] = nextProgress;
  saveState(state);
}

function colorForWord(word) {
  const palette = PALETTES[puzzle.palette] || PALETTES.bottle;
  return palette[hashString(`${puzzle.id}:${word}:ink`) % palette.length];
}

function usedCount(word) {
  const solved = new Set(progress().solved);
  return puzzle.phrases.reduce((count, phrase, index) => count + (solved.has(index) && phrase.words.includes(word) ? 1 : 0), 0);
}

function renderCloud() {
  ui.wordCloud.replaceChildren();
  const shuffled = [...puzzle.words].sort((a, b) => hashString(`${puzzle.id}:${a.word}`) - hashString(`${puzzle.id}:${b.word}`));

  for (const entry of shuffled) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cloud-word';
    button.textContent = entry.word.toLocaleUpperCase('en-US');
    button.dataset.word = entry.word;
    button.dataset.frequency = String(entry.frequency);
    const marks = usedCount(entry.word);
    button.dataset.used = String(marks);
    button.dataset.useMark = marks ? '/'.repeat(marks) : '';
    button.style.setProperty('--word-color', colorForWord(entry.word));
    button.setAttribute('aria-label', `${entry.word}, appears in ${entry.frequency} ${entry.frequency === 1 ? 'phrase' : 'phrases'}`);
    button.setAttribute('aria-pressed', attempt.includes(entry.word) ? 'true' : 'false');
    button.classList.toggle('is-selected', attempt.includes(entry.word));
    button.classList.toggle('is-used', marks > 0);
    button.classList.toggle('is-hinted', activeHintWords.has(entry.word));
    button.addEventListener('click', () => toggleWord(entry.word));
    ui.wordCloud.append(button);
  }

  queueCloudLayout();
}

function overlaps(candidate, placed, gap) {
  return placed.some((box) => !(
    candidate.right + gap < box.left ||
    candidate.left > box.right + gap ||
    candidate.bottom + gap < box.top ||
    candidate.top > box.bottom + gap
  ));
}

function layoutCloud() {
  const buttons = [...ui.wordCloud.querySelectorAll('.cloud-word')];
  if (!buttons.length) return;
  const width = ui.wordCloud.clientWidth;
  const mobile = width < 650;
  const gap = mobile ? 5 : 12;
  const sidePadding = mobile ? 2 : 10;
  const ordered = [...buttons].sort((a, b) => Number(b.dataset.frequency) - Number(a.dataset.frequency));
  const random = seededRandom(hashString(`${puzzle.date}:${Math.round(width / 24)}`));
  let height = mobile ? 535 : 615;
  let finalPositions = null;

  for (let expansion = 0; expansion < 8 && !finalPositions; expansion += 1) {
    const placed = [];
    let failed = false;

    for (const button of ordered) {
      const boxWidth = button.offsetWidth;
      const boxHeight = button.offsetHeight;
      let found = null;

      for (let attemptIndex = 0; attemptIndex < 700; attemptIndex += 1) {
        const left = sidePadding + random() * Math.max(1, width - boxWidth - sidePadding * 2);
        const top = random() * Math.max(1, height - boxHeight);
        const candidate = { left, top, right: left + boxWidth, bottom: top + boxHeight, button };
        if (!overlaps(candidate, placed, gap)) {
          found = candidate;
          break;
        }
      }

      if (!found) {
        failed = true;
        break;
      }
      placed.push(found);
    }

    if (!failed) finalPositions = placed;
    else height += mobile ? 72 : 55;
  }

  if (!finalPositions) {
    height = Math.max(height, buttons.length * 70);
    finalPositions = [];
    let top = 0;
    for (const button of ordered) {
      const left = Math.max(sidePadding, (width - button.offsetWidth) * random());
      finalPositions.push({ button, left, top });
      top += button.offsetHeight + gap;
    }
    height = top;
  }

  ui.wordCloud.style.height = `${Math.ceil(height)}px`;
  finalPositions.forEach(({ button, left, top }) => {
    button.style.left = `${Math.round(left)}px`;
    button.style.top = `${Math.round(top)}px`;
  });
}

function queueCloudLayout() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => requestAnimationFrame(layoutCloud));
}

function toggleWord(word) {
  const index = attempt.indexOf(word);
  if (index >= 0) attempt.splice(index, 1);
  else attempt.push(word);
  ui.feedback.textContent = '';
  updateAttempt();
  renderCloud();
}

function updateAttempt() {
  ui.currentAttempt.replaceChildren();
  if (!attempt.length) {
    const empty = document.createElement('span');
    empty.className = 'attempt-empty';
    empty.textContent = 'Tap a word to begin';
    ui.currentAttempt.append(empty);
  } else {
    attempt.forEach((word) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = word.toLocaleUpperCase('en-US');
      button.setAttribute('aria-label', `Remove ${word} from your phrase`);
      button.addEventListener('click', () => toggleWord(word));
      ui.currentAttempt.append(button);
    });
  }
  ui.undoButton.disabled = attempt.length === 0;
  ui.clearButton.disabled = attempt.length === 0;
  ui.submitButton.disabled = attempt.length === 0 || progress().complete;
}

function renderLedger() {
  ui.phraseLedger.replaceChildren();
  const solved = new Set(progress().solved);
  puzzle.phrases.forEach((phrase, index) => {
    const item = document.createElement('div');
    item.className = 'phrase-row';
    if (solved.has(index)) item.classList.add('is-solved');
    const label = document.createElement('span');
    label.className = 'phrase-label';
    label.textContent = `Phrase ${index + 1}`;
    const answer = document.createElement('span');
    answer.className = 'phrase-answer';
    answer.textContent = solved.has(index)
      ? phrase.answer
      : phrase.words.map((word) => '_'.repeat(Math.min(word.length, 6))).join('  ');
    item.append(label, answer);
    ui.phraseLedger.append(item);
  });
}

function submitAttempt() {
  if (!attempt.length || progress().complete) return;
  const submitted = normalizeAnswer(attempt.join(' '));
  const solved = new Set(progress().solved);
  const match = puzzle.phrases.findIndex((phrase, index) => !solved.has(index) && normalizeAnswer(phrase.answer) === submitted);

  if (match >= 0) {
    const nextSolved = [...progress().solved, match];
    const complete = nextSolved.length === puzzle.phrases.length;
    const nextProgress = {
      ...progress(),
      solved: nextSolved,
      complete,
      completedAt: complete ? new Date().toISOString() : null
    };
    writeProgress(nextProgress);
    state.stats.phrasesFound += 1;
    if (complete && puzzle.date === utcDateKey()) state.stats = completeDailyStats(state.stats, puzzle.date);
    saveState(state);
    ui.feedback.textContent = complete ? 'Every phrase found.' : `Phrase ${match + 1} found.`;
    attempt = [];
    activeHintWords.clear();
    renderPuzzleState();
    return;
  }

  const nextProgress = { ...progress(), incorrect: progress().incorrect + 1 };
  writeProgress(nextProgress);
  state.stats.totalIncorrect += 1;
  saveState(state);
  ui.feedback.textContent = 'Not a hidden phrase. The cloud keeps its counsel.';
  ui.wordCloud.classList.remove('has-miss');
  requestAnimationFrame(() => ui.wordCloud.classList.add('has-miss'));
  renderPuzzleState(false);
}

function useHint() {
  const unsolvedIndex = puzzle.phrases.findIndex((_, index) => !progress().solved.includes(index));
  if (unsolvedIndex < 0) return;
  const level = Math.min(progress().hints + 1, 3);
  const target = puzzle.phrases[unsolvedIndex];
  const nextProgress = { ...progress(), hints: level };
  writeProgress(nextProgress);
  state.stats.hintsUsed += 1;
  saveState(state);

  if (level === 1) ui.feedback.textContent = `Phrase ${unsolvedIndex + 1} is a ${target.type}.`;
  if (level === 2) ui.feedback.textContent = `Phrase ${unsolvedIndex + 1} begins with “${target.words[0].toLocaleUpperCase('en-US')}”.`;
  if (level === 3) {
    activeHintWords = new Set(target.words);
    ui.feedback.textContent = `The dotted words make Phrase ${unsolvedIndex + 1}. Put them in order.`;
  }
  renderPuzzleState(false);
}

function renderCompletion() {
  const result = progress();
  ui.completion.hidden = !result.complete;
  if (!result.complete) return;
  const isArchive = puzzle.date !== utcDateKey();
  ui.completionKicker.textContent = `INKLING #${puzzle.id}`;
  ui.completionSummary.innerHTML = `
    <p><strong>${puzzle.phrases.length}/${puzzle.phrases.length}</strong><span>phrases found</span></p>
    <p><strong>${result.incorrect}</strong><span>${result.incorrect === 1 ? 'miss' : 'misses'}</span></p>
    <p><strong>${result.hints}</strong><span>${result.hints === 1 ? 'hint' : 'hints'}</span></p>
    ${isArchive ? '' : `<p><strong>${state.stats.currentStreak}</strong><span>day streak</span></p>`}
  `;
  ui.connection.textContent = puzzle.connection;
  ui.connectionNote.textContent = puzzle.connectionNote;
}

function renderPuzzleState(relayout = true) {
  const result = progress();
  ui.mistakeCount.textContent = `${result.incorrect} ${result.incorrect === 1 ? 'miss' : 'misses'}`;
  ui.hintButton.disabled = result.complete || result.hints >= 3;
  ui.hintButton.textContent = result.hints >= 3 ? 'All hints used' : `Take a hint${result.hints ? ` (${result.hints}/3)` : ''}`;
  renderLedger();
  updateAttempt();
  renderCloud();
  renderCompletion();
  if (!relayout) queueCloudLayout();
}

function loadPuzzle(nextPuzzle) {
  puzzle = derivePuzzle(nextPuzzle);
  attempt = [];
  activeHintWords = new Set();
  const result = progress();
  if (result.hints >= 3) {
    const unsolved = puzzle.phrases.find((_, index) => !result.solved.includes(index));
    if (unsolved) activeHintWords = new Set(unsolved.words);
  }
  ui.issueLine.textContent = `${formatDate(puzzle.date)} / Puzzle ${puzzle.id}`;
  ui.phraseCount.textContent = String(puzzle.phrases.length);
  ui.archiveNotice.hidden = puzzle.date === utcDateKey();
  ui.completion.hidden = true;
  ui.feedback.textContent = '';
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
    heading.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${monthKey}-15T12:00:00Z`));
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
    setTimeout(() => { ui.shareButton.textContent = 'Share result'; }, 1600);
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

function showView(route) {
  const viewName = route === 'puzzle' ? 'today' : route;
  document.querySelectorAll('.view').forEach((view) => { view.hidden = view.dataset.view !== viewName; });
  document.querySelectorAll('[data-route]').forEach((link) => {
    const active = link.dataset.route === viewName;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (viewName === 'archive') renderArchive();
  if (viewName === 'statistics') renderStatistics();
  if (viewName === 'today') queueCloudLayout();
}

function route() {
  const hash = location.hash.slice(1) || 'today';
  if (hash.startsWith('puzzle/')) {
    const dateKey = hash.split('/')[1];
    const archived = puzzleByDate(dateKey);
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

ui.undoButton.addEventListener('click', () => {
  attempt.pop();
  ui.feedback.textContent = '';
  updateAttempt();
  renderCloud();
});
ui.clearButton.addEventListener('click', () => {
  attempt = [];
  ui.feedback.textContent = '';
  updateAttempt();
  renderCloud();
});
ui.submitButton.addEventListener('click', submitAttempt);
ui.hintButton.addEventListener('click', useHint);
ui.shareButton.addEventListener('click', shareResult);
ui.themeToggle.addEventListener('click', toggleTheme);
ui.contrastToggle.addEventListener('click', toggleContrast);
window.addEventListener('hashchange', route);
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase('en-US') === 'z') {
    event.preventDefault();
    ui.undoButton.click();
  }
  if (event.key === 'Escape' && !ui.welcomeDialog.open) ui.clearButton.click();
});

new ResizeObserver(queueCloudLayout).observe(ui.wordCloud);
if (document.fonts?.ready) document.fonts.ready.then(queueCloudLayout);

applyPreferences();
route();

if (!state.preferences.welcomed && typeof ui.welcomeDialog.showModal === 'function') {
  ui.welcomeDialog.showModal();
  ui.welcomeDialog.addEventListener('close', () => {
    state.preferences.welcomed = true;
    saveState(state);
  }, { once: true });
}
