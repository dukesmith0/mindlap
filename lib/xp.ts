// JS mirror of the XP rules in migration 0008's process_submission().
// The SQL fn is the source of truth. This module exists so we can
// (a) test the rule set independently, (b) preview an XP gain client-side
// before the RPC returns, (c) keep the SQL and TS in lockstep via tests.
//
// Source rules (decisions.md, 2026-04-28):
//   participation = 5 xp/play, capped 5/(user, game, PT date)
//   daily PB     = 25 xp once per (user, game, PT date) on a new daily best
//   streak mult  = min(1 + 0.1*(streak-1), 2.5), applied to PB only
//   2x mult      = double for the day's daily-bonus games, applied to both

export const PARTICIPATION_PER_PLAY = 5;
export const PARTICIPATION_DAILY_CAP = 5;
export const PB_BONUS_BASE = 25;
export const STREAK_MULT_MAX = 2.5;
export const BONUS_MULT = 2.0;

export type XpInputs = {
  /** xp from `submission` source already awarded today for this (user, game). */
  participationAwardedToday: number;
  /** True if the just-submitted score beats the day's best (or is the first play). */
  isNewDailyPb: boolean;
  /** Player's current streak after this submission (post-update). */
  streakCurrent: number;
  /** True if this game is in today's deterministic 2x rotation. */
  isBonusGame: boolean;
};

export type XpBreakdown = {
  participation: number;
  pb: number;
  streakMult: number;
  bonusMult: number;
  total: number;
};

export function streakMultiplier(streak: number): number {
  return Math.min(STREAK_MULT_MAX, 1.0 + 0.1 * Math.max(0, streak - 1));
}

export function calculateXp(input: XpInputs): XpBreakdown {
  const bonusMult = input.isBonusGame ? BONUS_MULT : 1.0;
  const streakMult = streakMultiplier(input.streakCurrent);

  // Participation: only award the unused portion of the daily cap.
  const remainingCap = Math.max(
    0,
    PARTICIPATION_DAILY_CAP - input.participationAwardedToday
  );
  const part = Math.min(PARTICIPATION_PER_PLAY, remainingCap);
  // SQL multiplies by bonusMult inside award_xp; mirror here. Math.trunc
  // matches Postgres `(x)::int` which truncates toward zero.
  const participation = Math.trunc(part * bonusMult);

  const pb = input.isNewDailyPb
    ? Math.trunc(PB_BONUS_BASE * streakMult * bonusMult)
    : 0;

  return {
    participation,
    pb,
    streakMult,
    bonusMult,
    total: participation + pb,
  };
}
