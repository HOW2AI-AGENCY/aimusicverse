import { Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function AiSuggestions({ onCreateClick, className }: AiSuggestionsProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-sans font-bold text-[17px] text-foreground">AI предлагает</h3>
      </div>
      <motion.div
        className="flex flex-col gap-3"
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView={prefersReducedMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.3 }}
        variants={prefersReducedMotion ? undefined : listVariants}
      >
        {defaultSuggestions.map((sg) => (
          <motion.button
            key={sg.title}
            onClick={onCreateClick}
            variants={prefersReducedMotion ? undefined : itemVariants}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-[border-color,box-shadow] text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{sg.icon}</span>
              <p className="font-semibold text-[14.5px] text-foreground/90">{sg.title}</p>
            </div>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{sg.description}</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
