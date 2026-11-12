// Rack Attack: arcade timed racks.
import { CUE_START } from '../constants';
import type { Game } from '../game';
import type { Hud, ModeCtl } from '../gameTypes';
import { rackLayout } from '../layouts';
import { applyRackShot, crossedTick, initialRack, nextRack, tickRack } from '../rack';
import type { ShotReport } from '../sim';
import { STR } from '../strings';

export class RackMode implements ModeCtl {
  readonly state = initialRack();
  private pots = 0;
  private shotCount = 0;
  constructor(private readonly g: Game) {}

  start(): void { this.g.setBalls(rackLayout(this.state.rack)); }
  humanTurn(): boolean { return true; }

  tick(dt: number): void {
    if (this.g.phase === 'over') return;
    const before = this.state.time;
    tickRack(this.state, dt);
    if (this.state.over) this.finish();
    else if (crossedTick(before, this.state.time)) this.g.emit({ t: 'sfx', name: 'tick' });
  }

  onShot(): void { this.state.started = true; }
  clock(): number | null { return this.state.started ? this.state.time : null; }
  targets(): number[] { return this.g.balls.filter((b) => b.id !== 0 && !b.pocketed).map((b) => b.id); }
  highlight(): number[] { return []; }

  onShotEnd(r: ShotReport): void {
    const remaining = this.g.balls.filter((b) => b.id !== 0 && !b.pocketed).length;
    this.pots += r.potted.length; this.shotCount++;
    const out = applyRackShot(this.state, r.potted.length, r.cuePotted, remaining, r.firstHit === null);
    if (r.cuePotted) this.g.respawnCue(CUE_START.x, CUE_START.y);
    out.texts.forEach((t) => this.g.say(t, /Miss|Scratch|No contact/.test(t) ? 'bad' : 'good'));
    if (this.state.combo >= 2) this.g.emit({ t: 'combo', level: this.state.combo });
    if (this.state.over) { this.finish(); return; }
    if (out.cleared) {
      this.g.emit({ t: 'sfx', name: out.sweep ? 'sweep' : 'rackClear' });
      nextRack(this.state);
      this.g.setBalls(rackLayout(this.state.rack));
    }
  }

  private finish(): void {
    this.g.phase = 'over';
    const s = this.state;
    this.g.emit({
      t: 'over',
      info: {
        mode: 'rack', won: false, title: STR.timeUp, score: s.score, rack: s.rack, pots: this.pots, shotsTaken: this.shotCount, bestCombo: s.bestCombo,
        detail: `Score ${s.score} · reached rack ${s.rack} · best combo x${s.bestCombo}`,
      },
    });
  }

  hud(): Hud {
    const s = this.state;
    return {
      stats: [
        { label: 'Time', value: s.time.toFixed(1) + 's' },
        { label: 'Score', value: String(s.score) },
        { label: 'Rack', value: String(s.rack) },
        { label: 'Combo', value: s.combo > 1 ? `x${s.combo}` : '-' },
      ],
      status: s.started ? STR.rackStatus : STR.rackStatusWaiting,
    };
  }
}
