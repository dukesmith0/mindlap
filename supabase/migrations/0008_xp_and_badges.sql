-- ============================================================================
-- 0008: XP + badges, integrated into process_submission().
--
-- XP rules (per .vibe/decisions.md):
--   participation: 5 xp per submitted play, capped 5 per (user, game) per PT day.
--     This is the everyday floor so people who show up get something.
--   daily PB:      +25 xp on a new daily best for that user+game+date.
--                  (Score-scaled `floor(z * 50)` deferred until pop stats exist;
--                   tracked in plans.md Phase 12.)
--   streak bonus:  multiplier = min(1.0 + 0.1 * (streak_current - 1), 2.5).
--                  Applied to score-scaled (and right now: to PB) xp only.
--   double-XP day: 2x multiplier when the game is in today's daily_bonus pair.
--                  Resolved client-side via lib/daily-bonus.ts and passed into
--                  the RPC as p_is_bonus_game (server-trustable in v1; future
--                  hardening: derive from a daily_bonus row inside the fn).
--
-- Badges shipped (4 categories per seed.sql):
--   streak: 3, 7, 30, 100 day streaks (granted on streak update if hit)
--   per-game first-PB: pb_first_<game> on first ever submission for that game
--   all-seven-today: when user has at least one submission per game today
--
-- Wired into process_submission via two helpers:
--   award_xp(user_id, source, amount, multiplier, metadata) -> int total xp
--   eval_badges(user_id) -> grants any new earned badges
-- ============================================================================

-- ----------------------------------------------------------------------------
-- award_xp: writes an xp_events row and increments profiles.xp + level.
-- Returns the new total xp (post-increment).
-- ----------------------------------------------------------------------------
create or replace function public.award_xp(
  p_user_id uuid,
  p_source text,
  p_amount int,
  p_multiplier numeric default 1.0,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_new_level int;
begin
  if p_amount <= 0 then
    -- No-op record: do not write a zero-amount event so the audit log stays clean.
    select xp into v_total from public.profiles where id = p_user_id;
    return v_total;
  end if;

  insert into public.xp_events (user_id, source, multiplier, amount, metadata)
  values (p_user_id, p_source, coalesce(p_multiplier, 1.0), p_amount, coalesce(p_metadata, '{}'::jsonb));

  update public.profiles
     set xp = xp + p_amount
   where id = p_user_id
   returning xp into v_total;

  -- Level = floor(sqrt(xp / 100)) + 1 (mirrors lib/ui/XpBar.ts).
  v_new_level := greatest(1, floor(sqrt(greatest(0, v_total)::numeric / 100))::int + 1);
  update public.profiles
     set level = v_new_level
   where id = p_user_id and level <> v_new_level;

  return v_total;
end;
$$;

revoke execute on function public.award_xp(uuid, text, int, numeric, jsonb) from public;
-- award_xp is internal: only callable from SECURITY DEFINER fns we own.
-- No grant to authenticated.

-- ----------------------------------------------------------------------------
-- eval_badges: grants any newly-earned badges to a user. Idempotent (uses
-- ON CONFLICT DO NOTHING against the user_badges PK).
-- ----------------------------------------------------------------------------
create or replace function public.eval_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak int;
  v_today date := (now() at time zone 'America/Los_Angeles')::date;
  v_distinct_games_today int;
  v_total_games int;
begin
  select streak_current into v_streak from public.profiles where id = p_user_id;

  -- streak badges
  if v_streak >= 3 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'streak_3') on conflict do nothing;
  end if;
  if v_streak >= 7 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'streak_7') on conflict do nothing;
  end if;
  if v_streak >= 30 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'streak_30') on conflict do nothing;
  end if;
  if v_streak >= 100 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'streak_100') on conflict do nothing;
  end if;

  -- per-game first-PB badges (simply "submitted any score for this game ever")
  insert into public.user_badges (user_id, badge_key)
  select p_user_id, 'pb_first_' || s.game_key
    from (select distinct game_key from public.submissions where user_id = p_user_id) s
   on conflict do nothing;

  -- all-seven-today: distinct game_keys with at least one submitted play today
  select count(distinct game_key) into v_distinct_games_today
    from public.submissions
   where user_id = p_user_id
     and played_pt_date = v_today;

  select count(*) into v_total_games from public.games;

  if v_distinct_games_today >= v_total_games then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'all_seven_today') on conflict do nothing;
  end if;
end;
$$;

revoke execute on function public.eval_badges(uuid) from public;

-- ----------------------------------------------------------------------------
-- Extend process_submission() to award XP + evaluate badges in the same tx.
-- New parameter: p_is_bonus_game (whether today's daily_bonus pair includes
-- this game). Server passes this from lib/daily-bonus.ts.
-- ----------------------------------------------------------------------------
create or replace function public.process_submission(
  p_game_key text,
  p_score numeric,
  p_is_bonus_game boolean default false
)
returns table(
  game_key text,
  date date,
  best numeric,
  worst numeric,
  mean numeric,
  median numeric,
  plays_submitted int,
  streak_current int,
  xp_awarded int,
  is_new_pb boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_game public.games%rowtype;
  v_pt_date date := (now() at time zone 'America/Los_Angeles')::date;
  v_yesterday date := v_pt_date - 1;
  v_last_played date;
  v_streak_current int;
  v_streak_longest int;
  v_score numeric := p_score;
  v_direction text;
  v_old_best numeric;
  v_new_best numeric;
  v_new_worst numeric;
  v_new_mean numeric;
  v_new_median numeric;
  v_new_plays int;
  v_is_new_pb boolean := false;
  v_xp_today int;
  v_xp_part int := 0;
  v_xp_pb int := 0;
  v_streak_mult numeric := 1.0;
  v_bonus_mult numeric;
  v_total_awarded int := 0;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_game from public.games where key = p_game_key;
  if not found then
    raise exception 'unknown game %', p_game_key;
  end if;
  v_direction := v_game.score_direction;
  if v_score < v_game.min_score then
    raise exception 'score % below minimum % for game %', v_score, v_game.min_score, p_game_key;
  end if;
  if v_game.max_score is not null and v_score > v_game.max_score then
    raise exception 'score % above maximum % for game %', v_score, v_game.max_score, p_game_key;
  end if;

  -- 1. Insert submission. SECURITY DEFINER bypasses RLS; v_user_id binds owner.
  insert into public.submissions (user_id, game_key, score)
  values (v_user_id, p_game_key, v_score);

  -- 2. Read previous-best for PB detection. NULL on first play of the day.
  select best into v_old_best
    from public.daily_aggregates
   where user_id = v_user_id and game_key = p_game_key and date = v_pt_date;

  -- 3. Upsert daily_aggregates for (user, game, PT date).
  insert into public.daily_aggregates as agg
    (user_id, game_key, date, plays_total, plays_submitted, best, worst, mean, median)
  values
    (v_user_id, p_game_key, v_pt_date, 1, 1, v_score, v_score, v_score, v_score)
  on conflict (user_id, game_key, date) do update set
    plays_submitted = agg.plays_submitted + 1,
    best = case
      when v_direction = 'higher' then greatest(agg.best, v_score)
      else least(agg.best, v_score)
    end,
    worst = case
      when v_direction = 'higher' then least(agg.worst, v_score)
      else greatest(agg.worst, v_score)
    end,
    mean = ((agg.mean * agg.plays_submitted) + v_score) / (agg.plays_submitted + 1)
  returning agg.best, agg.worst, agg.mean, agg.median, agg.plays_submitted
    into v_new_best, v_new_worst, v_new_mean, v_new_median, v_new_plays;

  -- New PB if score equals (and beats prior) best, or first play of day.
  if v_old_best is null then
    v_is_new_pb := true;
  elsif v_direction = 'higher' and v_score > v_old_best then
    v_is_new_pb := true;
  elsif v_direction = 'lower' and v_score < v_old_best then
    v_is_new_pb := true;
  end if;

  -- median: cheap recompute over today's submissions for this user+game.
  select percentile_cont(0.5) within group (order by score)
    into v_new_median
    from public.submissions
   where user_id = v_user_id
     and game_key = p_game_key
     and played_pt_date = v_pt_date;
  update public.daily_aggregates
     set median = v_new_median
   where user_id = v_user_id and game_key = p_game_key and date = v_pt_date;

  -- 4. Streak update (PT-anchored). Reset to 1 if missed yesterday, +1 if
  -- yesterday played, no change if already played today.
  select last_played_date, streak_current, streak_longest
    into v_last_played, v_streak_current, v_streak_longest
    from public.profiles where id = v_user_id for update;

  if v_last_played is null or v_last_played < v_yesterday then
    v_streak_current := 1;
  elsif v_last_played = v_yesterday then
    v_streak_current := v_streak_current + 1;
  end if;
  if v_streak_current > v_streak_longest then
    v_streak_longest := v_streak_current;
  end if;

  update public.profiles
     set last_played_date = v_pt_date,
         streak_current = v_streak_current,
         streak_longest = v_streak_longest,
         total_submitted = total_submitted + 1
   where id = v_user_id;

  -- 5. XP: participation (capped 5/game/day), PB bonus, streak mult, 2x bonus.
  v_streak_mult := least(2.5, 1.0 + 0.1 * (v_streak_current - 1));
  v_bonus_mult := case when p_is_bonus_game then 2.0 else 1.0 end;

  -- Participation: 5 xp/play, capped at 5/game/day total. Read what's been
  -- awarded for this user+game+date already.
  select coalesce(sum(amount), 0) into v_xp_today
    from public.xp_events
   where user_id = v_user_id
     and source = 'submission'
     and (metadata->>'game_key') = p_game_key
     and (occurred_at at time zone 'America/Los_Angeles')::date = v_pt_date;

  if v_xp_today < 5 then
    v_xp_part := least(5 - v_xp_today, 5);
    perform public.award_xp(
      v_user_id,
      'submission',
      v_xp_part,
      v_bonus_mult,
      jsonb_build_object('game_key', p_game_key, 'is_bonus', p_is_bonus_game)
    );
    v_total_awarded := v_total_awarded + (v_xp_part * v_bonus_mult)::int;
  end if;

  -- Daily PB bonus: 25 xp * streak mult * 2x. Only on a NEW PB for the day.
  if v_is_new_pb then
    v_xp_pb := (25 * v_streak_mult * v_bonus_mult)::int;
    perform public.award_xp(
      v_user_id,
      'daily_pb',
      v_xp_pb,
      v_streak_mult * v_bonus_mult,
      jsonb_build_object('game_key', p_game_key, 'score', v_score, 'is_bonus', p_is_bonus_game)
    );
    v_total_awarded := v_total_awarded + v_xp_pb;
  end if;

  -- 6. Badges: streak tiers, first-PB-per-game, all-seven-today.
  perform public.eval_badges(v_user_id);

  -- 7. Return.
  return query
    select p_game_key, v_pt_date,
           v_new_best, v_new_worst, v_new_mean, v_new_median,
           v_new_plays, v_streak_current, v_total_awarded, v_is_new_pb;
end;
$$;

revoke execute on function public.process_submission(text, numeric, boolean) from public;
grant execute on function public.process_submission(text, numeric, boolean) to authenticated;

-- Drop the old 2-arg signature so callers must move to the new one.
drop function if exists public.process_submission(text, numeric);
