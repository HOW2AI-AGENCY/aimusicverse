import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Megaphone } from "lucide-react";
import { useBroadcastNotification } from "@/hooks/useBlog";

export function BroadcastPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  
  const broadcast = useBroadcastNotification();

  const handleSend = async () => {
    if (!title || !message) return;
    await broadcast.mutateAsync({ title, message, targetType });
    setTitle("");
    setMessage("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Рассылка уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Заголовок</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок уведомления"
          />
        </div>

        <div>
          <Label>Сообщение</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Текст уведомления..."
            rows={4}
          />
        </div>

        <div>
          <Label>Получатели</Label>
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все пользователи</SelectItem>
              <SelectItem value="premium">Premium пользователи</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSend}
          disabled={broadcast.isPending || !title || !message}
          className="w-full"
        >
          {broadcast.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Отправить всем
        </Button>
      </CardContent>
    </Card>
  );
}
