import { Button } from "@/components/ui/button";
import { Music, ArrowRight, GitBranchPlus } from "lucide-react";

interface Step1ModeProps {
  onNext: (mode: "generate" | "extend" | "cover") => void;
}

export const Step1Mode = ({ onNext }: Step1ModeProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
          Что вы хотите сделать?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Выберите режим создания музыки</p>
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        <Button 
          onClick={() => onNext("generate")} 
          className="w-full justify-between h-16 sm:h-20 min-h-[64px] text-left px-4 sm:px-6 touch-manipulation active:scale-95 transition-transform shadow-lg hover:shadow-xl"
          size="lg"
        >
          <span className="text-sm sm:text-base font-semibold">Создать трек с нуля</span>
          <Music className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
        </Button>
        <Button 
          onClick={() => onNext("extend")} 
          variant="outline" 
          className="w-full justify-between h-16 sm:h-20 min-h-[64px] text-left px-4 sm:px-6 glass-card border-primary/30 hover:border-primary/50 hover:shadow-md touch-manipulation active:scale-95 transition-transform"
          size="lg"
        >
          <span className="text-sm sm:text-base font-semibold">Расширить существующее аудио</span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
        </Button>
        <Button 
          onClick={() => onNext("cover")} 
          variant="outline" 
          className="w-full justify-between h-16 sm:h-20 min-h-[64px] text-left px-4 sm:px-6 glass-card border-primary/30 hover:border-primary/50 hover:shadow-md touch-manipulation active:scale-95 transition-transform"
          size="lg"
        >
          <span className="text-sm sm:text-base font-semibold">Создать кавер-версию</span>
          <GitBranchPlus className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
        </Button>
      </div>
    </div>
  );
};
