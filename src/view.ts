import { GENRE_LABELS, thumbPath, type Game } from './catalogue';
import { h } from './dom';

export interface CardHandlers {
  readonly onPlay: (id: string) => void;
  readonly onFavourite: (id: string) => void;
}

const STAR = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';

function starButton(game: Game, favourite: boolean, onFavourite: (id: string) => void): HTMLButtonElement {
  const btn = h('button', {
    type: 'button',
    class: 'fav',
    'aria-pressed': String(favourite),
    'aria-label': `${favourite ? 'Remove' : 'Add'} ${game.title} ${favourite ? 'from' : 'to'} favourites`,
    title: favourite ? 'Remove from favourites' : 'Add to favourites',
  });
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg>`;
  btn.addEventListener('click', () => onFavourite(game.id));
  return btn;
}

/** One game: a play button (stretched over the card) plus a separate favourite toggle. */
export function gameCard(game: Game, favourite: boolean, on: CardHandlers): HTMLElement {
  const img = h('img', { src: thumbPath(game.id), alt: '', width: '480', height: '300', loading: 'lazy', decoding: 'async' });
  const play = h('button', { type: 'button', class: 'play', 'data-game': game.id, 'aria-label': `Play ${game.title}` }, [
    h('span', { class: 'title', text: game.title }),
  ]);
  play.addEventListener('click', () => on.onPlay(game.id));
  const card = h('article', { class: 'card', 'data-genre': game.genre }, [
    h('div', { class: 'thumb' }, [img]),
    h('div', { class: 'body' }, [
      play,
      h('span', { class: 'genre', text: GENRE_LABELS[game.genre] }),
      h('p', { class: 'pitch', text: game.pitch }),
    ]),
    starButton(game, favourite, on.onFavourite),
  ]);
  card.style.setProperty('--accent', game.accent);
  return card;
}

/** Compact chip for the "Continue playing" row. */
export function recentChip(game: Game, onPlay: (id: string) => void): HTMLButtonElement {
  const btn = h('button', { type: 'button', class: 'chip', 'data-game': game.id, 'aria-label': `Play ${game.title} again` }, [
    h('img', { src: thumbPath(game.id), alt: '', width: '48', height: '30', decoding: 'async' }),
    h('span', { text: game.title }),
  ]);
  btn.style.setProperty('--accent', game.accent);
  btn.addEventListener('click', () => onPlay(game.id));
  return btn;
}
