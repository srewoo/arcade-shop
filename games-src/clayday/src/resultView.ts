// Builds the end-of-round summary shown in the result overlay.
import { ratingFor } from './rounds';
import type { Session, Verdict } from './session';
import type { Round } from './sim';
import { starsFor, tierFor } from './visuals';
import { RATING_NAMES, S, hitsOf, outcomeNote } from './strings';
import type { ResultView } from './ui/screens';

export function buildResultView(round: Round, verdict: Verdict, session: Session): ResultView {
  const r = round.result!;
  const rows: [string, string][] = [['Hits', hitsOf(r.hits, r.total)]];
  if (round.params.passHits > 0) rows.push(['Needed', String(round.params.passHits)]);
  rows.push(['Shells fired', String(r.shotsFired)], ['Doubles', String(r.doubles)], ['Best streak', String(r.bestStreak)]);
  rows.push(['Round score', String(r.score)]);
  if (r.timeBonus > 0) rows.push(['Time bonus', `+${r.timeBonus}`]);
  if (r.perfectBonus > 0) rows.push(['Perfect bonus', `+${r.perfectBonus}`]);
  if (verdict !== 'practice') rows.push([S.runScore, String(session.runScore)]);
  const title = verdict === 'next' ? S.passed : verdict === 'over' ? S.failed : S.practiceDone;
  const nextLabel = verdict === 'next' ? S.nextRound : verdict === 'over' ? S.tryAgain : S.again;
  const rid = ratingFor(r.hits, r.total);
  return {
    hits: r.hits, total: r.total, stars: starsFor(rid), tier: tierFor(rid),
    title, rows, nextLabel,
    rating: `★ ${RATING_NAMES[rid]}`,
    big: `${r.hits} / ${r.total}`,
    note: outcomeNote(r.outcome),
  };
}
