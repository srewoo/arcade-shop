// Title screen (pack choice) and the level-select grid.
import { S } from '../strings';
import { totalStars, type Progress } from '../progress';
import type { Level } from '../puzzle/types';
import { carrierSvg, figureSvg } from '../art/figures';
import { createStars } from '../art/sky';
import { firefliesHtml, glitterSvg, skylineSvg, waterSvg } from '../art/backdrop';
import { h, svgFrom } from './dom';

export type PackChoice = 'bridge' | 'raft' | 'daily';

export interface MenuHandlers {
  choose(pack: PackChoice): void;
  help(): void;
  settings(): void;
}

const PACKS: readonly PackChoice[] = ['bridge', 'raft', 'daily'];

const ART: readonly (readonly [number, string, number, number])[] = [
  [0, 'courier', 6, 0], [2, 'baker', 15, 0], [1, 'tinker', 36, 1], [3, 'porter', 54, 1], [6, 'elder', 84, 0],
];

function menuArt(): HTMLElement {
  const figs = ART.map(([i, art, x, onDeck]) => {
    const f = h('span', { class: 'ma-fig', style: `left:${x}%;--fig:var(--fig-${i});bottom:${onDeck ? 'calc(40% - 0.6rem)' : '40%'}` });
    f.append(svgFrom(figureSvg(art as never, i)));
    return f;
  });
  const lamp = h('span', { class: 'ma-lamp' });
  lamp.append(svgFrom(carrierSvg('bridge')));
  const flies = h('div', { class: 'fireflies', 'aria-hidden': 'true' });
  flies.innerHTML = firefliesHtml(8, 12);
  const river = h('i', { class: 'ma-river' }, h('span', { class: 'water' }, svgFrom(waterSvg())), svgFrom(glitterSvg()));
  const deck = h('i', { class: 'ma-deck' }, h('i', { class: 'rail back' }));
  return h('div', { class: 'menu-art', 'aria-hidden': 'true' }, svgFrom(createStars(5)), h('i', { class: 'moon' }), svgFrom(skylineSvg()), h('div', { class: 'ma-ground' }, h('i', { class: 'ma-bank' }), river, h('i', { class: 'ma-bank' })), deck, ...figs, lamp, flies, h('i', { class: 'vignette' }));
}

export function buildMenu(host: HTMLElement, hd: MenuHandlers, counts: Record<PackChoice, { levels: number; stars: number }>): void {
  const cards = PACKS.map((p) => {
    const info = counts[p];
    const meta = p === 'daily' ? '1 puzzle a day' : `${info.stars} of ${info.levels * 3} stars`;
    const b = h('button', { class: `pack-card ${p}`, type: 'button', 'data-pack': p }, h('b', { text: S.packs[p].name }), h('span', { text: S.packs[p].blurb }), h('small', { text: meta }));
    b.addEventListener('click', () => hd.choose(p));
    return b;
  });
  const help = h('button', { class: 'btn', type: 'button', text: S.menu.help });
  const settings = h('button', { class: 'btn', type: 'button', text: S.menu.settings });
  help.addEventListener('click', hd.help);
  settings.addEventListener('click', hd.settings);
  host.replaceChildren(
    h('h2', { class: 'hero', text: S.title }),
    h('p', { class: 'tagline', text: S.tagline }),
    h('div', { class: 'packs' }, ...cards),
    h('div', { class: 'row center' }, help, settings),
    menuArt(),
  );
}

export function starsText(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

export function buildLevelSelect(
  host: HTMLElement,
  title: string,
  levels: readonly Level[],
  progress: Progress,
  hd: { pick(i: number): void; back(): void },
): void {
  const back = h('button', { class: 'btn ghost', type: 'button', text: S.menu.back });
  back.addEventListener('click', hd.back);
  const earned = totalStars(progress, levels.map((l) => l.id));
  const tiles = levels.map((l, i) => {
    const stars = progress[l.id]?.stars ?? 0;
    const label = `Level ${i + 1}, ${l.title}, ${l.actors.length} ${l.pack === 'bridge' ? 'travellers' : 'characters'}, ${S.stars(stars)}`;
    const t = h('button', { class: 'tile', type: 'button', 'data-level': l.id, 'aria-label': label }, h('b', { text: i + 1 }), h('span', { class: 'stars', 'aria-hidden': 'true', text: starsText(stars) }), h('small', { 'aria-hidden': 'true', text: `${l.actors.length} ppl` }));
    t.addEventListener('click', () => hd.pick(i));
    return t;
  });
  host.replaceChildren(
    h('div', { class: 'row between' }, back, h('p', { class: 'earned', text: `${earned} of ${levels.length * 3} stars` })),
    h('h2', { class: 'lvl-head', text: title }),
    h('div', { class: 'grid' }, ...tiles),
  );
}
