/**
 * Prompt history API — DB-backed generation history entries.
 */

import { supabase } from "@/integrations/supabase/client";

export async function deletePromptHistoryEntry(id: string): Promise<void> {
  const { error } = await supabase.from("user_generation_history").delete().eq("id", id);
  if (error) throw error;
}

export async function clearPromptHistoryForUser(userId: string): Promise<void> {
  const { error } = await supabase.from("user_generation_history").delete().eq("user_id", userId);
  if (error) throw error;
}
