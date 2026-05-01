-- Seed test data for walkthrough@test.com. Direct inserts since
-- process_submission requires auth.uid(). Idempotent: wipes prior rows.

do $$
declare
  uid uuid;
  d date;
  base int;
  game_keys text[] := array['math','digit','nback','stroop','reaction','mine','word'];
  g text;
begin
  select id into uid from public.profiles where username = 'walkthrough';
  if uid is null then
    raise notice 'walkthrough user not found';
    return;
  end if;

  delete from public.submissions where user_id = uid;
  delete from public.daily_aggregates where user_id = uid;
  delete from public.user_badges where user_id = uid;
  delete from public.xp_events where user_id = uid;

  -- 30 days of plays. Skip a few mid-range days for a "human" heatmap.
  for i in 0..29 loop
    d := (now() at time zone 'America/Los_Angeles')::date - i;
    if i in (5, 12, 22) then
      continue;
    end if;
    foreach g in array game_keys loop
      base := case g
        when 'math'     then 25 + ((29 - i) * 0.6)::int + (random() * 8)::int
        when 'digit'    then 6  + ((29 - i) * 0.18)::int + (random() * 1.4)::int
        when 'nback'    then 6  + ((29 - i) * 0.4)::int + (random() * 3)::int
        when 'stroop'   then 18 + ((29 - i) * 0.7)::int + (random() * 6)::int
        when 'reaction' then 600 - ((29 - i) * 8)::int - (random() * 30)::int
        when 'mine'     then 240 - ((29 - i) * 4)::int - (random() * 25)::int
        when 'word'     then 4  + ((29 - i) * 0.16)::int + (random() * 1.5)::int
      end;
      insert into public.submissions (user_id, game_key, score, played_at)
      values (
        uid,
        g,
        base,
        (d::timestamp + interval '12 hours' + (i * interval '1 minute')) at time zone 'America/Los_Angeles'
      );
    end loop;
  end loop;

  -- Fire xp_events for today so the milestone banner's "PB earned today" path triggers.
  insert into public.xp_events (user_id, source, multiplier, amount, metadata, occurred_at)
  values
    (uid, 'daily_pb', 1.0, 25, '{"game_key":"math"}', now()),
    (uid, 'streak', 1.5, 30, '{}', now());

  -- Recompute daily_aggregates from the inserted submissions.
  insert into public.daily_aggregates (user_id, game_key, date, plays_submitted, best, worst, median)
  select
    user_id,
    game_key,
    played_pt_date,
    count(*),
    case when (select score_direction from public.games where key = game_key) = 'lower' then min(score) else max(score) end,
    case when (select score_direction from public.games where key = game_key) = 'lower' then max(score) else min(score) end,
    percentile_cont(0.5) within group (order by score)
  from public.submissions
  where user_id = uid
  group by user_id, game_key, played_pt_date;

  -- Award some sample badges.
  insert into public.user_badges (user_id, badge_key, earned_at) values
    (uid, 'streak_3', now() - interval '27 days'),
    (uid, 'streak_7', now() - interval '23 days'),
    (uid, 'pb_first_math', now() - interval '29 days'),
    (uid, 'pb_first_digit', now() - interval '29 days'),
    (uid, 'pb_first_nback', now() - interval '29 days'),
    (uid, 'pb_first_stroop', now() - interval '28 days'),
    (uid, 'pb_first_reaction', now() - interval '28 days'),
    (uid, 'pb_first_mine', now() - interval '28 days'),
    (uid, 'pb_first_word', now() - interval '28 days')
  on conflict do nothing;

  -- Refresh profile rollups.
  update public.profiles
  set total_plays = (select count(*) from public.submissions where user_id = uid),
      total_submitted = (select count(*) from public.submissions where user_id = uid),
      streak_current = 27,
      streak_longest = 27,
      xp = 4200,
      level = 7
  where id = uid;

  raise notice 'walkthrough user seeded';
end $$;
