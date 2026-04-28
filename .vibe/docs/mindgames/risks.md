# Risks
Next ID: R6 | Last scan: 2026-04-18 | Baseline: 0C/0H/2M/1L

## Critical

## High

## Medium
#R2 [MEDIUM] Custom auth (RPC + bcrypt) is solid for credential validation, but sessionStorage can be spoofed — an attacker could set mg_user=JL and submit scores. Acceptable for friends-only. (found 2026-04-18, updated 2026-04-18)
#R3 [MEDIUM] Sudoku generator with backtracking + uniqueness verification could be slow on low-end devices for minimal-clue puzzles. May need web worker or pre-generated puzzles. (found 2026-04-18)

## Low
#R6 [LOW] Supabase anon key is public — RLS mitigates but someone could still insert valid-shaped junk rows. Acceptable for friends-only project. (found 2026-04-18)

## Resolved
#R1 [HIGH] localStorage cross-device issue — resolved by using Supabase. (found 2026-04-18, resolved 2026-04-18)
#R4 [LOW] localStorage size limit — no longer applicable, data stored in Supabase. (found 2026-04-18, resolved 2026-04-18)
#R5 [LOW] Apps Script URL exposure — no longer applicable, switched to Supabase with RLS. (found 2026-04-18, resolved 2026-04-18)