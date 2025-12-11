import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, Plus, Minus } from "lucide-react";

interface AdminUserCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    username: string | null;
    photo_url: string | null;
  } | null;
  onSuccess: () => void;
}

export function AdminUserCreditsDialog({ 
  open, 
  onOpenChange, 
  user,
  onSuccess 
}: AdminUserCreditsDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<"add" | "subtract">("add");

  const handleSubmit = async () => {
    if (!user || !amount) return;
    
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }

    setIsLoading(true);
    try {
      const finalAmount = operation === "add" ? numAmount : -numAmount;
      
      // Get current credits
      const { data: currentCredits } = await supabase
        .from("user_credits")
        .select("balance, total_earned")
        .eq("user_id", user.user_id)
        .single();

      if (!currentCredits) {
        // Create record if doesn't exist
        await supabase.from("user_credits").insert({
          user_id: user.user_id,
          balance: Math.max(0, finalAmount),
          total_earned: operation === "add" ? numAmount : 0,
        });
      } else {
        const newBalance = Math.max(0, currentCredits.balance + finalAmount);
        const newTotalEarned = operation === "add" 
          ? currentCredits.total_earned + numAmount 
          : currentCredits.total_earned;

        await supabase
          .from("user_credits")
          .update({
            balance: newBalance,
            total_earned: newTotalEarned,
          })
          .eq("user_id", user.user_id);
      }

      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: user.user_id,
        amount: Math.abs(finalAmount),
        transaction_type: operation === "add" ? "earn" : "spend",
        action_type: "admin_adjustment",
        description: reason || `Административная ${operation === "add" ? "выдача" : "списание"} кредитов`,
        metadata: { admin_reason: reason },
      });

      toast.success(`${operation === "add" ? "Начислено" : "Списано"} ${numAmount} кредитов`);
      setAmount("");
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Credit adjustment error:", error);
      toast.error("Ошибка при изменении баланса");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Управление кредитами
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Avatar>
              <AvatarImage src={user.photo_url || undefined} />
              <AvatarFallback>{user.first_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.first_name} {user.last_name}</div>
              <div className="text-sm text-muted-foreground">@{user.username || "—"}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={operation === "add" ? "default" : "outline"}
              onClick={() => setOperation("add")}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Начислить
            </Button>
            <Button
              variant={operation === "subtract" ? "destructive" : "outline"}
              onClick={() => setOperation("subtract")}
              className="flex-1"
            >
              <Minus className="h-4 w-4 mr-1" />
              Списать
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Количество кредитов</Label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label>Причина (опционально)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Бонус за активность..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !amount}
            variant={operation === "subtract" ? "destructive" : "default"}
          >
            {isLoading ? "Сохранение..." : operation === "add" ? "Начислить" : "Списать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
