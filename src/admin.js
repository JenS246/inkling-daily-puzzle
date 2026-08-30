import { puzzles } from './puzzles.js?v=20260830a';

const games = [...puzzles].sort((a, b) => a.date.localeCompare(b.date));
const container = document.querySelector('#games');
const count = document.querySelector('#game-count');

count.textContent = `${games.length} games`;

for (const game of games) {
  const section = document.createElement('section');
  section.id = `game-${game.id}`;

  const heading = document.createElement('h2');
  heading.textContent = `#${game.id} · ${game.date}`;

  const phrases = document.createElement('ol');
  for (const { answer } of game.phrases) {
    const item = document.createElement('li');
    item.textContent = answer;
    phrases.append(item);
  }

  section.append(heading, phrases);
  container.append(section);
}
