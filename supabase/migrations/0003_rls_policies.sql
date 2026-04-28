-- ============================================================================
-- RLS policies (launch baseline: light, defer hardening per decisions.md)
-- ============================================================================

-- profiles: anyone can read (the app respects is_public for the full profile
-- page, but leaderboard rows still show usernames). Each user updates their own row.
alter table public.profiles enable row level security;

create policy "profiles are readable by anyone"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- games + daily_bonus + badges: read-only catalogs, public.
alter table public.games enable row level security;
create policy "games readable by anyone"
  on public.games for select using (true);

alter table public.daily_bonus enable row level security;
create policy "daily_bonus readable by anyone"
  on public.daily_bonus for select using (true);

alter table public.badges enable row level security;
create policy "badges readable by anyone"
  on public.badges for select using (true);

-- user_game_pins: per-user.
alter table public.user_game_pins enable row level security;
create policy "users can read own pins"
  on public.user_game_pins for select using (auth.uid() = user_id);
create policy "users can manage own pins"
  on public.user_game_pins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- submissions: privacy-aware SELECT.
-- Visible if EITHER the row owner is public, OR the requester is the owner,
-- OR the requester is an accepted friend. INSERT only own. No UPDATE/DELETE.
-- ============================================================================
alter table public.submissions enable row level security;

create policy "submissions readable per privacy"
  on public.submissions for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = submissions.user_id and p.is_public)
    or exists (select 1 from public.friendships f
               where f.status = 'accepted'
                 and ((f.requester_id = auth.uid() and f.addressee_id = submissions.user_id)
                   or (f.addressee_id = auth.uid() and f.requester_id = submissions.user_id)))
  );

create policy "users can insert own submissions"
  on public.submissions for insert with check (auth.uid() = user_id);

-- ============================================================================
-- daily_aggregates: same privacy rule as submissions.
-- ============================================================================
alter table public.daily_aggregates enable row level security;

create policy "daily_aggregates readable per privacy"
  on public.daily_aggregates for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = daily_aggregates.user_id and p.is_public)
    or exists (select 1 from public.friendships f
               where f.status = 'accepted'
                 and ((f.requester_id = auth.uid() and f.addressee_id = daily_aggregates.user_id)
                   or (f.addressee_id = auth.uid() and f.requester_id = daily_aggregates.user_id)))
  );

-- ratings + mind_elo: silent in v1, readable post-flag.
alter table public.ratings enable row level security;
create policy "ratings readable by anyone"
  on public.ratings for select using (true);

alter table public.mind_elo enable row level security;
create policy "mind_elo readable by anyone"
  on public.mind_elo for select using (true);

-- ============================================================================
-- friendships: visible to participants; mutations only by participants.
-- ============================================================================
alter table public.friendships enable row level security;
create policy "friendships visible to participants"
  on public.friendships for select
  using (auth.uid() in (requester_id, addressee_id));
create policy "users can request friendships"
  on public.friendships for insert
  with check (auth.uid() = requester_id);
create policy "users can update friendships they participate in"
  on public.friendships for update
  using (auth.uid() in (requester_id, addressee_id));
create policy "users can delete friendships they participate in"
  on public.friendships for delete
  using (auth.uid() in (requester_id, addressee_id));

-- ============================================================================
-- groups
-- ============================================================================
alter table public.groups enable row level security;

-- Public groups OR groups the requester is a member of (qualified to avoid
-- column-name shadowing inside the EXISTS subquery).
create policy "groups visible to public or members"
  on public.groups for select
  using (
    public.groups.is_public
    or exists (select 1 from public.group_members gm
               where gm.group_id = public.groups.id and gm.user_id = auth.uid())
  );

create policy "any auth user can create group (becomes owner)"
  on public.groups for insert
  with check (auth.uid() = owner_id);

create policy "owner can update group"
  on public.groups for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner can delete group"
  on public.groups for delete
  using (owner_id = auth.uid());

-- ============================================================================
-- group_members
-- Column-shadowing fix: qualify the outer row's group_id with the full
-- table name (CREATE POLICY does not support a table alias).
-- ============================================================================
alter table public.group_members enable row level security;

create policy "group_members visible to fellow members or public-group viewers"
  on public.group_members for select
  using (
    exists (select 1 from public.group_members gm_inner
            where gm_inner.group_id = public.group_members.group_id
              and gm_inner.user_id = auth.uid())
    or exists (select 1 from public.groups g
               where g.id = public.group_members.group_id and g.is_public)
  );

-- Insert paths:
--   1) The very first member of a group is its owner (handled at create time
--      via service role from a server action, so RLS skips. Documented.)
--   2) Public group join: any auth user can insert their own row as 'member'
--      into a public group.
--   3) Invited join: handled server-side via service role on accept.
create policy "users can join public groups"
  on public.group_members for insert
  with check (
    user_id = auth.uid()
    and role = 'member'
    and exists (select 1 from public.groups g
                where g.id = group_id and g.is_public)
  );

-- Members can leave (delete own row).
create policy "members can leave (delete own row)"
  on public.group_members for delete
  using (user_id = auth.uid());

-- ============================================================================
-- group_invites
-- ============================================================================
alter table public.group_invites enable row level security;

create policy "invites visible to participants and admins of the group"
  on public.group_invites for select
  using (
    invited_by = auth.uid()
    or invited_user = auth.uid()
    or exists (select 1 from public.group_members gm
               where gm.group_id = group_invites.group_id
                 and gm.user_id = auth.uid()
                 and gm.role in ('owner','admin'))
  );

-- Admins/owners create invites; members create only when allow_member_invite.
create policy "admins/owners create invites; members when allowed"
  on public.group_invites for insert
  with check (
    invited_by = auth.uid()
    and (
      exists (select 1 from public.group_members gm
              where gm.group_id = group_invites.group_id
                and gm.user_id = auth.uid()
                and gm.role in ('owner','admin'))
      or exists (select 1 from public.groups g, public.group_members gm
                 where g.id = group_invites.group_id and gm.group_id = g.id
                   and gm.user_id = auth.uid() and g.allow_member_invite)
    )
  );

-- Update / delete (revoke) by inviter or by an owner/admin of the group.
create policy "inviter or admins can revoke invites"
  on public.group_invites for update
  using (
    invited_by = auth.uid()
    or exists (select 1 from public.group_members gm
               where gm.group_id = group_invites.group_id
                 and gm.user_id = auth.uid()
                 and gm.role in ('owner','admin'))
  );
create policy "inviter or admins can delete invites"
  on public.group_invites for delete
  using (
    invited_by = auth.uid()
    or exists (select 1 from public.group_members gm
               where gm.group_id = group_invites.group_id
                 and gm.user_id = auth.uid()
                 and gm.role in ('owner','admin'))
  );

-- user_badges: SELECT public (badge wall on profile). INSERT only via trigger
-- using service_role (bypasses RLS).
alter table public.user_badges enable row level security;
create policy "user_badges readable by anyone"
  on public.user_badges for select using (true);

-- xp_events: SELECT only own. INSERT only via trigger using service_role.
alter table public.xp_events enable row level security;
create policy "xp_events readable by self only"
  on public.xp_events for select using (user_id = auth.uid());
