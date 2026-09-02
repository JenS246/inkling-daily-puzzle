import { PALETTES, derivePuzzle, getDailyPuzzle, normalizeAnswer, puzzleByDate, puzzles, utcDateKey } from './puzzles.js?v=20260830a';
import { MAX_GUESSES, MAX_HINTS, completeDailyStats, getPuzzleProgress, loadState, puzzleSignature, remainingHints, saveState } from './storage.js?v=20260829f';
import { hintSequenceForPhrase, phraseTypeHint, smartHintForPhrase } from './hints.js?v=20260830l';

const ui = {
  issueLine: document.querySelector('#issue-line'),
  archiveNotice: document.querySelector('#archive-notice'),
  gameplayStage: document.querySelector('.gameplay-stage'),
  wordCloud: document.querySelector('#word-cloud'),
  phraseForm: document.querySelector('#phrase-form'),
  phraseInputWrap: document.querySelector('.phrase-input-wrap'),
  phraseInput: document.querySelector('#phrase-input'),
  guessBuilder: document.querySelector('#guess-builder'),
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
  answerRevealList: document.querySelector('#answer-reveal-list'),
  inkprintCard: document.querySelector('#inkprint-card'),
  inkprintGrid: document.querySelector('#inkprint-grid'),
  inkprintMetrics: document.querySelector('#inkprint-metrics'),
  inkprintDate: document.querySelector('#inkprint-date'),
  shareButton: document.querySelector('#share-button'),
  shareDialog: document.querySelector('#share-dialog'),
  shareCard: document.querySelector('#share-card'),
  shareClose: document.querySelector('#share-close'),
  shareConfirm: document.querySelector('#share-confirm'),
  shareFallback: document.querySelector('#share-fallback'),
  shareFallbackMessage: document.querySelector('#share-fallback-message'),
  shareDownload: document.querySelector('#share-download'),
  shareCopyText: document.querySelector('#share-copy-text'),
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
let touchSubmitLock = false;
let archiveMonthKey = dailyPuzzle.date.slice(0, 7);
let shareCardBlobPromise = null;
let shareDownloadUrl = '';
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function formatDate(dateKey = puzzle.date) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${MONTH_LABELS[month - 1]} ${day}, ${year}`;
}

function progress() {
  return getPuzzleProgress(state, puzzle);
}

function writeProgress(nextProgress) {
  state.puzzles[puzzle.date] = { ...nextProgress, signature: puzzleSignature(puzzle) };
  saveState(state);
}

function isOver(result = progress()) {
  return result.complete || result.failed;
}

function shareDate(dateKey = puzzle.date) {
  return formatDate(dateKey);
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
      cell.style.setProperty('--cell-ink', `var(--daily-color-${Math.min(solvedCount, 4)})`);
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

function applyPuzzlePalette() {
  const palette = PALETTES[puzzle.palette] || PALETTES.bottle;
  palette.forEach((color, index) => {
    document.documentElement.style.setProperty(`--daily-ink-${index + 1}`, color);
  });
  document.documentElement.dataset.puzzlePalette = puzzle.palette;
}

function guessWords() {
  return normalizeAnswer(ui.phraseInput.value).split(' ').filter(Boolean);
}

function renderGuessBuilder() {
  const words = guessWords();
  const previousScroll = ui.guessBuilder.scrollLeft;
  const wordButtons = words.map((word, index) => {
    const button = document.createElement('button');
    button.className = 'guess-word';
    button.type = 'button';
    button.textContent = word;
    button.setAttribute('aria-label', `Remove ${word} from guess`);
    button.addEventListener('click', () => removeGuessWord(index));
    return button;
  });
  if (words.length) {
    const editButton = document.createElement('button');
    editButton.className = 'guess-edit';
    editButton.type = 'button';
    editButton.setAttribute('aria-label', 'Edit guess');
    editButton.addEventListener('click', () => ui.phraseInput.focus());
    wordButtons.push(editButton);
  }
  ui.guessBuilder.replaceChildren(...wordButtons);
  const showBuilder = words.length > 0 && document.activeElement !== ui.phraseInput && !isOver();
  ui.guessBuilder.hidden = !showBuilder;
  ui.phraseInputWrap.classList.toggle('has-token-display', showBuilder);
  if (showBuilder) ui.guessBuilder.scrollLeft = previousScroll;
}

function syncCloudGuessSelection() {
  const selectedWords = new Set(guessWords());
  ui.wordCloud.querySelectorAll('.cloud-word').forEach((wordButton) => {
    const selected = selectedWords.has(wordButton.dataset.word);
    const frequency = Number(wordButton.dataset.frequency);
    wordButton.classList.toggle('is-in-guess', selected);
    wordButton.setAttribute('aria-pressed', String(selected));
    wordButton.setAttribute(
      'aria-label',
      `${wordButton.dataset.word}, appears in ${frequency} ${frequency === 1 ? 'phrase' : 'phrases'}. ${selected ? 'Remove from' : 'Add to'} guess.`
    );
  });
  renderGuessBuilder();
}

function updateGuessWords(words, scrollToEnd = false) {
  ui.phraseInput.value = words.join(' ');
  ui.phraseInput.dispatchEvent(new Event('input', { bubbles: true }));
  if (scrollToEnd && !ui.guessBuilder.hidden) ui.guessBuilder.scrollLeft = ui.guessBuilder.scrollWidth;
}

function removeGuessWord(index) {
  if (isOver()) return;
  const words = guessWords();
  words.splice(index, 1);
  updateGuessWords(words);
}

function toggleGuessWord(selectedWord) {
  if (isOver()) return;
  const words = guessWords();
  const selectedIndex = words.indexOf(selectedWord);
  if (selectedIndex >= 0) words.splice(selectedIndex, 1);
  else words.push(selectedWord);
  updateGuessWords(words, selectedIndex < 0);
}

function renderCloud(newlyFoundWords = []) {
  const foundSet = new Set(newlyFoundWords);
  const shuffled = [...puzzle.words].sort((a, b) => {
    return hashString(`${puzzle.id}:${a.word}`) - hashString(`${puzzle.id}:${b.word}`);
  });

  ui.wordCloud.replaceChildren();
  shuffled.forEach((entry, index) => {
    const word = document.createElement('button');
    word.className = 'cloud-word';
    word.type = 'button';
    word.textContent = entry.word.toLocaleUpperCase('en-US');
    word.dataset.word = entry.word;
    word.dataset.frequency = String(entry.frequency);
    word.dataset.length = entry.word.length >= 10 ? 'very-long' : entry.word.length >= 8 ? 'long' : 'standard';
    word.style.setProperty('--word-color', colorForWord(entry.word, index));
    word.setAttribute('aria-pressed', 'false');
    word.disabled = isOver();
    word.classList.toggle('is-hinted', activeHintWords.has(entry.word));
    word.classList.toggle('just-found', foundSet.has(entry.word));
    word.addEventListener('click', () => toggleGuessWord(entry.word));
    ui.wordCloud.append(word);
  });
  syncCloudGuessSelection();
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
  if (lastHint.kind === 'smart') return smartHintForPhrase(target);
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
    ui.feedback.textContent = complete ? 'Inkprint complete.' : failed ? 'Ink ran dry.' : '';
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
  const kind = hintSequenceForPhrase(puzzle.id, target)[level - 1];
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
  ui.answerRevealList.replaceChildren(...puzzle.phrases.map(({ answer }) => {
    const item = document.createElement('li');
    item.textContent = answer;
    return item;
  }));
  renderInkprintGrid(ui.inkprintGrid, result);
  renderResultMetrics(result);
  ui.inkprintDate.textContent = formatDate();
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
  ui.hintButton.dataset.remaining = String(hintsLeft);
  ui.hintButton.setAttribute('aria-label', hintLabel);
  renderCloud(foundWords);
  renderLedger(newlyFoundIndex);
  renderHintReveal();
  renderCompletion();
  syncHeaderControls();
}

function loadPuzzle(nextPuzzle) {
  puzzle = derivePuzzle(nextPuzzle);
  applyPuzzlePalette();
  activeHintWords = new Set();
  ui.issueLine.textContent = formatDate(puzzle.date);
  ui.archiveNotice.hidden = puzzle.date === dailyPuzzle.date;
  ui.feedback.textContent = '';
  ui.phraseInput.value = '';
  ui.shareFallback.hidden = true;
  if (ui.shareDialog.open) ui.shareDialog.close();
  renderPuzzleState();
}

function archiveStatus(dateKey) {
  const target = puzzleByDate(dateKey);
  if (!target) return 'Unplayed';
  const result = getPuzzleProgress(state, target);
  if (result?.complete) return 'Solved';
  const attempts = Array.isArray(result?.attempts)
    ? result.attempts.length
    : (result?.solved?.length || 0) + (result?.incorrect || 0);
  if (result?.failed || attempts >= MAX_GUESSES) return 'Inkblotted';
  if (result.solved.length || result.incorrect || result.hints) return 'In progress';
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

function seededRandom(seed) {
  let value = seed || 1;
  return () => {
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPaperTexture(context, random, width, height) {
  context.save();
  for (let index = 0; index < 760; index += 1) {
    const opacity = .018 + random() * .028;
    context.fillStyle = `rgba(36, 55, 63, ${opacity})`;
    const size = random() < .9 ? 1 : 2;
    context.fillRect(Math.floor(random() * width), Math.floor(random() * height), size, size);
  }
  context.restore();
}

function drawInkblot(context, random, x, y, palette) {
  const blobs = [
    [0, 0, 43], [-34, -11, 24], [35, 10, 27], [-16, 34, 22],
    [18, -34, 25], [42, -25, 14], [-44, 27, 15], [7, 45, 15]
  ];
  context.save();
  blobs.forEach(([offsetX, offsetY, radius], index) => {
    context.beginPath();
    context.fillStyle = palette[index % palette.length];
    context.globalAlpha = index < 5 ? .96 : .86;
    context.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
    context.fill();
  });
  for (let index = 0; index < 7; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 54 + random() * 24;
    context.beginPath();
    context.fillStyle = palette[index % palette.length];
    context.globalAlpha = .7;
    context.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 3 + random() * 5, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawSolvePattern(context, x, y, width, height, solveNumber, color) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.fillStyle = color;
  context.globalAlpha = .24;
  context.fillRect(x, y, width, height);
  context.globalAlpha = 1;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = solveNumber === 4 ? 6 : 8;

  if (solveNumber === 1) {
    for (let line = -height; line < width + height; line += 29) {
      context.beginPath();
      context.moveTo(x + line, y + height);
      context.lineTo(x + line + height, y);
      context.stroke();
    }
  } else if (solveNumber === 2) {
    const square = 27;
    for (let row = 0; row * square < height; row += 1) {
      for (let column = 0; column * square < width; column += 1) {
        if ((row + column) % 2 === 0) context.fillRect(x + column * square, y + row * square, square, square);
      }
    }
  } else if (solveNumber === 3) {
    context.lineWidth = 7;
    for (let line = 14; line < width; line += 31) {
      context.beginPath();
      context.moveTo(x + line, y);
      context.lineTo(x + line, y + height);
      context.stroke();
    }
    for (let line = 14; line < height; line += 31) {
      context.beginPath();
      context.moveTo(x, y + line);
      context.lineTo(x + width, y + line);
      context.stroke();
    }
  } else {
    for (let line = -height; line < width + height; line += 24) {
      context.beginPath();
      context.moveTo(x + line, y + height);
      context.lineTo(x + line + height, y);
      context.stroke();
      context.beginPath();
      context.moveTo(x + line, y);
      context.lineTo(x + line + height, y + height);
      context.stroke();
    }
  }
  context.restore();
}

function drawShareCell(context, random, result, index, x, y, width, height, palette, colors) {
  const attempt = result.attempts[index];
  context.save();
  context.fillStyle = colors.paper;
  context.fillRect(x, y, width, height);
  context.strokeStyle = attempt ? colors.ink : colors.rule;
  context.lineWidth = attempt ? 3 : 2;
  if (!attempt) context.setLineDash([10, 9]);
  context.strokeRect(x + 1, y + 1, width - 2, height - 2);
  context.setLineDash([]);

  if (attempt?.kind === 'miss') {
    const missColor = palette[(index + 1) % palette.length];
    context.fillStyle = missColor;
    context.globalAlpha = .1;
    context.fillRect(x, y, width, height);
    context.globalAlpha = .92;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const blotPoints = 16;
    context.beginPath();
    for (let point = 0; point < blotPoints; point += 1) {
      const angle = (point / blotPoints) * Math.PI * 2;
      const radiusX = width * (.2 + random() * .16);
      const radiusY = height * (.2 + random() * .16);
      const pointX = centerX + Math.cos(angle) * radiusX;
      const pointY = centerY + Math.sin(angle) * radiusY;
      if (point === 0) context.moveTo(pointX, pointY);
      else context.lineTo(pointX, pointY);
    }
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
  } else if (attempt) {
    let solveNumber = 0;
    for (let attemptIndex = 0; attemptIndex <= index; attemptIndex += 1) {
      if (result.attempts[attemptIndex]?.kind !== 'miss') solveNumber += 1;
    }
    drawSolvePattern(context, x, y, width, height, Math.min(solveNumber, 4), palette[(solveNumber - 1) % palette.length]);
  }

  context.fillStyle = attempt ? colors.ink : colors.soft;
  context.globalAlpha = attempt ? .88 : .55;
  context.font = '700 22px Arial, sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(String(index + 1).padStart(2, '0'), x + 14, y + 13);
  context.restore();
}

function drawShareCard(result = progress()) {
  const canvas = ui.shareCard;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const colors = { paper: '#f1f1e9', ink: '#24373f', soft: '#596b69', rule: '#a9b0aa' };
  const palette = PALETTES[puzzle.palette] || PALETTES.bottle;
  const random = seededRandom(hashString(`${puzzle.id}:${puzzle.date}:inkprint`));

  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.paper;
  context.fillRect(0, 0, width, height);
  drawPaperTexture(context, random, width, height);

  context.fillStyle = palette[0];
  context.fillRect(30, 30, width - 60, 184);
  context.strokeStyle = palette[0];
  context.lineWidth = 12;
  context.strokeRect(30, 30, width - 60, height - 60);
  context.strokeStyle = colors.ink;
  context.lineWidth = 3;
  context.strokeRect(48, 48, width - 96, height - 96);

  context.fillStyle = colors.paper;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = '900 88px Arial Black, Arial, sans-serif';
  context.fillText('INKLING', 70, 126);
  context.globalAlpha = .88;
  context.font = '700 24px Arial, sans-serif';
  context.fillText(shareDate().toUpperCase(), 74, 170);
  context.globalAlpha = 1;
  drawInkblot(context, random, 913, 122, palette);

  const paletteBandWidth = 936 / palette.length;
  palette.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(72 + index * paletteBandWidth, 226, paletteBandWidth + 1, 14);
  });

  context.fillStyle = colors.ink;
  context.font = '900 44px Arial Black, Arial, sans-serif';
  context.fillText('INKPRINT', 72, 286);
  context.textAlign = 'right';
  context.fillStyle = palette[0];
  context.font = '800 34px Arial, sans-serif';
  context.fillText(`#${puzzle.id}`, 1008, 284);
  context.textAlign = 'left';

  const cellWidth = 172;
  const cellHeight = 166;
  const gap = 18;
  const gridX = 72;
  const gridY = 334;
  for (let index = 0; index < MAX_GUESSES; index += 1) {
    const column = index % 5;
    const row = Math.floor(index / 5);
    drawShareCell(
      context,
      random,
      result,
      index,
      gridX + column * (cellWidth + gap),
      gridY + row * (cellHeight + gap),
      cellWidth,
      cellHeight,
      palette,
      colors
    );
  }

  const metrics = [
    ['PHRASES', `${result.solved.length}/${puzzle.phrases.length}`],
    ['GUESSES', `${result.attempts.length}/${MAX_GUESSES}`],
    ['TIME', elapsedTime(result)],
    ['HINTS', String(result.hints)]
  ];
  const metricWidth = 234;
  metrics.forEach(([label, value], index) => {
    const metricX = 72 + index * metricWidth;
    context.fillStyle = palette[index % palette.length];
    context.fillRect(metricX, 756, 56, 7);
    context.fillStyle = colors.soft;
    context.font = '800 20px Arial, sans-serif';
    context.fillText(label, metricX, 804);
    context.fillStyle = colors.ink;
    context.font = '900 42px Arial Black, Arial, sans-serif';
    context.fillText(value, metricX, 858);
  });

  context.strokeStyle = colors.rule;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(72, 910);
  context.lineTo(1008, 910);
  context.stroke();
  context.fillStyle = colors.ink;
  context.font = 'italic 700 25px Georgia, serif';
  context.fillText('Every word belongs somewhere.', 72, 959);
  context.fillStyle = colors.soft;
  context.textAlign = 'right';
  context.font = '700 20px Arial, sans-serif';
  context.fillText('jens246.github.io/inkling-daily-puzzle', 1008, 959);

  palette.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(72 + index * paletteBandWidth, 998, paletteBandWidth + 1, 18);
  });

  ui.shareCard.setAttribute(
    'aria-label',
    `Inkprint ${puzzle.id}: ${result.solved.length} of ${puzzle.phrases.length} phrases in ${result.attempts.length} guesses, ${result.hints} hints, ${shareDate()}`
  );
}

function canvasBlob() {
  return new Promise((resolve) => {
    ui.shareCard.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function clearShareDownload() {
  if (shareDownloadUrl) URL.revokeObjectURL(shareDownloadUrl);
  shareDownloadUrl = '';
  ui.shareDownload.removeAttribute('href');
}

function showShareFallback(blob, message = 'Direct image sharing is unavailable in this browser.') {
  clearShareDownload();
  ui.shareFallbackMessage.textContent = message;
  ui.shareText.value = resultText();
  ui.shareText.hidden = true;
  if (blob) {
    shareDownloadUrl = URL.createObjectURL(blob);
    ui.shareDownload.href = shareDownloadUrl;
    ui.shareDownload.download = `inkling-${puzzle.date}-inkprint.png`;
    ui.shareDownload.hidden = false;
  } else {
    ui.shareDownload.hidden = true;
  }
  ui.shareFallback.hidden = false;
}

function openSharePreview() {
  const result = progress();
  clearShareDownload();
  drawShareCard(result);
  shareCardBlobPromise = canvasBlob().catch(() => null);
  ui.shareFallback.hidden = true;
  ui.shareText.hidden = true;
  ui.shareConfirm.textContent = 'Share image';
  if (!ui.shareDialog.open) ui.shareDialog.showModal();
}

async function shareInkprintImage() {
  ui.shareConfirm.textContent = 'Preparing…';
  const blob = await shareCardBlobPromise;
  if (!blob) {
    showShareFallback(null, 'The Inkprint image could not be created in this browser.');
    ui.shareConfirm.textContent = 'Share image';
    return;
  }

  try {
    const file = typeof File === 'undefined'
      ? null
      : new File([blob], `inkling-${puzzle.date}-inkprint.png`, { type: 'image/png' });
    if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
      ui.shareConfirm.textContent = 'Sharing…';
      await navigator.share({
        title: `Inkling Inkprint #${puzzle.id}`,
        text: `${shareMetrics()} | ${shareDate()}\nhttps://jens246.github.io/inkling-daily-puzzle/`,
        files: [file]
      });
      ui.shareConfirm.textContent = 'Shared';
    } else if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      ui.shareConfirm.textContent = 'Image copied';
    } else {
      showShareFallback(blob);
      ui.shareConfirm.textContent = 'Share image';
      return;
    }
    window.setTimeout(() => { ui.shareConfirm.textContent = 'Share image'; }, 1400);
  } catch (error) {
    if (error?.name === 'AbortError') {
      ui.shareConfirm.textContent = 'Share image';
      return;
    }
    showShareFallback(blob, 'Your browser blocked direct sharing. Download the image or copy the text version.');
    ui.shareConfirm.textContent = 'Share image';
  }
}

async function copyShareText() {
  const text = resultText();
  try {
    await navigator.clipboard.writeText(text);
    ui.shareCopyText.textContent = 'Text copied';
    window.setTimeout(() => { ui.shareCopyText.textContent = 'Copy text instead'; }, 1400);
  } catch {
    ui.shareText.value = text;
    ui.shareText.hidden = false;
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
  document.body.dataset.inputActive = String(inputActive);
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
ui.submitButton.addEventListener('touchend', (event) => {
  if (touchSubmitLock || !ui.phraseInput.value.trim()) return;

  // Submit before Chrome dismisses its native keyboard and shifts the viewport.
  event.preventDefault();
  touchSubmitLock = true;
  ui.phraseForm.requestSubmit(ui.submitButton);
  ui.phraseInput.blur();
  settleVisibleViewport();
  window.setTimeout(() => {
    touchSubmitLock = false;
  }, 500);
}, { passive: false });
ui.submitButton.addEventListener('click', (event) => {
  // Some mobile browsers synthesize a click after touchend. The guess is already sent.
  if (touchSubmitLock) event.preventDefault();
});
ui.phraseInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  event.preventDefault();
  const hasPhrase = Boolean(ui.phraseInput.value.trim());
  ui.phraseForm.requestSubmit();
  if (hasPhrase) ui.phraseInput.blur();
});
ui.phraseInput.addEventListener('input', () => {
  const current = progress();
  if (!current.startedAt && ui.phraseInput.value.trim()) {
    writeProgress({ ...current, startedAt: new Date().toISOString() });
  }
  ui.feedback.textContent = '';
  ui.phraseForm.classList.remove('is-correct', 'is-wrong');
  syncCloudGuessSelection();
});
ui.phraseInput.addEventListener('focus', () => {
  renderGuessBuilder();
  settleVisibleViewport();
});
ui.phraseInput.addEventListener('blur', () => {
  window.setTimeout(renderGuessBuilder, 0);
  settleVisibleViewport();
});
ui.guessBuilder.addEventListener('click', (event) => {
  if (!event.target.closest('.guess-word')) ui.phraseInput.focus();
});
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
ui.shareButton.addEventListener('click', openSharePreview);
ui.shareClose.addEventListener('click', () => ui.shareDialog.close());
ui.shareDialog.addEventListener('click', (event) => {
  if (event.target === ui.shareDialog) ui.shareDialog.close();
});
ui.shareDialog.addEventListener('close', clearShareDownload);
ui.shareConfirm.addEventListener('click', shareInkprintImage);
ui.shareCopyText.addEventListener('click', copyShareText);
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
