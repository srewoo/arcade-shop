import { beforeEach, describe, expect, it, vi } from 'vitest';

const openDialog = vi.fn();
const confirmAction = vi.fn();
const buildLevelGrid = vi.fn(() => null);
vi.mock('../src/audio', () => ({ emit: vi.fn() }));
vi.mock('../src/storage', () => ({ readFlag: () => true, writeFlag: vi.fn() }));
vi.mock('../src/ui/dialogs', () => ({ openDialog, closeDialog: vi.fn(), confirmAction }));
vi.mock('../src/ui/overlay', () => ({ isOverlayOpen: () => false }));
vi.mock('../src/ui/screens', () => ({ buildLevelGrid, refreshTitle: vi.fn(), showScreen: vi.fn() }));
vi.mock('../src/ui/dom', () => ({ el: () => ({ focus: vi.fn(), textContent: '', hidden: false }) }));

const { Nav } = await import('../src/nav');
const { newGame, play } = await import('../src/game');
const { LEVELS } = await import('../src/levels');

vi.stubGlobal('document', { querySelector: () => null });

function setup(solved: boolean) {
  let game = newGame(LEVELS[0]!);
  if (solved) game = play(game, { kind: 'fill', jug: 0 });
  const ctx = { screen: 'play', game, quick: null } as never;
  const ctl = { cancelPendingWin: vi.fn(), restart: vi.fn() };
  return { nav: new Nav(ctx, () => ctl as never), ctl };
}

describe('leaving or pausing during the win delay', () => {
  beforeEach(() => vi.clearAllMocks());
  it('leaving to the level list or title cancels the pending win sheet', () => {
    const { nav, ctl } = setup(true);
    nav.toLevels();
    nav.toTitle();
    expect(ctl.cancelPendingWin).toHaveBeenCalledTimes(2);
  });
  it('pause is refused once the level is solved, allowed while live', () => {
    setup(true).nav.openPause();
    expect(openDialog).not.toHaveBeenCalled();
    setup(false).nav.openPause();
    expect(openDialog).toHaveBeenCalledWith('pause-overlay', expect.any(Function), 'pause-resume');
  });
  it('restart of a solved level skips the confirm and restarts directly', () => {
    const { nav, ctl } = setup(true);
    nav.askRestart();
    expect(confirmAction).not.toHaveBeenCalled();
    expect(ctl.restart).toHaveBeenCalled();
  });
});
