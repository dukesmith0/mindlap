-- 0013: optional emoji glyph for avatars (#48 avatar identity rework).
-- Color stays in avatar_color; if emoji is set, the UI renders it instead of
-- the display-name initial. Length cap is generous (32) to allow ZWJ + tone
-- sequences; app-side enforces single-grapheme.

alter table public.profiles
  add column if not exists avatar_emoji text;

alter table public.profiles
  add constraint profiles_avatar_emoji_len
  check (avatar_emoji is null or char_length(avatar_emoji) between 1 and 32);
