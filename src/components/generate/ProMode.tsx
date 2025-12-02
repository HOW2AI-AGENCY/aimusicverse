import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ProModeProps {
  onBack: () => void;
}

export const ProMode = ({ onBack }: ProModeProps) => {
  return (
    <motion.div
      className="p-3 sm:p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 sm:mb-6 min-h-[44px] touch-manipulation hover:bg-muted active:scale-95 transition-all"
        aria-label="Вернуться к выбору режима"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к выбору режима
      </Button>
      <Card className="p-6 sm:p-8 text-center">
        <motion.h2
          className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Профи режим
        </motion.h2>
        <motion.p
          className="text-sm sm:text-base text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Этот режим находится в разработке. Здесь будет интерфейс с расширенными настройками для профессионалов.
        </motion.p>
      </Card>
    </motion.div>
  );
};
