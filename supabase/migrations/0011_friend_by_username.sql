-- ============================================================================
-- Username-keyed friend lookup. Mirrors find_user_by_friend_code(text):
-- SECURITY DEFINER, granted to authenticated, returns the matching user_id
-- or NULL on invalid input / no match. profiles.username is citext so the
-- equality match is case-insensitive without LOWER().
-- ============================================================================

create or replace function public.find_user_by_username(p_username text)
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  target uuid;
begin
  if p_username is null then
    return null;
  end if;
  -- Mirror profiles.username CHECK: 3-24 chars, [a-z0-9_-]. citext makes the
  -- match case-insensitive; we still validate length to short-circuit garbage.
  if length(p_username) < 3 or length(p_username) > 24 then
    return null;
  end if;
  if p_username !~ '^[a-zA-Z0-9_-]{3,24}$' then
    return null;
  end if;
  select id into target from public.profiles where username = p_username;
  return target;
end;
$$;

revoke execute on function public.find_user_by_username(text) from public;
grant execute on function public.find_user_by_username(text) to authenticated;
