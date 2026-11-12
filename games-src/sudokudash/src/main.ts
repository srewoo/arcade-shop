import './style.css';
import './board.css';
import './game.css';
import './overlays.css';
import './fx.css';
import './art.css';
import { App } from './app/app';

const app = new App();
app.start();

// Debug handle for automated checks, only with ?debug=1.
if (new URLSearchParams(location.search).get('debug') === '1') {
  (window as unknown as { __sudokudash?: unknown }).__sudokudash = app.debugHandle();
}
