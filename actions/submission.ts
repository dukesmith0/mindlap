"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ptDate } from "@/lib/pt-date";
import { isBonusGame } from "@/lib/daily-bonus";

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export type SubmitScoreData = {
  xpAwarded: number;
  isNewPb: boolean;
  best: number;
  streakCurrent: number;
};

// All 7 games. Server-side check; the client also constrains via the registry.
const GameKey = z.enum(["math", "digit", "nback", "stroop", "reaction", "mine", "word"]);

const SubmitSchema = z.object({
  game_key: GameKey,
  // All 7 games return non-negative integers (counts, accuracy %, or seconds).
  score: z.coerce.number().int().nonnegative(),
});

export async function submitScoreAction(
  formData: FormData
): Promise<ActionResult<SubmitScoreData>> {
  const parse = SubmitSchema.safeParse({
    game_key: formData.get("game_key"),
    score: formData.get("score"),
  });
  if (!parse.success) return { ok: false, error: "Invalid score payload." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Resolve today's bonus pair server-side from the deterministic generator.
  // Phase 4.5 may move this into PG so the DB also enforces it.
  const isBonus = isBonusGame(ptDate(), parse.data.game_key);

  // process_submission (migrations 0007 + 0008 + 0010) handles the full tx:
  // submission insert + aggregates upsert + streak update + xp_events writes
  // (participation cap, PB bonus, streak mult, 2x bonus) + badge eval.
  // Returns a jsonb object (0010 fixed an OUT-param column-name collision).
  const { data, error } = await supabase.rpc("process_submission", {
    p_game_key: parse.data.game_key,
    p_score: parse.data.score,
    p_is_bonus_game: isBonus,
  });
  if (error) return { ok: false, error: error.message };

  type ProcessResult = {
    best: number;
    streak_current: number;
    xp_awarded: number;
    is_new_pb: boolean;
  };
  const row = (data ?? {}) as ProcessResult;

  revalidatePath("/today");
  return {
    ok: true,
    data: {
      xpAwarded: Number(row.xp_awarded ?? 0),
      isNewPb: !!row.is_new_pb,
      best: Number(row.best ?? parse.data.score),
      streakCurrent: Number(row.streak_current ?? 0),
    },
  };
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
