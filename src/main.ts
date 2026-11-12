import './style.css';
import { GAMES, GENRES, GENRE_LABELS, findGame } from './catalogue';
import { byId, h } from './dom';
import { filterGames, type Shelf } from './filter';
import { openArcade, openGame, type LaunchEnv } from './launch';
import { PREFS_KEY, loadPrefs, markPlayed, savePrefs, toggleFavourite, type Prefs } from './prefs';
import { gameCard, recentChip } from './view';

const isPopup = document.body.dataset.mode === 'popup';
const known = new Set(GAMES.map((g) => g.id));
const env: LaunchEnv = { chrome: typeof chrome === 'undefined' ? undefined : chrome, open: (u) => window.open(u, '_blank', 'noopener') };
const SHELVES: readonly Shelf[] = ['all', 'favourites', ...GENRES];
const shelfLabel = (s: Shelf): string => (s === 'all' ? 'All' : s === 'favourites' ? 'Favourites' : GENRE_LABELS[s]);

let prefs: Prefs = loadPrefs(localStorage, known);
let shelf: Shelf = 'all';
const search = byId<HTMLInputElement>('search');

function update(next: Prefs): void {
  prefs = next;
  savePrefs(localStorage, prefs);
  render();
}

async function play(id: string): Promise<void> {
  update(markPlayed(prefs, id));
  await openGame(id, env);
  if (isPopup) window.close();
}

function favourite(id: string): void {
  const hadFocus = document.activeElement?.classList.contains('fav') ?? false;
  update(toggleFavourite(prefs, id));
  // The grid is rebuilt; keep keyboard focus on the same star (or the search box if the card left the shelf).
  if (!hadFocus) return;
  const star = document.querySelector<HTMLElement>(`.play[data-game="${id}"]`)?.closest('.card')?.querySelector<HTMLElement>('.fav');
  (star ?? search).focus();
}

function renderShelves(): void {
  const bar = byId('shelves');
  bar.replaceChildren(
    ...SHELVES.map((s) => {
      const btn = h('button', { type: 'button', 'aria-pressed': String(s === shelf), text: shelfLabel(s) });
      btn.addEventListener('click', () => ((shelf = s), render()));
      return btn;
    }),
  );
}

function renderRecent(): void {
  const row = byId('recent');
  const games = prefs.recent.map(findGame).filter((g) => g !== undefined);
  row.hidden = games.length === 0 || shelf !== 'all' || search.value.trim() !== '';
  byId('recent-list').replaceChildren(...games.map((g) => recentChip(g, (id) => void play(id))));
}

function render(): void {
  renderShelves();
  renderRecent();
  const list = filterGames(GAMES, { query: search.value, shelf, favourites: prefs.favourites });
  const handlers = { onPlay: (id: string) => void play(id), onFavourite: favourite };
  byId('grid').replaceChildren(...list.map((g) => gameCard(g, prefs.favourites.includes(g.id), handlers)));
  const empty = byId('empty');
  empty.hidden = list.length > 0;
  empty.textContent = shelf === 'favourites' && !search.value ? 'No favourites yet. Tap the star on a game to pin it here.' : 'No games match that search.';
  byId('count').textContent = `${list.length} of ${GAMES.length} games`;
}

function boot(): void {
  search.addEventListener('input', render);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.querySelector<HTMLButtonElement>('#grid .play')?.click();
    if (e.key === 'Escape' && search.value) (search.value = ''), render();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== search) (e.preventDefault(), search.focus());
  });
  document.getElementById('open-arcade')?.addEventListener('click', async () => {
    await openArcade(env);
    window.close();
  });
  // Another launcher tab (or the popup) changed favourites/recents.
  window.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== PREFS_KEY) return;
    prefs = loadPrefs(localStorage, known);
    render();
  });
  render();
  if (isPopup) search.focus();
}

boot();
