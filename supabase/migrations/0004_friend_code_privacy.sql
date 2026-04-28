-- ============================================================================
-- Move friend_code off `profiles` (which is publicly SELECT-able) onto a new
-- `profile_secrets` table so other users can't enumerate everyone's codes.
-- A SECURITY DEFINER RPC `find_user_by_friend_code(text)` lets the friend-add
-- flow look up a user_id without revealing the code itself.
-- ============================================================================

create table public.profile_secrets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  friend_code char(8) unique not null
    constraint friend_code_format check (friend_code ~ '^[A-HJKMNP-Z2-9]{8}$'),
  rotated_at timestamptz not null default now()
);

alter table public.profile_secrets enable row level security;

-- Only the owner can read or update their friend code.
create policy "owners read own secrets"
  on public.profile_secrets for select
  using (auth.uid() = user_id);

create policy "owners update own secrets"
  on public.profile_secrets for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owners insert own secrets"
  on public.profile_secrets for insert
  with check (auth.uid() = user_id);

-- Backfill from the legacy column then drop it.
insert into public.profile_secrets (user_id, friend_code)
  select id, friend_code from public.profiles
  on conflict (user_id) do nothing;

alter table public.profiles drop column friend_code;

-- Update handle_new_user so it writes to the new table.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
  new_code char(8);
begin
  new_username := public.generate_username_from_email(new.email);
  new_code := public.generate_friend_code();

  insert into public.profiles (id, username) values (new.id, new_username);
  insert into public.profile_secrets (user_id, friend_code) values (new.id, new_code);
  return new;
end;
$$;

-- Resolve a friend by code without exposing the table to the caller. Returns
-- the matching user_id, or NULL if no match. Caller can then send a friend
-- request to that uuid via the friendships RLS-gated insert.
create or replace function public.find_user_by_friend_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  target uuid;
begin
  if p_code is null or p_code !~ '^[A-HJKMNP-Z2-9]{8}$' then
    return null;
  end if;
  select user_id into target from public.profile_secrets where friend_code = p_code;
  return target;
end;
$$;

revoke execute on function public.find_user_by_friend_code(text) from public;
grant execute on function public.find_user_by_friend_code(text) to authenticated;

-- Allow owners to regenerate their own code via RPC.
create or replace function public.regenerate_friend_code()
returns char(8)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code char(8);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  new_code := public.generate_friend_code();
  update public.profile_secrets
     set friend_code = new_code, rotated_at = now()
   where user_id = auth.uid();
  return new_code;
end;
$$;

revoke execute on function public.regenerate_friend_code() from public;
grant execute on function public.regenerate_friend_code() to authenticated;

-- ============================================================================
-- Wire the touch_last_signin trigger that 0002 defined but never attached.
-- Drives the 6-month username rotation cron (Phase 11).
-- ============================================================================

drop trigger if exists on_auth_user_signin on auth.users;
create trigger on_auth_user_signin
  after update of last_sign_in_at on auth.users
  for each row execute function public.touch_last_signin();
