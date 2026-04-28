-- ============================================================================
-- Fix: generate_friend_code (defined in 0002) had two bugs:
--   1. It still scanned profiles.friend_code, but 0004 moved that column to
--      profile_secrets. The collision check raised "column does not exist".
--   2. search_path was 'public' only, so gen_random_bytes() (which lives in
--      Supabase's `extensions` schema as part of pgcrypto) was unresolvable.
-- Both manifested as "Database error saving new user" during signup, since
-- handle_new_user calls generate_friend_code inside the auth.users trigger.
-- Rebind the collision check to profile_secrets and add `extensions` to the
-- function's search_path.
-- ============================================================================

create or replace function public.generate_friend_code()
returns char(8)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  attempt int := 0;
  candidate char(8);
  i int;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(
        alphabet,
        1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet))::int,
        1
      );
    end loop;

    if not exists (select 1 from public.profile_secrets where friend_code = candidate) then
      return candidate;
    end if;

    attempt := attempt + 1;
    if attempt >= 8 then
      raise exception 'friend_code generation exhausted retries';
    end if;
  end loop;
end;
$$;
