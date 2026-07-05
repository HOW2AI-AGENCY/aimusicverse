// src/components/generate-sheet/GenerateSheetHeader.tsx
import { X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { motion } from "@/lib/motion";
import { CollapsibleFormHeader } from "@/components/generate-form/CollapsibleFormHeader";

interface Props {
  form: {
    balance: number;
    cost: number;
    mode: "simple" | "custom";
    setMode: (m: "simple" | "custom") => void;
    model: string;
    setModel: (m: string) => void;
  };
  onOpenHistory: () => void;
  onClose: () => void;
}

export function GenerateSheetHeader({ form, onOpenHistory, onClose }: Props) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="px-4 border-b border-border/40 bg-background/95 backdrop-blur-xl flex-shrink-0"
    >
      <CollapsibleFormHeader
        balance={form.balance}
        cost={form.cost}
        mode={form.mode}
        onModeChange={form.setMode}
        onOpenHistory={onOpenHistory}
        model={form.model}
        onModelChange={form.setModel}
        onClose={onClose}
      />
    </motion.div>
  );
}
