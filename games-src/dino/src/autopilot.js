// Autoplay bot (bundle class `Qm`, toggled with `A` or `?auto`).
//
// For the next obstacle it computes time-to-contact windows and decides to jump / duck "cleanly".  To look
// human (and keep demos entertaining) it deliberately blunders once `runTime >= failAt`, where failAt is random
// in TUNING.autoFailEvery seconds, by picking a mistake style valid for that obstacle's required action.
import { TUNING, AIR_TIME } from './config.js';
import { pick, rand } from './util.js';
import { shouldAirJump } from './autopilotMath.js';

/** Allowed blunder styles per required action. 'none' (high ptero) can only be "wrongly" jumped. */
const MISTAKE_STYLES = { jump: ['none', 'late', 'early', 'duck'], duck: ['none', 'jump'], none: ['jump'] };

export class Autopilot {
  constructor() {
    this.noFail = false; // debug: never blunder
    this.reset();
  }

  reset() {
    this.failAt = rand(TUNING.autoFailEvery[0], TUNING.autoFailEvery[1]);
    this.plan = null; // {ob, style} blunder committed for one obstacle
  }

  /**
   * @param game state (needs z, y, vy, speed, runTime, grounded, canDouble, airJumps, airTime)
   * @param field ObstacleField
   * @returns {{jump:boolean,duck:boolean,airJump:boolean}} airJump = spend a Double Jump charge now
   */
  update(game, field) {
    const out = { jump: false, duck: false, airJump: false };
    const ob = field.next(game.z);
    if (!ob) return out;
    const closing = game.speed + ob.vz;
    // z decreases in the direction of travel; the obstacle's near face is at ob.z + hz, its far face at ob.z - hz.
    const tFront = (game.z - ob.z) / closing; // time until the player's origin reaches the obstacle centre
    const tNose = (game.z - 2.3 - (ob.z + ob.hz)) / closing; // time until the snout (~2.3 ahead of origin) reaches the near face
    const tTail = (game.z + 0.7 - (ob.z - ob.hz)) / closing; // time until the tail (~0.7 behind origin) passes the far face
    if (this.plan && this.plan.ob !== ob) this.plan = null;
    if (!this.noFail && !this.plan && game.runTime >= this.failAt && tFront > 0.8) {
      this.plan = { ob, style: pick(MISTAKE_STYLES[ob.action]) };
    }
    const style = this.plan ? this.plan.style : 'clean';
    let jumpWithin = null; // jump when time-to-contact <= this
    switch (style) {
      case 'clean':
        if (ob.action === 'jump') jumpWithin = AIR_TIME / 2; // apex over the obstacle centre
        else if (ob.action === 'duck') out.duck = tNose < 0.3 && tTail > -0.05; // duck from 0.3 s before the snout arrives until the tail has passed
        break;
      case 'late':
        jumpWithin = 0.1;
        break;
      case 'early':
        jumpWithin = AIR_TIME / 2 + 0.36;
        break;
      case 'duck':
        out.duck = tNose < 0.45; // mistake: ducks (when it should jump) from 0.45 s before contact
        break;
      case 'jump':
        jumpWithin = ob.action === 'none' ? AIR_TIME / 2 : 0.16;
        break;
    }
    if (jumpWithin !== null && game.grounded && tFront > 0 && tFront <= jumpWithin) out.jump = true;
    out.airJump = this._wantsAirJump(game, ob, closing);
    return out;
  }

  /**
   * Double Jump rescue: while airborne with a charge, if the current arc would clip a jump-type obstacle
   * (early / late / blundered jump), spend the second jump at the last moment that still clears it.
   * The body box spans 0.8 ahead of / 0.55 behind the dino origin (DinoRig.hitboxes).
   */
  _wantsAirJump(game, ob, closing) {
    if (!game.canDouble || game.grounded || game.airJumps <= 0 || game.airTime < 0.12 || ob.action !== 'jump') return false;
    const t0 = (game.z - 0.8 - (ob.z + ob.hz)) / closing;
    const t1 = (game.z + 0.55 - (ob.z - ob.hz)) / closing;
    if (t1 < 0) return false;
    return shouldAirJump({ y: game.y, vy: game.vy, t0, t1, y1: ob.y1 });
  }
}
