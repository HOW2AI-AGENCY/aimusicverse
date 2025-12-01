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
  },
  {
    id: 'pro',
    title: 'Профи',
    description: 'Полный контроль над генерацией с расширенными параметрами.',
    icon: <Star className="w-6 h-6" />,
  },
  {
    id: 'assistant',
    title: 'ИИ Ассистент',
    description: 'Пошаговое создание музыки с помощью ИИ.',
    icon: <Sparkles className="w-6 h-6" />,
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
          <div className="p-4">
            <h1 className="text-3xl font-bold mb-2 text-center">Выберите режим генерации</h1>
            <p className="text-muted-foreground mb-8 text-center">
              Начните с простого или воспользуйтесь помощью ИИ.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {modes.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 hover:bg-primary/5 transition-colors cursor-pointer group"
                    onClick={() => setMode(item.id as Mode)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform mt-1" />
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
