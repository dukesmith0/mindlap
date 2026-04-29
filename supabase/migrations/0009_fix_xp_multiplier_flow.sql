-- ============================================================================
-- 0009: Fix XP multiplier flow (bugs #24 + #27).
--
-- Bug #24: 0008's award_xp ignored p_multiplier when computing the actual
-- profile.xp delta — it inserted `amount=p_amount` and incremented xp by
-- p_amount, dropping the bonus/streak multiplier. Result: client saw
-- "+10 xp" on bonus games, profile.xp only +5.
--
-- Fix (option b from review): pre-multiply at the caller. award_xp keeps the
-- multiplier column purely as informational metadata; profile.xp += amount.
-- This also resolves bug #27 by making the participation cap scale with the
-- bonus multiplier consistently (cap = 5 * v_bonus_mult, per-play = same).
-- ============================================================================

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
  v_streak_mult numeric := 1.0;
  v_bonus_mult numeric;
  v_part_per_play int;
  v_part_cap int;
  v_xp_part int := 0;
  v_xp_pb int := 0;
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

  insert into public.submissions (user_id, game_key, score)
  values (v_user_id, p_game_key, v_score);

  select best into v_old_best
    from public.daily_aggregates
   where user_id = v_user_id and game_key = p_game_key and date = v_pt_date;

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

  if v_old_best is null then
    v_is_new_pb := true;
  elsif v_direction = 'higher' and v_score > v_old_best then
    v_is_new_pb := true;
  elsif v_direction = 'lower' and v_score < v_old_best then
    v_is_new_pb := true;
  end if;

  select percentile_cont(0.5) within group (order by score)
    into v_new_median
    from public.submissions
   where user_id = v_user_id
     and game_key = p_game_key
     and played_pt_date = v_pt_date;
  update public.daily_aggregates
     set median = v_new_median
   where user_id = v_user_id and game_key = p_game_key and date = v_pt_date;

  -- Streak
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

  -- XP: pre-multiply amount, multiplier column is informational only.
  v_streak_mult := least(2.5, 1.0 + 0.1 * (v_streak_current - 1));
  v_bonus_mult := case when p_is_bonus_game then 2.0 else 1.0 end;
  v_part_per_play := (5 * v_bonus_mult)::int;
  v_part_cap := (5 * v_bonus_mult)::int;

  -- Sum what's been awarded today (post-multiplier amounts in xp_events).
  select coalesce(sum(amount), 0) into v_xp_today
    from public.xp_events
   where user_id = v_user_id
     and source = 'submission'
     and (metadata->>'game_key') = p_game_key
     and (occurred_at at time zone 'America/Los_Angeles')::date = v_pt_date;

  if v_xp_today < v_part_cap then
    v_xp_part := least(v_part_per_play, v_part_cap - v_xp_today);
    perform public.award_xp(
      v_user_id,
      'submission',
      v_xp_part,
      v_bonus_mult,
      jsonb_build_object('game_key', p_game_key, 'is_bonus', p_is_bonus_game)
    );
    v_total_awarded := v_total_awarded + v_xp_part;
  end if;

  if v_is_new_pb then
    -- Pre-multiplied PB: 25 base * streak_mult * bonus_mult.
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

  perform public.eval_badges(v_user_id);

  return query
    select p_game_key, v_pt_date,
           v_new_best, v_new_worst, v_new_mean, v_new_median,
           v_new_plays, v_streak_current, v_total_awarded, v_is_new_pb;
end;
$$;

revoke execute on function public.process_submission(text, numeric, boolean) from public;
grant execute on function public.process_submission(text, numeric, boolean) to authenticated;
