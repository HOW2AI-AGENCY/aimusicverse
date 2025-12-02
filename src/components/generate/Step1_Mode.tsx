import { Button } from "@/components/ui/button";
import { Music, ArrowRight, GitBranchPlus } from "lucide-react";

interface Step1ModeProps {
  onNext: (mode: "generate" | "extend" | "cover") => void;
}

export const Step1Mode = ({ onNext }: Step1ModeProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Что вы хотите сделать?</h2>
      <div className="space-y-3">
        <Button onClick={() => onNext("generate")} className="w-full justify-between h-16">
          <span>Создать трек с нуля</span>
          <Music className="w-5 h-5" />
        </Button>
        <Button onClick={() => onNext("extend")} variant="outline" className="w-full justify-between h-16">
          <span>Расширить существующее аудио</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Button onClick={() => onNext("cover")} variant="outline" className="w-full justify-between h-16">
          <span>Создать кавер-версию</span>
          <GitBranchPlus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
