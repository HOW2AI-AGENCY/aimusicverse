import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Send } from "@/lib/icons";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useSetupTelegramWebhook } from "@/hooks/telegram/useSetupTelegramWebhook";
import type { TelegramWebhookInfo } from "@/services/telegram/webhook-setup.service";

const botLogger = logger.child({ module: "TelegramBotSetup" });

export const TelegramBotSetup = () => {
  const [webhookInfo, setWebhookInfo] = useState<TelegramWebhookInfo | null>(null);
  const setupWebhookMutation = useSetupTelegramWebhook();

  const setupWebhook = async () => {
    botLogger.info("Setting up Telegram webhook...");
    try {
      const { info, error } = await setupWebhookMutation.mutateAsync();
      if (error) throw error;

      botLogger.info("Webhook configured successfully");
      setWebhookInfo(info);
      toast.success("Telegram бот успешно настроен!");
    } catch (error) {
      botLogger.error("Webhook setup error", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Ошибка настройки бота: " + errorMessage);
    }
  };

  const isWebhookActive = webhookInfo?.webhook_info?.ok && webhookInfo?.webhook_info?.result?.url;

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Telegram Бот
        </CardTitle>
        <CardDescription>Настройте интеграцию с Telegram для получения уведомлений</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isWebhookActive ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <AlertDescription className="text-green-200">
              Бот активен: {webhookInfo?.webhook_info?.result?.url || "URL недоступен"}
            </AlertDescription>
          </Alert>
        ) : webhookInfo && !isWebhookActive ? (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">Бот не настроен или неактивен</AlertDescription>
          </Alert>
        ) : null}

        {webhookInfo && (
          <div className="text-xs text-muted-foreground space-y-1 p-3 rounded bg-background/50">
            <div>
              <strong>URL:</strong> {webhookInfo.webhook_url}
            </div>
            {webhookInfo.webhook_info?.result?.pending_update_count !== undefined && (
              <div>
                <strong>Ожидающих обновлений:</strong> {webhookInfo.webhook_info.result.pending_update_count}
              </div>
            )}
            {webhookInfo.webhook_info?.result?.last_error_message && (
              <div className="text-destructive">
                <strong>Ошибка:</strong> {webhookInfo.webhook_info.result.last_error_message}
              </div>
            )}
          </div>
        )}

        <Button onClick={setupWebhook} disabled={setupWebhookMutation.isPending} className="w-full gap-2">
          {setupWebhookMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Настройка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {webhookInfo ? "Обновить настройки" : "Настроить бота"}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          После настройки бот будет отправлять уведомления о завершении генерации треков
        </p>
      </CardContent>
    </Card>
  );
};
