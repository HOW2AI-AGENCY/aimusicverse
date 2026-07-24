// Telegram progress notifications with throttling

let lastProgressUpdate = 0;
const PROGRESS_THROTTLE_MS = 3000;

export function resetTelegramThrottle() {
  lastProgressUpdate = 0;
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

export async function sendTelegramProgress(
  chatId: number,
  text: string,
  messageId?: number,
  forceUpdate = false,
): Promise<number | undefined> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken || !chatId) return messageId;

  const now = Date.now();
  if (!forceUpdate && messageId && now - lastProgressUpdate < PROGRESS_THROTTLE_MS) {
    console.log("⏳ Throttling Telegram update, skipping...");
    return messageId;
  }
  lastProgressUpdate = now;

  try {
    if (messageId) {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "MarkdownV2" }),
      });
      const data = await response.json();
      if (!data.ok) {
        console.warn("⚠️ Failed to edit message:", data.description);
        if (data.error_code === 400) {
          console.log("📤 Sending new message instead...");
          const newResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" }),
          });
          const newData = await newResponse.json();
          return newData.ok ? newData.result?.message_id : undefined;
        }
        return messageId;
      }
      return data.ok ? messageId : undefined;
    } else {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" }),
      });
      const data = await response.json();
      return data.ok ? data.result?.message_id : undefined;
    }
  } catch (error) {
    console.error("Failed to send Telegram progress:", error);
    return messageId;
  }
}
