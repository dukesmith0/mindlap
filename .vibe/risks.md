# Risks
Next ID: R4 | Last scan: 2026-04-28 | Baseline: 0C/0H/2M/1L (design-derived, pre-scaffold)

## Critical

## High

## Medium
#R1 [MEDIUM] Anti-cheat deferred at launch. Only RLS + DB CHECK + auth.uid()-tied inserts protect submissions. A user could craft API calls inserting any in-range score. Acceptable for friends-and-groups MVP. Revisit before any prize/competitive feature. (planned 2026-04-28)
#R2 [MEDIUM] Glicko-2 cold-start with sparse population produces unstable ratings. Mitigated by `ELO_VISIBLE=false` flag; ratings persist silently. Verify rating distribution before flipping at threshold (≥25 users × ≥10 ranked submissions/game). (planned 2026-04-28)

## Low
#R3 [LOW] Daily-seed cron skip leaves a date without a seed. Mitigation: lazy fallback generator on first request for a date so leaderboards stay comparable. (planned 2026-04-28)

## Resolved
