// Trick Shots: hand-made puzzles with a shot limit and 1-3 stars.
import type { Game } from '../game';
import type { Hud, ModeCtl } from '../gameTypes';
import type { ShotReport } from '../sim';
import { STR } from '../strings';
import { TRICKS, trickBalls, trickStars } from '../tricks';

export class TrickMode implements ModeCtl {
  private shots = 0;
  private readonly layout;
  constructor(private readonly g: Game, private readonly index: number) {
    this.layout = TRICKS[Math.min(Math.max(index, 0), TRICKS.length - 1)]!;
  }

  start(): void { this.g.setBalls(trickBalls(this.layout)); }
  humanTurn(): boolean { return true; }
  tick(): void { /* untimed */ }
  targets(): number[] { return this.g.balls.filter((b) => b.id !== 0 && !b.pocketed).map((b) => b.id); }
  highlight(): number[] { return []; }

  private remaining(): number { return this.g.balls.filter((b) => b.id !== 0 && !b.pocketed).length; }

  onShotEnd(r: ShotReport): void {
    this.shots++;
    if (r.cuePotted) {
      this.g.respawnCue(this.layout.cue[0], this.layout.cue[1]);
      this.g.say('Scratch', 'bad');
    }
    if (this.remaining() === 0) {
      const stars = trickStars(this.layout, this.shots, true);
      this.finish(true, STR.trickWon(this.shots, this.layout.par), stars);
    } else if (this.shots >= this.layout.limit) {
      this.finish(false, STR.trickLost(this.remaining(), this.layout.par, this.layout.limit), 0);
    }
  }

  private finish(won: boolean, detail: string, stars: number): void {
    this.g.phase = 'over';
    this.g.emit({
      t: 'over',
      info: { mode: 'trick', won, title: won ? 'Puzzle solved!' : 'Out of shots', detail, trick: this.index, stars, par: this.layout.par, shots: this.shots },
    });
  }

  hud(): Hud {
    return {
      stats: [
        { label: 'Puzzle', value: `${this.index + 1}. ${this.layout.name}` },
        { label: 'Shots', value: `${this.shots}/${this.layout.limit}` },
        { label: 'Par', value: String(this.layout.par) },
        { label: 'Balls left', value: String(this.remaining()) },
      ],
      status: this.layout.hint,
    };
  }
}
