// End-of-run bookkeeping: personal bests, the Daily log and the shareable result.
import { loadBests, recordResult, saveBests, type Bests, type Records } from '../bests';
import { dailyDone, dailyStreak, loadDailyLog, recordDaily, saveDailyLog, shareText, type DailyLog } from '../daily';
import { dateKey } from '../core/rng';
import type { Session } from '../session';
import type { Settings } from '../storage';
import type { TitleInfo } from '../ui/title';

export class Results {
  bests: Bests = loadBests();
  private daily: DailyLog = loadDailyLog();
  shareString = '';

  titleInfo(settings: Settings, hasSaved: boolean): TitleInfo {
    const today = dateKey();
    return { hasSaved, dailyDone: dailyDone(this.daily, today, settings.difficulty), streak: dailyStreak(this.daily, today) };
  }

  /** Stores records for a finished run; `canShare` says whether to offer "Copy result". */
  finish(s: Session): { rec: Records; canShare: boolean } {
    let rec: Records = { newTime: false, newScore: false };
    if (s.eligibleForRecords) {
      const res = recordResult(this.bests, s.difficulty, s.mode, s.elapsedMs, s.finalScore);
      this.bests = res.bests;
      saveBests(this.bests);
      rec = { newTime: res.newTime, newScore: res.newScore };
    }
    return { rec, canShare: this.recordDaily(s) };
  }

  private recordDaily(s: Session): boolean {
    if (!s.daily || !s.eligibleForRecords) return false;
    const result = { mode: s.mode, score: s.finalScore, timeMs: Math.round(s.elapsedMs), mistakes: s.mistakes };
    this.daily = recordDaily(this.daily, s.daily, s.difficulty, result);
    saveDailyLog(this.daily);
    this.shareString = shareText(s.daily, s.difficulty, s.mode, result, s.game.puzzle, s.mistakeCells);
    return true;
  }
}
