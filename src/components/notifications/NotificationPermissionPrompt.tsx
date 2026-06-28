import { memo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Bell } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationPermissionPromptProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
}

export const NotificationPermissionPrompt = memo(function NotificationPermissionPrompt({
  visible,
  onAccept,
  onDecline,
  className,
}: NotificationPermissionPromptProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            "flex items-start gap-4 p-4 rounded-2xl",
            "bg-muted/80 border border-border/60 backdrop-blur-sm",
            className,
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Уведомления о генерации</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Разрешите уведомления, чтобы узнавать о завершении генерации, даже когда приложение свёрнуто
            </p>
            <div className="flex gap-2 mt-3">
              <Button onClick={onAccept} size="sm" className="text-xs h-8">
                Разрешить
              </Button>
              <Button onClick={onDecline} variant="ghost" size="sm" className="text-xs h-8">
                Не сейчас
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
