-- ============================================================================
-- 0007: process_submission(game_key, score) RPC.
--
-- Single transactional writer that submitScoreAction calls. Inserts the
-- submission row, upserts daily_aggregates for the (user, game, PT date),
-- updates streak counters on the profile, and increments total_submitted.
-- Returns the new aggregate row so the client can show the fresh best/plays
-- without a follow-up SELECT.
--
-- Defers (intentional, tracked in plans.md):
--   - XP events + multipliers (Phase 6)
--   - Glicko-2 silent rating updates (Phase 10)
--   - Badge eval (Phase 6)
-- The function leaves room for those by keeping the transaction shape
-- single-call so future migrations only add steps inside it.
-- ============================================================================

create or replace function public.process_submission(
  p_game_key text,
  p_score numeric
)
returns table(
  game_key text,
  date date,
  best numeric,
  worst numeric,
  mean numeric,
  median numeric,
  plays_submitted int,
  streak_current int
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
  v_new_best numeric;
  v_new_worst numeric;
  v_new_mean numeric;
  v_new_median numeric;
  v_new_plays int;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Validate game + range against the catalog.
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

  -- 1. Insert the raw submission. As SECURITY DEFINER this bypasses RLS, so
  -- the security boundary is the auth.uid() check at the top of the function:
  -- v_user_id is the caller and every write below binds to it.
  insert into public.submissions (user_id, game_key, score)
  values (v_user_id, p_game_key, v_score);

  -- 2. Upsert the daily_aggregates row for (user, game, PT date).
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

  -- median: cheap recompute over today's submissions for this user+game.
  select percentile_cont(0.5) within group (order by score)
    into v_new_median
    from public.submissions
   where user_id = v_user_id
     and game_key = p_game_key
     and played_pt_date = v_pt_date;

  update public.daily_aggregates
     set median = v_new_median
   where user_id = v_user_id
     and game_key = p_game_key
     and date = v_pt_date;

  -- 3. Streak: any submitted play on a PT date counts as "played that day".
  select last_played_date, streak_current, streak_longest
    into v_last_played, v_streak_current, v_streak_longest
    from public.profiles
   where id = v_user_id
   for update;

  if v_last_played is null or v_last_played < v_yesterday then
    -- Missed at least one day. Reset to 1 today.
    v_streak_current := 1;
  elsif v_last_played = v_yesterday then
    -- Played yesterday + today: continue.
    v_streak_current := v_streak_current + 1;
  end if;
  -- v_last_played = v_pt_date already: another submission today, no change.

  if v_streak_current > v_streak_longest then
    v_streak_longest := v_streak_current;
  end if;

  update public.profiles
     set last_played_date = v_pt_date,
         streak_current = v_streak_current,
         streak_longest = v_streak_longest,
         total_submitted = total_submitted + 1
   where id = v_user_id;

  -- 4. Return the freshly-updated aggregate row.
  return query
    select p_game_key,
           v_pt_date,
           v_new_best,
           v_new_worst,
           v_new_mean,
           v_new_median,
           v_new_plays,
           v_streak_current;
end;
$$;

revoke execute on function public.process_submission(text, numeric) from public;
grant execute on function public.process_submission(text, numeric) to authenticated;
