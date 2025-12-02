import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Wand2, Star, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { GenerateWizard } from './GenerateWizard';
import { SimpleMode } from './SimpleMode';
import { ProMode } from './ProMode';

type Mode = 'hub' | 'simple' | 'pro' | 'assistant';

const modes = [
  {
    id: 'simple',
    title: 'Простой',
    description: 'Быстро создайте трек из текстового описания.',
    icon: <Wand2 className="w-6 h-6" />,
    gradient: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-500',
  },
  {
    id: 'pro',
    title: 'Профи',
    description: 'Полный контроль над генерацией с расширенными параметрами.',
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-500',
  },
  {
    id: 'assistant',
    title: 'ИИ Ассистент',
    description: 'Пошаговое создание музыки с помощью ИИ.',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
];

export const GenerateHub = () => {
  const [mode, setMode] = useState<Mode>('hub');

  const renderContent = () => {
    switch (mode) {
      case 'simple':
        return <SimpleMode onBack={() => setMode('hub')} />;
      case 'pro':
        return <ProMode onBack={() => setMode('hub')} />;
      case 'assistant':
        return <GenerateWizard />; // Wizard has its own navigation
      case 'hub':
      default:
        return (
          <div className="p-3 sm:p-4">
            <div className="mb-6 sm:mb-8 text-center">
              <motion.h1 
                className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Выберите режим генерации
              </motion.h1>
              <motion.p 
                className="text-sm sm:text-base text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Начните с простого или воспользуйтесь помощью ИИ.
              </motion.p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {modes.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="p-5 sm:p-6 hover:shadow-lg active:shadow-md transition-all cursor-pointer group border-2 hover:border-primary/20 min-h-[80px] touch-manipulation"
                    onClick={() => setMode(item.id as Mode)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.title}: ${item.description}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setMode(item.id as Mode);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <motion.div 
                        className={`p-2.5 sm:p-3 bg-gradient-to-br ${item.gradient} rounded-xl ${item.iconColor} flex-shrink-0`}
                        whileHover={{ rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {item.icon}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};
