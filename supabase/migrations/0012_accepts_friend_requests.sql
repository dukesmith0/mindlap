-- ============================================================================
-- Per-user opt-out for inbound friend requests. When false, addFriendAction
-- rejects the request before inserting a row. Default is true (existing users
-- and new signups accept by default). The /settings -> Account section
-- exposes a toggle.
-- ============================================================================

alter table public.profiles
  add column if not exists accepts_friend_requests boolean not null default true;
