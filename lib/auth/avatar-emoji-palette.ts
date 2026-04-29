// Curated single-grapheme emoji palette for the AvatarEditor (#48 follow-up).
// Desktop browsers don't expose an emoji picker on <input>, so we render
// this grid alongside the text input. Each entry must be exactly one
// extended grapheme — validated by lib/auth/avatar-emoji.ts on save.
//
// Selection criteria: avatar-friendly (recognizable at 28-64px), broad
// coverage of common identity choices (faces, brain/cognition, animals,
// activities, symbols), all single-grapheme so they pass validation.

export const AVATAR_EMOJI_PALETTE: readonly string[] = [
  // faces / personas
  "🙂", "😎", "🤓", "😄", "🤔", "🥳", "😇", "🤖", "👾", "👻",
  // brain / focus
  "🧠", "💡", "🎯", "⚡", "✨", "🔥", "⭐", "🚀", "💎", "🏆",
  // animals
  "🐱", "🐶", "🦊", "🐺", "🐻", "🦁", "🐯", "🐼", "🦄", "🐉",
  // play / activities
  "🎮", "🎲", "🎨", "📚", "🎵", "⚽", "🏀", "🃏", "🎭", "🧩",
  // nature / symbols
  "🌸", "🌟", "🌙", "☀️", "❤️", "💙", "💚", "💜", "⚪", "⚫",
];
