/**
 * AdminTelegram - Telegram settings tab
 */
import { BotMenuEditor } from "@/components/admin/BotMenuEditor";
import { MobileTelegramBotSettings } from "@/components/admin/MobileTelegramBotSettings";
import { AdminBotImagesPanel } from "@/components/admin/AdminBotImagesPanel";

export default function AdminTelegram() {
  return (
    <div className="space-y-6">
      <BotMenuEditor />
      <MobileTelegramBotSettings />
      <AdminBotImagesPanel />
    </div>
  );
}
