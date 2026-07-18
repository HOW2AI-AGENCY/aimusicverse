/**
 * Project deep link handler.
 */
import { getSupabaseClient } from "../../core/supabase-client.ts";
import { sendMessage, sendPhoto } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { getMenuImage } from "../../keyboards/menu-images.ts";
import { logger } from "../../utils/index.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

const supabase = getSupabaseClient();

const statusLabels: Record<string, string> = {
  draft: "📝 Черновик",
  in_progress: "🔄 В работе",
  completed: "✅ Завершён",
  released: "🚀 Выпущен",
  published: "🌐 Опубликован",
};

const typeLabels: Record<string, string> = {
  single: "🎵 Сингл",
  ep: "💿 EP",
  album: "📀 Альбом",
  mixtape: "🎚️ Микстейп",
};

const defaultCover = "https://ygmvthybdrqymfsqifmj.supabase.co/storage/v1/object/public/bot-assets/project-cover.png";

export async function handleProjectDeepLink(chatId: number, userId: number, projectId: string): Promise<void> {
  const { data: project } = await supabase
    .from("music_projects")
    .select("id, title, description, cover_url, genre, mood, status, project_type, user_id, created_at")
    .eq("id", projectId)
    .single();

  if (!project) {
    await sendMessage(chatId, "❌ Проект не найден или был удалён");
    return;
  }

  const { data: projectTracks, count: trackCount } = await supabase
    .from("project_tracks")
    .select("id, track_id", { count: "exact" })
    .eq("project_id", projectId);

  const completedTracks = projectTracks?.filter((t) => t.track_id).length || 0;
  const totalTracks = trackCount || 0;
  const progress = totalTracks > 0 ? Math.round((completedTracks / totalTracks) * 100) : 0;

  const { data: creator } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("user_id", project.user_id)
    .single();

  const creatorName = creator?.display_name || creator?.username || "Unknown";
  const status = statusLabels[project.status || "draft"] || "📝 Черновик";
  const type = typeLabels[project.project_type || "single"] || "🎵 Сингл";
  const progressBar = "█".repeat(Math.round(progress / 10)) + "░".repeat(10 - Math.round(progress / 10));

  const caption = buildMessage({
    title: project.title || "Проект",
    emoji: "📁",
    description: project.description || "Музыкальный проект",
    sections: [
      {
        title: "Детали",
        content: `${type} • ${status}\n👤 ${creatorName}`,
        emoji: "📋",
      },
      {
        title: "Прогресс",
        content: `${progressBar} ${progress}%\n🎵 ${completedTracks}/${totalTracks} треков готово`,
        emoji: "📊",
      },
      ...(project.genre || project.mood
        ? [
            {
              title: "Стиль",
              content: [project.genre, project.mood].filter(Boolean).join(" • "),
              emoji: "🎵",
            },
          ]
        : []),
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть проект",
      emoji: "📁",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=project_${projectId}` },
    })
    .addRow(
      {
        text: "Треки",
        emoji: "🎵",
        action: { type: "callback", data: `project_tracks_${projectId}` },
      },
      {
        text: "Поделиться",
        emoji: "📤",
        action: { type: "callback", data: `project_share_${projectId}` },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  const coverUrl = project.cover_url || defaultCover;

  try {
    await sendPhoto(chatId, coverUrl, { caption, replyMarkup: keyboard });
  } catch (e) {
    const menuImage = await getMenuImage("projects");
    await sendPhoto(chatId, menuImage, { caption, replyMarkup: keyboard });
  }

  await trackDeepLinkAnalytics("project", projectId, userId, true);
}
