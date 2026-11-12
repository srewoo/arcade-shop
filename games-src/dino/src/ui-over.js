// Game-over card: title, quip, score, NEW BEST / UNRANKED tags, run summary, leaderboard form and list.
import { fetchTopScores, submitScore, loadNickname, saveNickname } from './leaderboard.js';
import { MODES } from './modes.js';
import { pickQuip } from './quips.js';
import { S, summaryLine } from './strings.js';
import { FLOW } from './tuning.js';

const el = (id) => document.getElementById(id);
const SAVE_ERRORS = {
  name: 'Try another name (2-16 letters or digits)',
  rate: 'Too many tries, wait a minute',
};

export class GameOverCard {
  constructor() {
    this.root = el('gameover');
    this.run = 0; // token invalidating in-flight leaderboard callbacks from a previous game-over
    this.focusTimer = 0;
  }

  /** @param info {title, score, newBest, killer, unlocked, ranked, summary:{dist,pickups,cleared,best,timeLimit}} */
  show({ title, score, newBest, killer, unlocked, ranked, reasons, summary, mode }) {
    el('over-title').textContent = title;
    const unlock = el('unlock');
    unlock.textContent = unlocked.length ? `SKIN UNLOCKED: ${unlocked.map((k) => k.label.toUpperCase()).join(', ')} (see Settings)` : '';
    unlock.classList.toggle('hidden', !unlocked.length);
    el('quip').textContent = pickQuip(title, killer);
    el('final-score').textContent = String(score);
    el('new-best').classList.toggle('hidden', !newBest);
    const tag = el('unranked');
    const showTag = Boolean(MODES[mode].board) && !ranked;
    tag.classList.toggle('hidden', !showTag);
    tag.textContent = showTag ? S.over.unranked : '';
    tag.title = showTag ? reasons.map((r) => S.over.unrankedWhy[r]).join(', ') : '';
    el('run-stats').textContent = summaryLine(summary);
    this.root.classList.remove('hidden');
    document.body.classList.add('is-over');
    // focus RUN IT BACK after a beat: a mashed Space must not restart the run by accident
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => this.root.classList.contains('hidden') || el('btn-restart').focus({ preventScroll: true }), FLOW.overFocusDelayS * 1000);
  }

  hide() {
    this.root.classList.add('hidden');
    document.body.classList.remove('is-over');
    clearTimeout(this.focusTimer);
    el('save').classList.add('hidden');
    el('board').classList.add('hidden');
    el('board-note').classList.add('hidden');
    this.run++;
  }

  /** True while the name field has focus (global hotkeys must be ignored). */
  get typing() {
    return document.activeElement === el('save-name');
  }

  _note(text, quiet = false) {
    const note = el('board-note');
    note.textContent = text;
    note.classList.toggle('hidden', !text);
    note.classList.toggle('quiet', quiet);
  }

  _renderBoard(res, myName, token) {
    if (token !== this.run || !res.top) return;
    el('save').classList.add('hidden');
    const rows = res.top.map((e, i) => [i + 1, e.name, e.ms, e.name === myName]);
    // player's own row appended when they ranked outside the visible top list
    if (myName && res.rank > res.top.length) rows.push([res.rank, myName, res.best, true]);
    el('board').replaceChildren(
      ...rows.map(([rank, name, score, me]) => {
        const li = document.createElement('li');
        if (me) li.className = 'me';
        for (const [cls, text] of [['p', rank], ['n', name], ['s', score]]) {
          const span = document.createElement('span');
          span.className = cls;
          span.textContent = text;
          li.appendChild(span);
        }
        return li;
      }),
    );
    el('board').classList.toggle('hidden', rows.length === 0);
  }

  /**
   * After game over: look up the board first.  Offline: say so and skip the name form.  Unranked (off-config) runs show
   * the board read-only.  Otherwise offer the name form for score >= 1 (SKIP shows the list).
   */
  async offerSave(score, mode, ranked) {
    const token = ++this.run;
    const board = MODES[mode].board;
    if (!board) return; // Zen: no leaderboard
    const top = await fetchTopScores(board);
    if (token !== this.run) return;
    if (top.error || !top.top) {
      this._note(S.over.offline, true); // offline-first: spoken to assistive tech, not shown
      return;
    }
    if (!ranked || score < 1) {
      this._renderBoard(top, null, token);
      return;
    }
    this._showForm(score, board, top, token);
  }

  _showForm(score, board, top, token) {
    const form = el('save'), input = el('save-name'), msg = el('save-msg'), send = el('save-send');
    input.value = loadNickname();
    msg.textContent = '';
    send.disabled = false;
    send.textContent = 'SAVE';
    form.classList.remove('hidden');
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      input.blur();
      send.disabled = true;
      msg.textContent = '';
      const res = await submitScore(input.value, score, board);
      if (token !== this.run) return;
      send.disabled = false;
      if (res.error) {
        msg.textContent = res.error === 'offline' ? S.over.offline : (SAVE_ERRORS[res.error] ?? S.over.saveFailed);
        send.textContent = S.over.retry;
      } else {
        saveNickname(res.name);
        this._renderBoard(res, res.name, token);
      }
    };
    el('save-skip').onclick = () => {
      input.blur();
      form.classList.add('hidden');
      this._renderBoard(top, null, token);
    };
  }
}
