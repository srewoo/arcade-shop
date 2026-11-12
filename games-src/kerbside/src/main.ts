import './style/tokens.css';
import './style/base.css';
import './style/game.css';
import './style/panels.css';
import { App } from './app';
import { S } from './strings';
import { exposeDebug } from './debug';
import { el } from './ui/dom';
import { wire } from './wiring';

el('tagline').textContent = S.tagline;
const app = new App();
wire(app);
exposeDebug(app);
