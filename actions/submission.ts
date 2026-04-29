"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

// All 7 games. Server-side check; the client also constrains via the registry.
const GameKey = z.enum(["math", "digit", "nback", "stroop", "reaction", "mine", "word"]);

const SubmitSchema = z.object({
  game_key: GameKey,
  // All 7 games return non-negative integers (counts, accuracy %, or seconds).
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

  // process_submission (migration 0007) handles the full transaction:
  // submission insert + daily_aggregates upsert + streak/total_submitted
  // updates. It validates the game key and range against the catalog and
  // raises with a readable error if anything is off. Wire-level RLS still
  // runs on the underlying tables.
  const { error } = await supabase.rpc("process_submission", {
    p_game_key: parse.data.game_key,
    p_score: parse.data.score,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/today");
  return { ok: true };
}

// Click-to-pin / unpin from /today. Toggles a row in user_game_pins.
const PinSchema = z.object({
  game_key: GameKey,
  pinned: z.coerce.boolean(),
});

export async function togglePinAction(formData: FormData): Promise<ActionResult> {
  const parse = PinSchema.safeParse({
    game_key: formData.get("game_key"),
    pinned: formData.get("pinned"),
  });
  if (!parse.success) return { ok: false, error: "Invalid pin payload." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (parse.data.pinned) {
    const { error } = await supabase
      .from("user_game_pins")
      .insert({ user_id: user.id, game_key: parse.data.game_key })
      .select()
      .single();
    // Idempotent: ignore unique-violation if the user clicks twice.
    if (error && error.code !== "23505") return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("user_game_pins")
      .delete()
      .eq("user_id", user.id)
      .eq("game_key", parse.data.game_key);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/today");
  return { ok: true };
}
