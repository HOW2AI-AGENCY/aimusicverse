/**
 * AudioHubQuickActions - Quick action cards for common workflows
 */

import React, { memo } from "react";
import { motion } from "@/lib/motion";
import { Mic, Guitar, Music, Wand2, FileAudio, ArrowRight, Sparkles, Radio } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
}

const actions: QuickAction[] = [
  {
    id: "vocal",
    title: "Запись вокала",
    description: "С шумоподавлением",
    icon: <Mic className="h-5 w-5" />,
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "guitar",
    title: "Guitar Studio",
    description: "Запись и транскрипция",
    icon: <Guitar className="h-5 w-5" />,
    color: "from-orange-500/20 to-amber-500/20",
    href: "/guitar-studio",
  },
  {
    id: "analyze",
    title: "AI Анализ",
    description: "BPM, тональность, стиль",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-violet-500/20 to-purple-500/20",
  },
  {
    id: "reference",
    title: "Референс",
    description: "Использовать для генерации",
    icon: <Radio className="h-5 w-5" />,
    color: "from-blue-500/20 to-cyan-500/20",
  },
];

export const AudioHubQuickActions = memo(function AudioHubQuickActions() {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    if (action.href) {
      navigate(action.href);
    } else if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            className={cn(
              "relative overflow-hidden cursor-pointer",
              "hover:shadow-md transition-all duration-200",
              "active:scale-[0.98]",
            )}
            onClick={() => handleAction(action)}
          >
            {/* Gradient background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", action.color)} />

            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="p-2 rounded-lg bg-background/80 w-fit">{action.icon}</div>
                  <h3 className="font-medium text-sm mt-2">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});

export default AudioHubQuickActions;
