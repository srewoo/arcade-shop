import './style/tokens.css';
import './style/base.css';
import './style/hud.css';
import './style/panels.css';
import { installAudioUnlock } from './audio';
import { installDebug, isDebug, seedFromQuery } from './debug';
import { Game } from './game';
import { loadSettings } from './settings';
import { S } from './strings';
import { byId } from './ui/dom';
import { installTrap, setBackground } from './ui/overlay';

function fillCopy(): void {
  byId('tagline').textContent = S.tagline;
  const list = byId('howto-list');
  list.replaceChildren(...S.howToBody.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  byId('howto-keys').textContent = S.keys;
}

fillCopy();
installAudioUnlock();
installTrap();
setBackground([byId('app')]);
const debug = isDebug();
const game = new Game(loadSettings(), debug ? seedFromQuery() : null);
if (debug) installDebug(game);
