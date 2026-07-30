/**
 * Mashup service — обёртка над edge-функцией `suno-mashup`.
 *
 * Компоненты не должны обращаться к supabase напрямую (layer-boundary),
 * поэтому вызов вынесен в сервисный слой.
 */

import { supabase } from "@/integrations/supabase/client";

export interface MashupRequest {
  uploadUrlList: string[];
  customMode: boolean;
  prompt?: string;
  style?: string;
  title: string;
  instrumental?: boolean;
  model?: string;
}

export interface MashupResponse {
  taskId?: string;
  [key: string]: unknown;
}

export async function createMashup(request: MashupRequest): Promise<MashupResponse> {
  const { data, error } = await supabase.functions.invoke("suno-mashup", { body: request });
  if (error) throw new Error(error.message || "Mashup failed");
  return (data ?? {}) as MashupResponse;
}
