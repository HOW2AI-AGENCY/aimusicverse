import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onClearSelection
}: AdminSendMessageDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Введите текст сообщения");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Выберите получателей");
      return;
    }

    setIsLoading(true);
    try {
      // Get profiles with telegram_chat_id for selected users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, telegram_chat_id")
        .in("user_id", selectedUsers.map(u => u.user_id));

      const usersWithChat = profiles?.filter(p => p.telegram_chat_id) || [];
      
      if (usersWithChat.length === 0) {
        toast.error("У выбранных пользователей нет Telegram chat_id");
        return;
      }

      // Send messages via edge function
      const { error } = await supabase.functions.invoke("send-admin-message", {
        body: {
          chat_ids: usersWithChat.map(p => p.telegram_chat_id),
          title: title.trim() || undefined,
          message: message.trim(),
        },
      });

      if (error) throw error;

      toast.success(`Сообщение отправлено ${usersWithChat.length} пользователям`);
      setTitle("");
      setMessage("");
      onOpenChange(false);
      onClearSelection();
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Ошибка при отправке сообщения");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="📢 Важное объявление"
            />
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
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !message.trim() || selectedUsers.length === 0}
          >
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
