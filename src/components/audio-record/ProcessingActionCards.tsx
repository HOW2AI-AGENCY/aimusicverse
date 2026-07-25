/**
 * ProcessingActionCards — Action selection grid
 *
 * Shows 4 options: +Instrumental, +Vocals, Cover, Extend.
 * Extracted from AudioRecordDialog to reduce the 715-line component.
 */
import { Music, MicVocal, Disc, ArrowRight, Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import type { ProcessingAction } from "./useAudioRecordDialog";

interface ProcessingActionCardsProps {
  processingAction: ProcessingAction;
  onInstrumental: () => void;
  onVocals: () => void;
  onCover: () => void;
  onExtend: () => void;
}

export function ProcessingActionCards({
  processingAction,
  onInstrumental,
  onVocals,
  onCover,
  onExtend,
}: ProcessingActionCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-3 pt-4 pb-2"
    >
      <p className="text-xs sm:text-sm text-muted-foreground text-center">Выберите действие для аудио:</p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* + Instrumental */}
        <ActionCard
          icon={
            processingAction === "instrumental" ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-primary" />
            ) : (
              <Music className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            )
          }
          label="+ Инструментал"
          description="AI создаст аккомпанемент к вокалу"
          className="border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10"
          disabled={processingAction !== null}
          onClick={onInstrumental}
        />

        {/* + Vocals */}
        <ActionCard
          icon={
            processingAction === "vocals" ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-primary" />
            ) : (
              <MicVocal className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            )
          }
          label="+ Вокал"
          description="AI добавит вокал к инструменталу"
          className="border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5"
          disabled={processingAction !== null}
          onClick={onVocals}
        />

        {/* Cover */}
        <ActionCard
          icon={
            processingAction === "cover" ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-amber-500" />
            ) : (
              <Disc className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
            )
          }
          label="Кавер"
          description="Новая версия в другом стиле"
          className="border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10"
          disabled={processingAction !== null}
          onClick={onCover}
        />

        {/* Extend */}
        <ActionCard
          icon={
            processingAction === "extend" ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-emerald-500" />
            ) : (
              <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
            )
          }
          label="Расширение"
          description="AI продолжит ваш трек"
          className="border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
          disabled={processingAction !== null}
          onClick={onExtend}
        />
      </div>
    </motion.div>
  );
}

/* ── Internal action card button ── */

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

function ActionCard({ icon, label, description, className, disabled, onClick }: ActionCardProps) {
  return (
    <button
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl",
        "transition-all duration-200 min-h-[80px] sm:min-h-[88px]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className="text-xs sm:text-sm font-medium">{label}</span>
      <span className="text-[0.625rem] sm:text-xs text-muted-foreground text-center leading-tight">{description}</span>
    </button>
  );
}
