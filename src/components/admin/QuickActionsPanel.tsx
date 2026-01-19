/**
 * QuickActionsPanel - Fast access to common admin actions
 * Mobile-optimized with large touch targets
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UnifiedDialog } from "@/components/dialog/unified-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Zap, 
  Send, 
  Coins, 
  Gift,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useUpdateEconomyConfig } from "@/hooks/admin/useEconomyConfig";
import { useToggleFeatureFlag, useFeatureFlags } from "@/hooks/admin/useFeatureFlags";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

// Quick broadcast mutation
function useQuickBroadcast() {
  return useMutation({
    mutationFn: async ({ title, message }: { title: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'broadcast',
          title,
          message,
          target_type: 'all'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Рассылка отправлена", {
        description: `Доставлено: ${data?.sent_count || 0} пользователям`
      });
    },
    onError: (err) => {
      toast.error("Ошибка рассылки", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка"
      });
    }
  });
}

// Quick credit mutation - uses direct table updates (like AdminUserCreditsDialog)
function useQuickCredit() {
  return useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      // Get all users with credits
      const { data: users, error: fetchError } = await supabase
        .from("user_credits")
        .select("user_id, balance, total_earned");
      
      if (fetchError) throw fetchError;
      
      // Update each user's balance
      for (const user of users || []) {
        await supabase
          .from("user_credits")
          .update({
            balance: user.balance + amount,
            total_earned: user.total_earned + amount,
          })
          .eq("user_id", user.user_id);
        
        // Log transaction
        await supabase.from("credit_transactions").insert({
          user_id: user.user_id,
          amount: amount,
          transaction_type: "earn",
          action_type: "admin_bulk_bonus",
          description: reason || "Бонус от администрации",
        });
      }
      
      return { amount, count: users?.length || 0 };
    },
    onSuccess: ({ amount, count }) => {
      toast.success("Кредиты начислены", {
        description: `+${amount} кредитов для ${count} пользователей`
      });
    },
    onError: (err) => {
      toast.error("Ошибка начисления", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка"
      });
    }
  });
}

export function QuickActionsPanel() {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Credit form state
  const [creditAmount, setCreditAmount] = useState("10");
  const [creditReason, setCreditReason] = useState("Бонус от администрации");

  // Cost form state
  const [newCost, setNewCost] = useState("10");

  // Feature toggle state
  const [selectedFeature, setSelectedFeature] = useState("");

  const quickBroadcast = useQuickBroadcast();
  const quickCredit = useQuickCredit();
  const updateConfig = useUpdateEconomyConfig();
  const toggleFeature = useToggleFeatureFlag();
  const { data: features } = useFeatureFlags();

  const handleBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    quickBroadcast.mutate({ 
      title: broadcastTitle, 
      message: broadcastMessage 
    }, {
      onSuccess: () => {
        setBroadcastOpen(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
      }
    });
  };

  const handleCredit = () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }
    quickCredit.mutate({ 
      amount, 
      reason: creditReason 
    }, {
      onSuccess: () => {
        setCreditOpen(false);
        setCreditAmount("10");
      }
    });
  };

  const handleCostChange = () => {
    const cost = parseInt(newCost);
    if (isNaN(cost) || cost <= 0) {
      toast.error("Введите корректную стоимость");
      return;
    }
    updateConfig.mutate({ 
      key: "GENERATION_COST", 
      value: cost 
    }, {
      onSuccess: () => {
        setCostOpen(false);
      }
    });
  };

  const handleFeatureToggle = () => {
    const feature = features?.find(f => f.key === selectedFeature);
    if (!feature) {
      toast.error("Выберите функцию");
      return;
    }
    toggleFeature.mutate({ 
      id: feature.id, 
      enabled: !feature.enabled 
    }, {
      onSuccess: () => {
        setFeatureOpen(false);
        setSelectedFeature("");
      }
    });
  };

  const actions: QuickAction[] = [
    {
      id: "broadcast",
      label: "Рассылка",
      description: "Отправить сообщение всем",
      icon: <Send className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
      onClick: () => setBroadcastOpen(true),
    },
    {
      id: "credit",
      label: "Начислить",
      description: "Кредиты пользователям",
      icon: <Gift className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      onClick: () => setCreditOpen(true),
    },
    {
      id: "cost",
      label: "Стоимость",
      description: "Изменить цену генерации",
      icon: <Coins className="h-5 w-5" />,
      color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
      onClick: () => setCostOpen(true),
    },
    {
      id: "feature",
      label: "Функция",
      description: "Включить/выключить",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
      onClick: () => setFeatureOpen(true),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-amber-500" />
            Быстрые действия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors min-h-[88px] ${action.color}`}
              >
                {action.icon}
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Dialog */}
      <UnifiedDialog
        variant="sheet"
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        title="Быстрая рассылка"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Заголовок</Label>
            <Input
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="Важное обновление!"
            />
          </div>
          <div className="space-y-2">
            <Label>Сообщение</Label>
            <Textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Текст сообщения..."
              rows={4}
            />
          </div>
          <Button 
            onClick={handleBroadcast} 
            disabled={quickBroadcast.isPending}
            className="w-full"
          >
            {quickBroadcast.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Отправить всем
          </Button>
        </div>
      </UnifiedDialog>

      {/* Credit Dialog */}
      <UnifiedDialog
        variant="sheet"
        open={creditOpen}
        onOpenChange={setCreditOpen}
        title="Начислить кредиты"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Количество кредитов</Label>
            <Input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Input
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="Причина начисления"
            />
          </div>
          <Button 
            onClick={handleCredit} 
            disabled={quickCredit.isPending}
            className="w-full"
          >
            {quickCredit.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Gift className="h-4 w-4 mr-2" />
            )}
            Начислить всем
          </Button>
        </div>
      </UnifiedDialog>

      {/* Cost Dialog */}
      <UnifiedDialog
        variant="sheet"
        open={costOpen}
        onOpenChange={setCostOpen}
        title="Стоимость генерации"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Новая стоимость (кредитов)</Label>
            <Input
              type="number"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              min="1"
            />
          </div>
          <Button 
            onClick={handleCostChange} 
            disabled={updateConfig.isPending}
            className="w-full"
          >
            {updateConfig.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </UnifiedDialog>

      {/* Feature Toggle Dialog */}
      <UnifiedDialog
        variant="sheet"
        open={featureOpen}
        onOpenChange={setFeatureOpen}
        title="Управление функцией"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Выберите функцию</Label>
            <Select value={selectedFeature} onValueChange={setSelectedFeature}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                {features?.map((feature) => (
                  <SelectItem key={feature.key} value={feature.key}>
                    <div className="flex items-center gap-2">
                      <span>{feature.icon}</span>
                      <span>{feature.name}</span>
                      <Badge variant={feature.enabled ? "default" : "secondary"} className="ml-2 text-xs">
                        {feature.enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedFeature && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {features?.find(f => f.key === selectedFeature)?.enabled 
                  ? "Функция сейчас ВКЛЮЧЕНА. Нажмите чтобы выключить."
                  : "Функция сейчас ВЫКЛЮЧЕНА. Нажмите чтобы включить."}
              </p>
            </div>
          )}
          <Button 
            onClick={handleFeatureToggle} 
            disabled={toggleFeature.isPending || !selectedFeature}
            className="w-full"
            variant={features?.find(f => f.key === selectedFeature)?.enabled ? "destructive" : "default"}
          >
            {toggleFeature.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {features?.find(f => f.key === selectedFeature)?.enabled ? "Выключить" : "Включить"}
          </Button>
        </div>
      </UnifiedDialog>
    </>
  );
}
