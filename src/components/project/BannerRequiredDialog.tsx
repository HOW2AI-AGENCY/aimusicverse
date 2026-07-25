import { useState, useEffect } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image, Sparkles, ArrowRight, X, AlertTriangle } from "@/lib/icons";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BannerRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  onCreateBanner: () => void;
}

export function BannerRequiredDialog({ open, onOpenChange, projectTitle, onCreateBanner }: BannerRequiredDialogProps) {
  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={onOpenChange}
      title="Добавьте баннер проекта"
      description={`Проект «${projectTitle}» опубликован, но у него нет баннера для показа в ленте`}
      size="md"
    >
      <div className="space-y-4">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </motion.div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-medium">Больше просмотров</p>
            <p className="text-[0.625rem] text-muted-foreground">Баннеры привлекают внимание</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-generate/10 flex items-center justify-center mx-auto">
              <Image className="w-4 h-4 text-generate" />
            </div>
            <p className="text-xs font-medium">Профессионально</p>
            <p className="text-[0.625rem] text-muted-foreground">Качественное оформление</p>
          </div>
        </div>

        {/* Preview placeholder */}
        <div
          className="relative rounded-xl overflow-hidden bg-gradient-to-br from-muted via-muted/50 to-muted border-2 border-dashed border-primary/30"
          style={{ aspectRatio: "16/9" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Image className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Здесь будет ваш широкоформатный баннер 1920x1080
            </p>
          </div>

          {/* Decorative elements */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Позже
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onCreateBanner();
            }}
            className="flex-1 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Создать баннер
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <p className="text-[0.625rem] text-center text-muted-foreground">
          Вы можете загрузить своё изображение или сгенерировать с помощью AI
        </p>
      </div>
    </UnifiedDialog>
  );
}
