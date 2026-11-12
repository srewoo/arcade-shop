// Navigation between menu, level select and play.
import { BRIDGE_LEVELS, RAFT_LEVELS, levelsOf } from '../levels';
import { dailyLevel } from '../puzzle/generate';
import { totalStars } from '../progress';
import { createSession } from '../session';
import { readFlag } from '../storage';
import { S } from '../strings';
import { confirmAction } from '../ui/dialogs';
import { buildLevelSelect, buildMenu, type PackChoice } from '../ui/menu';
import { onboardKey, refresh, say, type App } from './app';

const totals = (app: App): Record<PackChoice, { levels: number; stars: number }> => ({
  bridge: { levels: BRIDGE_LEVELS.length, stars: totalStars(app.progress, BRIDGE_LEVELS.map((l) => l.id)) },
  raft: { levels: RAFT_LEVELS.length, stars: totalStars(app.progress, RAFT_LEVELS.map((l) => l.id)) },
  daily: { levels: 1, stars: 0 },
});

export function showMenu(app: App): void {
  window.clearTimeout(app.resultTimer);
  app.ctx = null;
  app.session = null;
  buildMenu(app.shell.menu, { choose: (p) => choose(app, p), help: () => app.dlg.help.open(), settings: app.openSettings }, totals(app));
  app.shell.show('menu');
  app.shell.menu.querySelector<HTMLElement>('.pack-card')?.focus();
}

export function choose(app: App, pack: PackChoice): void {
  if (pack === 'daily') {
    app.ctx = { pack, levels: [dailyLevel(new Date())], index: 0 };
    go(app, 0);
    return;
  }
  app.ctx = { pack, levels: levelsOf(pack), index: 0 };
  showLevels(app);
}

export function showLevels(app: App): void {
  window.clearTimeout(app.resultTimer);
  const c = app.ctx;
  if (!c || c.pack === 'daily') return showMenu(app);
  const title = S.packs[c.pack].name;
  buildLevelSelect(app.shell.levels, title, c.levels, app.progress, { pick: (i) => go(app, i), back: () => showMenu(app) });
  app.session = null;
  app.shell.show('levels');
  app.shell.levels.querySelector<HTMLElement>('.tile')?.focus();
}

export function go(app: App, index: number): void {
  const level = app.ctx?.levels[index];
  if (!app.ctx || !level) return showLevels(app);
  window.clearTimeout(app.resultTimer);
  app.ctx.index = index;
  app.session = createSession(level);
  app.hint = [];
  app.hud.setRules(level);
  app.scene.mount(level);
  app.hud.showOnboard(readFlag(onboardKey(app)) ? null : S.onboard[level.pack]);
  app.shell.show('play');
  refresh(app, false);
  app.hud.status(S.status.start);
  say(app, `${level.title}.${level.limit !== null ? ` Limit ${level.limit} minutes.` : ''}`);
}

/** Leave the level; asks first when progress would be lost. */
export async function quit(app: App): Promise<boolean> {
  const s = app.session;
  const nothingToLose = !s || (s.log().length === 0 && s.outcome() === 'playing') || s.outcome() === 'won';
  if (!nothingToLose && !(await confirmAction(S.confirm.quit, S.pause.quit))) return false;
  showLevels(app);
  return true;
}
