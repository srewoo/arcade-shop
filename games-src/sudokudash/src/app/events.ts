// Routes session events to the views and audio.
import { playSfx } from '../audio';
import type { SessionEvent, Session } from '../session';
import type { Settings } from '../storage';
import { announce } from '../ui/announcer';
import { hideCoach } from '../ui/coach';
import { clockPopup, floatsOnBoard, scorePopup } from '../ui/popups';
import type { GameScreen } from './gameScreen';

export interface EventContext {
  readonly screen: GameScreen;
  readonly settings: Settings;
  readonly session: Session;
  readonly finish: () => void;
  readonly save: () => void;
}

export function routeEvent(e: SessionEvent, c: EventContext): void {
  switch (e.type) {
    case 'sfx':
      playSfx(e.name, c.settings.sound, c.settings.volume / 100);
      if (e.name === 'correct' || e.name === 'mistake' || e.name === 'note') hideCoach();
      break;
    case 'popup': {
      const cell = c.screen.board.cells[e.cell];
      // Penalties show once, as a pill on the HUD clock (see 'clock'); only gains float over the grid.
      if (cell && floatsOnBoard(e.good)) scorePopup(e.cell, cell.btn, e.text, e.good);
      break;
    }
    case 'clock': clockPopup(e.text, e.good); break;
    case 'mistake': c.screen.board.shake(e.cell); break;
    case 'house': c.screen.board.flash(e.cells); break;
    case 'announce': announce(e.text); break;
    case 'end': c.finish(); break;
    case 'change': c.screen.render(c.session); c.save(); break;
    case 'tick': break;
  }
}
