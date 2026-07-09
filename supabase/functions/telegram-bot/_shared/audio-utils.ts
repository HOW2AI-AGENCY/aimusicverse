/**
 * Shared audio utility functions extracted from handler files
 */

import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("audio-utils");

// --- Types ---

export type AudioType = "instrumental" | "vocal" | "full";
export type VocalGender = "male" | "female" | "duet";

// --- Content type ---

export function resolveContentType(ext: string, mimeType?: string, msgType?: "audio" | "voice" | "document"): string {
  const t = (mimeType || "").toLowerCase();
  if (t.startsWith("audio/")) return t;
  if (msgType === "voice") return "audio/ogg";

  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
    case "oga":
    case "opus":
      return "audio/ogg";
    case "m4a":
    case "mp4":
      return "audio/mp4";
    case "flac":
      return "audio/flac";
    default:
      return "audio/mpeg";
  }
}

// --- Type guard ---

export function isAudioMessage(message: unknown): message is {
  audio?: Record<string, unknown>;
  voice?: Record<string, unknown>;
  document?: Record<string, unknown>;
} {
  const msg = message as Record<string, unknown>;
  if (msg.audio) return true;
  if (msg.voice) return true;
  if (msg.document) {
    const doc = msg.document as Record<string, unknown>;
    const mimeType = (doc.mime_type as string) || "";
    const fileName = (doc.file_name as string) || "";
    if (mimeType.startsWith("audio/")) return true;
    if (/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(fileName)) return true;
  }
  return false;
}

// --- Labels ---

export function getTypeLabel(type: AudioType): string {
  switch (type) {
    case "instrumental":
      return "Инструментал";
    case "vocal":
      return "Только вокал";
    case "full":
      return "Вокал + Инструментал";
    default:
      return "Неизвестно";
  }
}

export function getGenderLabel(gender: VocalGender): string {
  switch (gender) {
    case "male":
      return "Мужской";
    case "female":
      return "Женский";
    case "duet":
      return "Дуэт";
    default:
      return "";
  }
}

// --- File URL ---

export async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });

    const data = await response.json();

    if (!data.ok || !data.result?.file_path) {
      logger.warn("getFile failed", { data });
      return null;
    }

    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  } catch (error) {
    logger.error("Error getting file URL", error);
    return null;
  }
}
