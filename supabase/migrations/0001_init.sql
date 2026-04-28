-- ============================================================================
-- mindlap initial schema
-- All daily boundaries anchor on America/Los_Angeles (PT), not UTC.
-- ============================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  username_changed_at timestamptz,
  friend_code char(8) unique not null,
  display_name text,
  avatar_color text not null default '#64748b'
    check (avatar_color in (
      '#64748b','#6b7280','#71717a','#ef4444','#f97316',
      '#f59e0b','#ca8a04','#84cc16','#22c55e','#10b981',
      '#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1',
      '#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e'
    )),
  bio text,
  theme_pref text not null default 'system' check (theme_pref in ('light','dark','system')),
  xp bigint not null default 0,
  level int not null default 1,
  streak_current int not null default 0,
  streak_longest int not null default 0,
  last_played_date date,
  last_signin_at timestamptz default now(),
  total_plays bigint not null default 0,
  total_submitted bigint not null default 0,
  is_public boolean not null default true,
  tutorials_seen jsonb not null default '{}',
  skip_tutorials boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_-]{3,24}$'),
  constraint friend_code_format check (friend_code ~ '^[A-HJKMNP-Z2-9]{8}$')
);

create index profiles_friend_code_idx on public.profiles(friend_code);
create index profiles_last_signin_idx on public.profiles(last_signin_at);

-- ============================================================================
-- games (static catalog, seeded in seed.sql)
-- ============================================================================
create table public.games (
  key text primary key,
  display_name text not null,
  description text,
  icon text,
  is_core boolean not null default false,
  score_direction text not null check (score_direction in ('higher','lower')),
  min_score numeric not null,
  max_score numeric,
  sort_order int not null default 0
);

-- ============================================================================
-- user_game_pins
-- ============================================================================
create table public.user_game_pins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null references public.games(key) on delete cascade,
  pinned_at timestamptz not null default now(),
  primary key (user_id, game_key)
);

-- ============================================================================
-- daily_bonus (deterministic 2-of-7 rotation)
-- ============================================================================
create table public.daily_bonus (
  date date primary key,
  game_keys text[] not null check (array_length(game_keys, 1) = 2)
);

-- ============================================================================
-- submissions (rolling 90-day retention; nightly cron deletes older rows)
-- ============================================================================
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null references public.games(key) on delete restrict,
  score numeric not null,
  played_at timestamptz not null default now(),
  played_pt_date date generated always as
    ((played_at at time zone 'America/Los_Angeles')::date) stored,
  metadata jsonb not null default '{}'
);

create index submissions_user_game_date_idx on public.submissions(user_id, game_key, played_pt_date desc);
create index submissions_game_score_idx on public.submissions(game_key, score desc);
create index submissions_pt_date_idx on public.submissions(played_pt_date desc);

-- ============================================================================
-- daily_aggregates (per (user, game, PT date), kept forever)
-- ============================================================================
create table public.daily_aggregates (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null references public.games(key) on delete cascade,
  date date not null,
  plays_total int not null default 0,
  plays_submitted int not null default 0,
  best numeric,
  worst numeric,
  mean numeric,
  median numeric,
  primary key (user_id, game_key, date)
);

create index daily_aggregates_date_idx on public.daily_aggregates(date desc);

-- ============================================================================
-- ratings (Glicko-2, silent in v1)
-- ============================================================================
create table public.ratings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null references public.games(key) on delete cascade,
  rating real not null default 1500,
  rd real not null default 350,
  volatility real not null default 0.06,
  last_period_at timestamptz,
  primary key (user_id, game_key)
);

create table public.mind_elo (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  composite real,
  computed_at timestamptz not null default now()
);

-- ============================================================================
-- friendships (mutual accept)
-- ============================================================================
create table public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (requester_id, addressee_id),
  constraint no_self_friend check (requester_id <> addressee_id)
);

create index friendships_addressee_idx on public.friendships(addressee_id, status);

-- ============================================================================
-- groups
-- ============================================================================
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext unique not null,
  -- ON DELETE CASCADE: when an owner deletes their account, the group dissolves.
  -- Decisions doc note: ownership transfer to oldest admin will land in Phase 8 via a BEFORE-DELETE trigger
  -- on profiles. v1 launch: dissolution is the explicit fallback.
  owner_id uuid not null references public.profiles(id) on delete cascade,
  description text,
  is_public boolean not null default false,
  allow_member_invite boolean not null default false,
  join_code char(8) unique not null,
  member_cap int not null default 100 check (member_cap between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,32}$'),
  constraint join_code_format check (join_code ~ '^[A-HJKMNP-Z2-9]{8}$')
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members(user_id);

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  invited_user uuid references public.profiles(id) on delete cascade,
  invite_email text,
  token text unique not null,
  status text not null check (status in ('pending','accepted','expired','revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- badges
-- ============================================================================
create table public.badges (
  key text primary key,
  name text not null,
  description text,
  icon text,
  category text not null check (category in ('streak','pb','elo','achievement')),
  criteria jsonb not null default '{}'
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null references public.badges(key) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

-- ============================================================================
-- xp_events (audit log; profiles.xp is running sum)
-- ============================================================================
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (
    source in ('submission','daily_pb','streak','double_xp_bonus','daily_complete','level_up')
  ),
  multiplier numeric not null default 1.0,
  amount int not null,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create index xp_events_user_occurred_idx on public.xp_events(user_id, occurred_at desc);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();
