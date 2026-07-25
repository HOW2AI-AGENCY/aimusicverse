/**
 * Parse audio options from command arguments
 */

export function parseAudioOptions(args: string): {
  prompt?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
} {
  const options: {
    prompt?: string;
    style?: string;
    title?: string;
    instrumental?: boolean;
    model?: string;
  } = {};

  let remaining = args;

  // Parse flags
  const flagRegex = /--([\w]+)(?:=("[^"]+"|'[^']+'|\S+))?/g;
  let match;

  while ((match = flagRegex.exec(args)) !== null) {
    const flag = match[1];
    const value = match[2]?.replace(/^["']|["']$/g, "") || "true";

    switch (flag) {
      case "instrumental":
        options.instrumental = true;
        break;
      case "style":
        options.style = value;
        break;
      case "title":
        options.title = value;
        break;
      case "model":
        options.model = value.toUpperCase();
        break;
    }

    remaining = remaining.replace(match[0], "").trim();
  }

  // Remaining text is the prompt/description
  if (remaining.trim()) {
    options.prompt = remaining.trim();
  }

  return options;
}

/**
 * Get file info from Telegram API
 */
export async function getFileInfo(fileId: string): Promise<any> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });

  const data = await response.json();

  if (!data.ok || !data.result) {
    throw new Error("Failed to get file info from Telegram");
  }

  return data.result;
}

/**
 * Get help text for audio upload commands
 */
export function getAudioUploadHelp(): string {
  return `🎵 *Загрузка аудио*

*Создание кавера:*
/cover \\- базовая команда
/cover энергичный рок \\- с описанием
/cover \\-\\-style="indie rock" \\-\\-instrumental \\- с параметрами

*Расширение трека:*
/extend \\- базовая команда  
/extend \\-\\-title="My Song Part 2" продолжение песни
/extend \\-\\-style="epic orchestra" \\-\\-model=V5

*Параметры:*
\\-\\-style="стиль" \\- музыкальный стиль
\\-\\-title="название" \\- название трека
\\-\\-instrumental \\- без вокала
\\-\\-model=V5 \\- модель генерации

*Поддерживаемые форматы:*
MP3, WAV, OGG, M4A \\(до 25MB\\)`;
}
