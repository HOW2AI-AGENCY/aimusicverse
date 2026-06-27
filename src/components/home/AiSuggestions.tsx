import { Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface Suggestion {
  icon: string;
  title: string;
  description: string;
}

interface AiSuggestionsProps {
  onCreateClick: () => void;
  className?: string;
}

const defaultSuggestions: Suggestion[] = [
  {
    icon: "🌙",
    title: "Продолжи последний трек",
    description: "Добавь второй куплет и более плотный бас — в стиле твоего черновика.",
  },
  {
    icon: "🎙️",
    title: "Создай AI-артиста из голоса",
    description: "У тебя есть треки в одном тембре — собери их в единый профиль.",
  },
];

export function AiSuggestions({ onCreateClick, className }: AiSuggestionsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-sans font-bold text-[17px] text-foreground">AI предлагает</h3>
      </div>
      <div className="flex flex-col gap-3">
        {defaultSuggestions.map((sg) => (
          <button
            key={sg.title}
            onClick={onCreateClick}
            className="p-4 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border hover:border-primary/30 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{sg.icon}</span>
              <p className="font-semibold text-[14.5px] text-foreground/90">{sg.title}</p>
            </div>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{sg.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
