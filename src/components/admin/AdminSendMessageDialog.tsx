import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, MessageSquare, X } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/lib/logger";
import { useSendAdminMessage } from "@/hooks/admin/useSendAdminMessage";

interface User {
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  telegram_chat_id?: number | null;
}

interface AdminSendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: User[];
  onClearSelection: () => void;
}

export function AdminSendMessageDialog({
  open,
  onOpenChange,
  selectedUsers,
  onClearSelection,
}: AdminSendMessageDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const sendMessage = useSendAdminMessage();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Введите текст сообщения");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Выберите получателей");
      return;
    }

    try {
      const { sent } = await sendMessage.mutateAsync({
        userIds: selectedUsers.map((u) => u.user_id),
        title: title.trim() || undefined,
        message: message.trim(),
      });

      toast.success(`Сообщение отправлено ${sent} пользователям`);
      setTitle("");
      setMessage("");
      onOpenChange(false);
      onClearSelection();
    } catch (error: unknown) {
      logger.error("Send message error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка при отправке сообщения");
    }
  };

  const isLoading = sendMessage.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Отправить сообщение
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Получатели ({selectedUsers.length})</Label>
            <ScrollArea className="h-24 rounded-md border p-2">
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.user_id} variant="secondary" className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.photo_url || undefined} />
                      <AvatarFallback className="text-[8px]">{user.first_name[0]}</AvatarFallback>
                    </Avatar>
                    {user.first_name}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label>Заголовок (опционально)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="📢 Важное объявление" />
          </div>

          <div className="space-y-2">
            <Label>Сообщение *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Текст сообщения..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !message.trim() || selectedUsers.length === 0}>
            {isLoading ? (
              "Отправка..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Отправить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
