/**
 * ContextHelp Component - Sprint 026 US-026-003
 * 
 * Provides contextual hints and tips based on current workflow step
 */

import { HelpCircle, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/lib/motion';

interface ContextHelpProps {
  title: string;
  description: string;
  tips?: string[];
  visible?: boolean;
}

export function ContextHelp({ 
  title, 
  description, 
  tips = [], 
  visible = true 
}: ContextHelpProps) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
              
              {tips.length > 0 && (
                <div className="space-y-1.5">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
