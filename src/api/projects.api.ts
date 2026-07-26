/**
 * Projects API Layer
 * Raw Supabase database operations for music projects
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["music_projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["music_projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["music_projects"]["Update"];
export type ProjectTrackRow = Database["public"]["Tables"]["project_tracks"]["Row"];

/**
 * Fetch all projects for a user
 */
export async function fetchUserProjects(userId: string): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("music_projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch single project by ID
 */
export async function fetchProjectById(projectId: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase.from("music_projects").select("*").eq("id", projectId).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectInsert): Promise<ProjectRow> {
  const { data, error } = await supabase.from("music_projects").insert(project).select().single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update project
 */
export async function updateProject(projectId: string, updates: ProjectUpdate): Promise<ProjectRow> {
  const { data, error } = await supabase.from("music_projects").update(updates).eq("id", projectId).select().single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("music_projects").delete().eq("id", projectId);

  if (error) throw new Error(error.message);
}

/**
 * Count the number of music projects owned by the user.
 */
export async function countUserProjects(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("music_projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Check if user is premium or admin
 */
export async function checkPremiumStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_premium_or_admin", {
    _user_id: userId,
  });

  if (error) return false;
  return !!data;
}

/**
 * Fetch project tracks
 */
export async function fetchProjectTracks(projectId: string): Promise<ProjectTrackRow[]> {
  const { data, error } = await supabase
    .from("project_tracks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Generate project concept using AI
 */
export async function generateProjectConcept(params: {
  projectType: string;
  genre?: string;
  mood?: string;
  targetAudience?: string;
  theme?: string;
  artistPersona?: string;
}): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke("project-ai", {
    body: {
      action: "concept",
      ...params,
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update arbitrary project fields (used by wizard / editors)
 */
export async function updateProjectFields(projectId: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("music_projects")
    .update(updates as ProjectUpdate)
    .eq("id", projectId);
  if (error) throw new Error(error.message);
}

/**
 * Update project cover_url (set or clear)
 */
export async function updateProjectCover(projectId: string, coverUrl: string | null): Promise<void> {
  const { error } = await supabase.from("music_projects").update({ cover_url: coverUrl }).eq("id", projectId);
  if (error) throw new Error(error.message);
}

/**
 * Update project banner fields
 */
export async function updateProjectBanner(
  projectId: string,
  params: { bannerUrl: string; bannerPrompt: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("music_projects")
    .update({ banner_url: params.bannerUrl, banner_prompt: params.bannerPrompt })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
}

/**
 * Invoke project-ai edge function with arbitrary action payload
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Edge function return type is heterogeneous; callers narrow via service layer */
export async function invokeProjectAi(payload: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("project-ai", { body: payload });
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Invoke generate-cover-image edge function
 */
export async function invokeGenerateCoverImage(
  payload: Record<string, unknown>,
): Promise<{ data: unknown; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("generate-cover-image", { body: payload });
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Invoke generate-project-media edge function (banner / artwork)
 */
export async function invokeGenerateProjectMedia(
  payload: Record<string, unknown>,
): Promise<{ data: unknown; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("generate-project-media", { body: payload });
  return { data, error: error ? new Error(error.message) : null };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
