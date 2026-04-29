"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

// Phase 2 scope: 4 core games. Phase 3 will add reaction/mine/word.
const GameKey = z.enum(["math", "digit", "nback", "stroop"]);

const SubmitSchema = z.object({
  game_key: GameKey,
  // All 4 core games return non-negative integers (counts or accuracy %).
  score: z.coerce.number().int().nonnegative(),
});

export async function submitScoreAction(formData: FormData): Promise<ActionResult> {
  const parse = SubmitSchema.safeParse({
    game_key: formData.get("game_key"),
    score: formData.get("score"),
  });
  if (!parse.success) return { ok: false, error: "Invalid score payload." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Range check against the games catalog so we reject out-of-bounds scores
  // before hitting the DB CHECK. Defense in depth, not the only barrier.
  const { data: game } = await supabase
    .from("games")
    .select("min_score, max_score")
    .eq("key", parse.data.game_key)
    .single();
  if (!game) return { ok: false, error: "Unknown game." };
  if (parse.data.score < Number(game.min_score)) {
    return { ok: false, error: "Score below minimum for this game." };
  }
  if (game.max_score !== null && parse.data.score > Number(game.max_score)) {
    return { ok: false, error: "Score above maximum for this game." };
  }

  const { error } = await supabase.from("submissions").insert({
    user_id: user.id,
    game_key: parse.data.game_key,
    score: parse.data.score,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/today");
  return { ok: true };
}
