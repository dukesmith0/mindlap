-- ============================================================================
-- handle_new_user trigger: creates a profile row when an auth.users row is added.
-- Derives a unique username from the email local-part with a numeric suffix on
-- collision, and generates a unique 8-char friend_code (Crockford-ish: no
-- 0/O/1/I/L characters).
-- ============================================================================

create or replace function public.generate_friend_code()
returns char(8)
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  attempt int := 0;
  candidate char(8);
  i int;
begin
  loop
    candidate := '';
    -- Use pgcrypto's CSPRNG, not random(), so codes aren't predictable.
    for i in 1..8 loop
      candidate := candidate || substr(
        alphabet,
        1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet))::int,
        1
      );
    end loop;

    -- Bail out if it doesn't collide; retry up to 8 times then escalate.
    if not exists (select 1 from public.profiles where friend_code = candidate) then
      return candidate;
    end if;

    attempt := attempt + 1;
    if attempt >= 8 then
      raise exception 'friend_code generation exhausted retries';
    end if;
  end loop;
end;
$$;

create or replace function public.generate_username_from_email(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  -- Normalize: take local-part, lowercase, strip non-allowed chars.
  base := split_part(lower(coalesce(p_email, '')), '@', 1);
  base := regexp_replace(base, '[^a-z0-9_-]', '', 'g');
  if length(base) < 3 then
    base := 'user' || substr(md5(random()::text), 1, 4);
  end if;
  base := substr(base, 1, 20);

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := substr(base, 1, 20) || suffix::text;
    if suffix > 9999 then
      raise exception 'username generation exhausted retries';
    end if;
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, friend_code)
  values (
    new.id,
    public.generate_username_from_email(new.email),
    public.generate_friend_code()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep last_signin_at fresh for the 6-month username rotation cron.
create or replace function public.touch_last_signin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set last_signin_at = now()
   where id = new.id;
  return new;
end;
$$;
