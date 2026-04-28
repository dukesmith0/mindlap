-- ============================================================================
-- Seed data: games + badges catalogs.
-- Run after 0001_init.sql.
-- ============================================================================

insert into public.games (key, display_name, description, is_core, score_direction, min_score, max_score, sort_order)
values
  ('math',      'Speed Math',  '60s arithmetic drill',                    true,  'higher', 0,   2000, 1),
  ('digit',     'Digit Span',  'Recall the last sequence you saw',        true,  'higher', 0,   30,   2),
  ('nback',     'N-Back',      'Match every nth letter (2-back)',         true,  'higher', 0,   100,  3),
  ('stroop',    'Stroop',      'Color word interference, 30s',            true,  'higher', 0,   500,  4),
  ('reaction',  'Reaction',    'Average ms over 5 trials',                false, 'lower',  100, 5000, 5),
  ('mine',      'Minesweeper', '10x10 with 15 mines, time to clear',      false, 'lower',  1,   3600, 6),
  ('word',      'Word Recall', 'Memorize 10 of 115 words',                false, 'higher', 0,   10,   7)
on conflict (key) do update set
  display_name = excluded.display_name,
  description  = excluded.description,
  is_core      = excluded.is_core,
  score_direction = excluded.score_direction,
  min_score    = excluded.min_score,
  max_score    = excluded.max_score,
  sort_order   = excluded.sort_order;

-- ============================================================================
-- Badges. v1 ships streak + first-PB badges; achievement and elo-tier badges
-- can be added in later phases.
-- ============================================================================

insert into public.badges (key, name, description, category, criteria) values
  -- streak
  ('streak_3',   '3 Day Streak',   'Played 3 days in a row',   'streak', '{"days":3}'),
  ('streak_7',   '7 Day Streak',   'Played 7 days in a row',   'streak', '{"days":7}'),
  ('streak_30',  '30 Day Streak',  'Played 30 days in a row',  'streak', '{"days":30}'),
  ('streak_100', '100 Day Streak', 'Played 100 days in a row', 'streak', '{"days":100}'),

  -- per-game first PB
  ('pb_first_math',     'First Math Score',        'Submitted your first Speed Math score',  'pb', '{"game":"math"}'),
  ('pb_first_digit',    'First Digit Span Score',  'Submitted your first Digit Span score',  'pb', '{"game":"digit"}'),
  ('pb_first_nback',    'First N-Back Score',      'Submitted your first N-Back score',      'pb', '{"game":"nback"}'),
  ('pb_first_stroop',   'First Stroop Score',      'Submitted your first Stroop score',      'pb', '{"game":"stroop"}'),
  ('pb_first_reaction', 'First Reaction Score',    'Submitted your first Reaction score',    'pb', '{"game":"reaction"}'),
  ('pb_first_mine',     'First Minesweeper Score', 'Submitted your first Minesweeper score', 'pb', '{"game":"mine"}'),
  ('pb_first_word',     'First Word Recall Score', 'Submitted your first Word Recall score', 'pb', '{"game":"word"}'),

  -- multi-game
  ('all_seven_today', 'Seven on the Day', 'Submitted at least one score on every game today', 'achievement', '{"all_seven":true}'),
  ('all_seven_pb',    'Lapped It',        'Hold a personal best on every game',                'achievement', '{"all_seven_pb":true}')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  criteria = excluded.criteria;
