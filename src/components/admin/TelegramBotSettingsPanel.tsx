import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Settings as SettingsIcon, 
  Check, 
  X, 
  RefreshCw,
  Terminal,
  Globe,
  Bell,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface BotCommand {
  command: string;
  description: string;
  enabled: boolean;
}

export function TelegramBotSettingsPanel() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [botCommands, setBotCommands] = useState<BotCommand[]>([
    { command: "/start", description: "Запустить бота", enabled: true },
    { command: "/help", description: "Справка по командам", enabled: true },
    { command: "/generate", description: "Создать трек", enabled: true },
    { command: "/library", description: "Моя библиотека", enabled: true },
    { command: "/status", description: "Статус генерации", enabled: true },
    { command: "/settings", description: "Настройки", enabled: true },
    { command: "/terms", description: "Условия использования", enabled: true },
    { command: "/privacy", description: "Политика конфиденциальности", enabled: true },
    { command: "/about", description: "О приложении", enabled: true },
    { command: "/cover", description: "Создать кавер", enabled: true },
    { command: "/extend", description: "Расширить трек", enabled: true },
    { command: "/cancel", description: "Отменить загрузку", enabled: true },
  ]);

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Webhook работает корректно");
    } catch (error) {
      toast.error("Ошибка проверки webhook");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const toggleCommand = (index: number) => {
    const newCommands = [...botCommands];
    newCommands[index].enabled = !newCommands[index].enabled;
    setBotCommands(newCommands);
    toast.success(`Команда ${newCommands[index].command} ${newCommands[index].enabled ? 'включена' : 'отключена'}`);
  };

  const updateBotCommands = async () => {
    try {
      // Simulate API call to update bot commands
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Команды бота обновлены");
    } catch (error) {
      toast.error("Ошибка обновления команд");
    }
  };

  return (
    <div className="space-y-6">
      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Конфигурация Webhook
          </CardTitle>
          <CardDescription>
            Настройка endpoint для получения обновлений от Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/api/telegram-bot"
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || !webhookUrl}
                size="icon"
              >
                {isTestingWebhook ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Webhook активен</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              200 OK
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bot Commands */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Команды бота
              </CardTitle>
              <CardDescription>
                Управление доступными командами ({botCommands.filter(c => c.enabled).length}/{botCommands.length} активны)
              </CardDescription>
            </div>
            <Button onClick={updateBotCommands} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {botCommands.map((cmd, index) => (
                <div
                  key={cmd.command}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-sm font-medium">{cmd.command}</code>
                    <span className="text-sm text-muted-foreground">{cmd.description}</span>
                  </div>
                  <Switch
                    checked={cmd.enabled}
                    onCheckedChange={() => toggleCommand(index)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Настройки уведомлений
          </CardTitle>
          <CardDescription>
            Глобальные настройки отправки уведомлений через бота
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Уведомления о генерации</Label>
              <p className="text-sm text-muted-foreground">
                Отправлять треки пользователям после генерации
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Уведомления об ошибках</Label>
              <p className="text-sm text-muted-foreground">
                Информировать о неудачных генерациях
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Системные уведомления</Label>
              <p className="text-sm text-muted-foreground">
                Технические уведомления и обновления
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Rate limiting</Label>
              <p className="text-sm text-muted-foreground">
                Ограничение частоты отправки сообщений
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Message Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Формат сообщений
          </CardTitle>
          <CardDescription>
            Настройка шаблонов сообщений бота
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Приветственное сообщение</Label>
            <Input 
              defaultValue="🎵 Добро пожаловать в MusicVerse AI!"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Сообщение о готовности трека</Label>
            <Input 
              defaultValue="🎉 Ваш трек готов!"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Сообщение об ошибке</Label>
            <Input 
              defaultValue="😔 Не удалось создать трек"
              className="font-mono text-sm"
            />
          </div>

          <Button variant="outline" className="w-full">
            <Check className="h-4 w-4 mr-2" />
            Сохранить шаблоны
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
