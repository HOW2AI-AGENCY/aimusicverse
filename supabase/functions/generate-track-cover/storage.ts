// Storage / DB side-effects for cover generation.
// Uploads bytes, updates track + versions, writes audit log.

export interface PersistCoverInput {
  supabase: any;
  trackId: string;
  userId?: string;
  binaryData: Uint8Array;
  provider: "lovable" | "replicate";
  model: string;
  promptUsed: string;
  audit: {
    title?: string;
    style?: string;
    mood?: string;
    projectId?: string;
    customPrompt: boolean;
  };
}

export async function persistCover(input: PersistCoverInput): Promise<string> {
  const { supabase, trackId, userId, binaryData, provider, model, promptUsed, audit } = input;

  const coverFileName = `covers/${userId || "system"}/${trackId}_cover_${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(coverFileName, binaryData, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("❌ Upload error:", uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const publicUrl = supabase.storage.from("project-assets").getPublicUrl(coverFileName).data.publicUrl;
  console.log(`✅ Cover uploaded via ${provider}: ${publicUrl}`);

  const { error: trackUpdateError } = await supabase
    .from("tracks")
    .update({
      cover_url: publicUrl,
      local_cover_url: publicUrl,
    })
    .eq("id", trackId);

  if (trackUpdateError) {
    console.error("❌ Track update error:", trackUpdateError);
  } else {
    console.log("✅ Track cover updated");
  }

  const { error: versionsUpdateError } = await supabase
    .from("track_versions")
    .update({ cover_url: publicUrl })
    .eq("track_id", trackId);

  if (versionsUpdateError) {
    console.error("❌ Versions update error:", versionsUpdateError);
  } else {
    console.log("✅ All track versions updated with new cover");
  }

  await supabase.from("content_audit_log").insert({
    entity_type: "cover",
    entity_id: trackId,
    user_id: userId || "system",
    actor_type: "ai",
    ai_model_used: model,
    action_type: "generated",
    action_category: "generation",
    prompt_used: promptUsed,
    input_metadata: {
      title: audit.title,
      style: audit.style,
      mood: audit.mood,
      project_id: audit.projectId,
      custom_prompt: audit.customPrompt,
    },
    output_metadata: {
      cover_url: publicUrl,
      storage_path: coverFileName,
      provider,
    },
  });

  console.log(`[generate-track-cover] ✅ Audit logged for cover generation`);
  return publicUrl;
}

export async function loadProjectContext(
  supabase: any,
  trackId: string,
  explicitProjectId?: string,
) {
  let resolvedProjectId = explicitProjectId;
  if (!resolvedProjectId) {
    const { data: trackData } = await supabase.from("tracks").select("project_id").eq("id", trackId).single();
    resolvedProjectId = trackData?.project_id;
  }

  if (!resolvedProjectId) return {};

  const { data: project } = await supabase
    .from("music_projects")
    .select("title, genre, mood, concept, description, visual_aesthetic")
    .eq("id", resolvedProjectId)
    .single();

  if (!project) return {};

  console.log(`📁 Project context loaded: ${project.title}, visual: ${project.visual_aesthetic || "none"}`);

  return {
    genre: project.genre,
    mood: project.mood,
    concept: project.concept || project.description,
    title: project.title,
    visualAesthetic: project.visual_aesthetic,
  };
}
