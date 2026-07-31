import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";

const supabase = getSupabaseClient();
const logger = createLogger("notification-utils");

export async function sendTelegramResults(task: any, clips: any[], trackId: string, trackTitle: string) {
  // Delete progress message
  if (task.telegram_message_id) {
    try {
      await supabase.functions.invoke("send-telegram-notification", {
        body: { type: "delete_progress", chatId: task.telegram_chat_id, messageId: task.telegram_message_id },
      });
    } catch (e) {
      /* best-effort */
    }
  }

  // Wait for cover
  await new Promise((r) => setTimeout(r, 6000));

  const { data: fresh } = await supabase
    .from("tracks")
    .select("title, style, cover_url, local_cover_url, tags")
    .eq("id", trackId)
    .single();
  const cover = fresh?.local_cover_url || fresh?.cover_url;
  let title = fresh?.title || clips[0]?.title;
  if (!title || title === "Untitled" || title === "Трек") {
    title =
      (task.prompt || "")
        .split("\n")
        .filter((l: string) => l.trim())[0]
        ?.substring(0, 60)
        .trim()
        .replace(/^(create|generate|make)\s+/i, "") || "AI Music Track";
  }

  const maxClips = Math.min(clips.length, 2);
  const audioClipsData = [];
  for (let i = 0; i < maxClips; i++) {
    const c = clips[i];
    const lyrics = (c.prompt || task.prompt || "")
      .split("\n")
      .filter((l: string) => l.trim() && !l.trim().startsWith("["))
      .slice(0, 2)
      .join("\n")
      .substring(0, 150);
    audioClipsData.push({
      audioUrl: c.audioUrl,
      title: `${title} (${["A", "B"][i]})`,
      duration: c.duration,
      versionLabel: ["A", "B"][i],
      lyricsPreview: lyrics,
      coverUrl: cover,
    });
  }

  try {
    const { error } = await supabase.functions.invoke("send-telegram-notification", {
      body: {
        type: "generation_complete_multi",
        chatId: task.telegram_chat_id,
        trackId,
        coverUrl: cover,
        title,
        audioClips: audioClipsData,
        tags: fresh?.tags || clips[0]?.tags,
        style: fresh?.style || task.tracks?.style,
        versionsCount: clips.length,
      },
    });
    if (error) {
      // Fallback: single notifications
      for (let i = 0; i < maxClips; i++) {
        await supabase.functions.invoke("send-telegram-notification", {
          body: {
            type: "generation_complete",
            chatId: task.telegram_chat_id,
            trackId,
            audioUrl: audioClipsData[i].audioUrl,
            coverUrl: cover,
            title: audioClipsData[i].title,
            duration: audioClipsData[i].duration,
            tags: fresh?.tags || clips[0]?.tags,
            style: fresh?.style,
            versionLabel: audioClipsData[i].versionLabel,
            currentVersion: i + 1,
            totalVersions: maxClips,
          },
        });
        if (i < maxClips - 1) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  } catch (e) {
    logger.error("Telegram notification error", e);
  }
}
