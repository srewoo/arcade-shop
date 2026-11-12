// Game-over payoff on the lane: a final-score banner and confetti, played before the results card opens.
// Reduced motion keeps the banner (a plain fade) and drops the confetti inside the particle system.
import type { AudioEngine } from './audio';
import { showBanner } from './bannerView';
import type { Game } from './game';
import { confetti } from './particles';
import { createRng } from './rng';
import { matchScore } from './match';
import { resultTier, type ResultTier } from './resultsText';
import { S } from './strings';

export function playFinale(game: Game, audio: AudioEngine): ResultTier {
  const { match } = game;
  const tier = resultTier(match);
  const best = Math.max(0, ...match.players.map((_, i) => matchScore(match, i)));
  showBanner({ text: S.finalScore(best), kind: tier.level >= 4 ? 'turkey' : tier.big ? 'strike' : 'spare' });
  if (tier.big) {
    confetti(game.pres.particles, createRng(best + 17), game.pres.size.w, game.pres.size.h);
    audio.crowd();
  }
  return tier;
}
