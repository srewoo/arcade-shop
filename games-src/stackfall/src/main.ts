import './style.css';
import './layout.css';
import { App } from './app';

/** Debug hooks only with ?debug=1 (a bare ?debug still works) or in dev builds. */
function debugEnabled(): boolean {
  const v = new URLSearchParams(location.search).get('debug');
  return import.meta.env.DEV || v === '1' || v === '';
}

const app = new App();
if (debugEnabled()) (window as unknown as { __stackfall: unknown }).__stackfall = app.debugHandle();
