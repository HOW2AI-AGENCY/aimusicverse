import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Send,
  Check,
  RefreshCw,
  Terminal,
  Globe,
  Bell,
  MessageSquare,
  Save,
  Loader2,
  GripVertical,
} from "@/lib/icons";
import { useBotConfig, useUpdateBotConfig, type BotCommand } from "@/hooks/useBotConfig";

export function MobileTelegramBotSettings() {
  const { data: config, isLoading } = useBotConfig();
  const updateConfig = useUpdateBotConfig();

  const [localCommands, setLocalCommands] = useState<BotCommand[]>([]);
  const [localMessages, setLocalMessages] = useState({
    welcome_message: "",
    track_ready_message: "",
    error_message: "",
  });
  const [localNotifications, setLocalNotifications] = useState({
    notifications_enabled: true,
    error_notifications_enabled: true,
    system_notifications_enabled: false,
    rate_limiting_enabled: true,
  });

  // Sync local state with config
  useState(() => {
    if (config) {
      setLocalCommands(config.commands);
      setLocalMessages({
        welcome_message: config.welcome_message,
        track_ready_message: config.track_ready_message,
        error_message: config.error_message,
      });
      setLocalNotifications({
        notifications_enabled: config.notifications_enabled,
        error_notifications_enabled: config.error_notifications_enabled,
        system_notifications_enabled: config.system_notifications_enabled,
        rate_limiting_enabled: config.rate_limiting_enabled,
      });
    }
  });

  const toggleCommand = (index: number) => {
    const newCommands = [...(localCommands.length ? localCommands : config?.commands || [])];
    newCommands[index] = { ...newCommands[index], enabled: !newCommands[index].enabled };
    setLocalCommands(newCommands);
  };

  const saveCommands = () => {
    if (localCommands.length) {
      updateConfig.mutate({ commands: localCommands });
    }
  };

  const saveMessages = () => {
    updateConfig.mutate(localMessages);
  };

  const saveNotifications = () => {
    updateConfig.mutate(localNotifications);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const commands = localCommands.length ? localCommands : config?.commands || [];

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {/* Webhook Status */}
        <AccordionItem value="webhook">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Webhook</span>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Статус</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Активен
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Webhook автоматически настроен через Supabase Edge Functions
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Commands */}
        <AccordionItem value="commands">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span>Команды</span>
              <Badge variant="secondary" className="ml-2">
                {commands.filter((c) => c.enabled).length}/{commands.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 pr-4">
                  {commands.map((cmd, index) => (
                    <div key={cmd.command} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <code className="font-mono text-sm font-medium block truncate">{cmd.command}</code>
                          <span className="text-xs text-muted-foreground block truncate">{cmd.description}</span>
                        </div>
                      </div>
                      <Switch checked={cmd.enabled} onCheckedChange={() => toggleCommand(index)} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button onClick={saveCommands} className="w-full" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить команды
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Notifications */}
        <AccordionItem value="notifications">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Уведомления</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Генерация</Label>
                  <p className="text-xs text-muted-foreground">Треки после генерации</p>
                </div>
                <Switch
                  checked={localNotifications.notifications_enabled}
                  onCheckedChange={(v) => setLocalNotifications((prev) => ({ ...prev, notifications_enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Ошибки</Label>
                  <p className="text-xs text-muted-foreground">Неудачные генерации</p>
                </div>
                <Switch
                  checked={localNotifications.error_notifications_enabled}
                  onCheckedChange={(v) =>
                    setLocalNotifications((prev) => ({ ...prev, error_notifications_enabled: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Системные</Label>
                  <p className="text-xs text-muted-foreground">Технические уведомления</p>
                </div>
                <Switch
                  checked={localNotifications.system_notifications_enabled}
                  onCheckedChange={(v) =>
                    setLocalNotifications((prev) => ({ ...prev, system_notifications_enabled: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Rate limiting</Label>
                  <p className="text-xs text-muted-foreground">Ограничение частоты</p>
                </div>
                <Switch
                  checked={localNotifications.rate_limiting_enabled}
                  onCheckedChange={(v) => setLocalNotifications((prev) => ({ ...prev, rate_limiting_enabled: v }))}
                />
              </div>

              <Button onClick={saveNotifications} className="w-full" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить настройки
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Messages */}
        <AccordionItem value="messages">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Шаблоны сообщений</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Приветствие</Label>
                <Textarea
                  value={localMessages.welcome_message || config?.welcome_message || ""}
                  onChange={(e) => setLocalMessages((prev) => ({ ...prev, welcome_message: e.target.value }))}
                  className="font-mono text-sm min-h-[80px]"
                  placeholder="🎵 Добро пожаловать..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Трек готов</Label>
                <Input
                  value={localMessages.track_ready_message || config?.track_ready_message || ""}
                  onChange={(e) => setLocalMessages((prev) => ({ ...prev, track_ready_message: e.target.value }))}
                  className="font-mono text-sm"
                  placeholder="🎉 Ваш трек готов!"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Ошибка</Label>
                <Input
                  value={localMessages.error_message || config?.error_message || ""}
                  onChange={(e) => setLocalMessages((prev) => ({ ...prev, error_message: e.target.value }))}
                  className="font-mono text-sm"
                  placeholder="😔 Не удалось..."
                />
              </div>

              <Button onClick={saveMessages} className="w-full" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить шаблоны
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
