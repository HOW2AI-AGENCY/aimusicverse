import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Calendar, Loader2 } from "lucide-react";
import { format, addDays, addMonths } from '@/lib/date-utils';

interface AdminUserSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    first_name: string;
    last_name?: string | null;
    username?: string | null;
  } | null;
  currentTier?: string;
  currentExpires?: string | null;
  onSuccess?: () => void;
}

const SUBSCRIPTION_TIERS = [
  { value: "free", label: "Free", description: "Бесплатный доступ" },
  { value: "basic", label: "Basic", description: "100 кредитов/мес, -10% скидка" },
  { value: "premium", label: "Premium", description: "300 кредитов/мес, -25% скидка" },
  { value: "enterprise", label: "Enterprise", description: "1000 кредитов/мес, API доступ" },
];

const DURATION_PRESETS = [
  { label: "7 дней", days: 7 },
  { label: "1 месяц", days: 30 },
  { label: "3 месяца", days: 90 },
  { label: "6 месяцев", days: 180 },
  { label: "1 год", days: 365 },
];

export function AdminUserSubscriptionDialog({
  open,
  onOpenChange,
  user,
  currentTier = "free",
  currentExpires,
  onSuccess,
}: AdminUserSubscriptionDialogProps) {
  const [tier, setTier] = useState(currentTier);
  const [expiresAt, setExpiresAt] = useState(
    currentExpires ? format(new Date(currentExpires), "yyyy-MM-dd") : ""
  );
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetClick = (days: number) => {
    const newDate = addDays(new Date(), days);
    setExpiresAt(format(newDate, "yyyy-MM-dd"));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updates: Record<string, unknown> = {
        subscription_tier: tier,
        updated_at: new Date().toISOString(),
      };

      if (tier !== "free" && expiresAt) {
        updates.subscription_expires_at = new Date(expiresAt).toISOString();
      } else if (tier === "free") {
        updates.subscription_expires_at = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.user_id);

      if (error) throw error;

      // Log the action
      await supabase.from("credit_transactions").insert({
        user_id: user.user_id,
        amount: 0,
        transaction_type: "admin_action",
        action_type: "subscription_change",
        description: `Подписка изменена на ${tier}${reason ? `: ${reason}` : ""}`,
        metadata: {
          old_tier: currentTier,
          new_tier: tier,
          expires_at: expiresAt || null,
          reason,
        },
      });

      toast.success("Подписка обновлена");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Ошибка: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Управление подпиской
          </DialogTitle>
          <DialogDescription>
            {user.first_name} {user.last_name}
            {user.username && ` (@${user.username})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Уровень подписки</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите уровень" />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_TIERS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tier !== "free" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Дата окончания
              </Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Причина изменения (опционально)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: Промо-акция, Поддержка..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
