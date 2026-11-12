// Turns simulation events into sound, particles, callouts and screen-reader lines.
import { emit } from './audio';
import type { SimEvent } from './events';
import type { Fx } from './fx';
import { S } from './strings';

export interface FeedbackSink {
  readonly fx: Fx;
  say(text: string): void;
  callout(text: string): void;
  aim(): { x: number; y: number };
}

export function handleEvent(ev: SimEvent, sink: FeedbackSink): void {
  switch (ev.type) {
    case 'pull':
      emit('pull');
      sink.callout(S.pull);
      sink.say(S.pull);
      break;
    case 'launch':
      emit('launch');
      break;
    case 'shot':
      emit('shot');
      sink.fx.shot(ev.x, ev.y);
      break;
    case 'break': {
      emit('crack');
      sink.fx.breakClay(ev.x, ev.y, ev.kind);
      sink.fx.float(ev.x, ev.y - 12, `+${ev.points}`, ev.mult > 1);
      if (ev.streak >= 3) emit('combo', 0.06);
      sink.say(`${S.hitWord} +${ev.points}`);
      break;
    }
    case 'miss':
      emit('thud');
      sink.fx.dust(ev.x, ev.y);
      sink.say('Missed');
      break;
    case 'double':
      emit('double', 0.1);
      sink.fx.float(ev.x, ev.y - 46, `${S.doubleCall} +${ev.points}`, true);
      sink.say(`${S.doubleCall} +${ev.points}`);
      break;
    case 'dry':
      emit('dry');
      break;
    case 'reload':
      emit('reload');
      break;
    case 'loaded':
      emit('loaded');
      break;
    case 'lowtime':
      emit('tick');
      break;
    case 'end':
      break;
  }
}
