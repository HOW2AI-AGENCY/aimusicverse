/**
 * Subscription Required Dialog
 * Shows when free users try to make tracks private
 */

import { motion } from "@/lib/motion";
import { Lock, Star, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubscriptionRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function SubscriptionRequiredDialog({
  open,
  onOpenChange,
  feature = "сделать треки приватными",
}: SubscriptionRequiredDialogProps) {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <Lock className="w-8 h-8 text-amber-500" />
          </motion.div>

          <DialogTitle className="text-xl">Требуется подписка</DialogTitle>
          <DialogDescription className="text-center">
            Чтобы {feature}, необходимо оформить подписку Pro или выше
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <motion.div
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Приватные треки</p>
                <p className="text-xs text-muted-foreground">Скрывайте творчество от публики</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Больше кредитов</p>
                <p className="text-xs text-muted-foreground">До 300 кредитов ежемесячно</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Премиум функции</p>
                <p className="text-xs text-muted-foreground">MIDI экспорт, приоритет генерации</p>
              </div>
            </motion.div>
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
            <p className="text-amber-600 dark:text-amber-400">
              💡 На бесплатном тарифе все треки автоматически публикуются в сообществе
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSubscribe} className="gap-2">
            <Star className="w-4 h-4" />
            Оформить подписку
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Может позже
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
