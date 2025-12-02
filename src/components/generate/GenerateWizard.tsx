import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1Mode } from './Step1_Mode';
import { Step2Info } from './Step2_Info';
import { Step3Style } from './Step3_Style';
import { Step4Review } from './Step4_Review';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UploadExtendDialog } from '../UploadExtendDialog';
import { UploadCoverDialog } from '../UploadCoverDialog';

// Types
type StepId = 'mode' | 'info' | 'style' | 'review';
interface Step {
  id: StepId;
  name: string;
}

// TODO: Refine these types for more specific properties
interface InfoData {
  title?: string;
  style?: string;
  tags?: string;
  lyrics?: string;
}

interface StyleData {
  style?: string | { genres: string[]; moods: string[] };
  tags?: string;
}

interface FormData {
  mode?: 'generate' | 'extend' | 'cover';
  info?: InfoData;
  style?: StyleData;
}

// Constants
const WIZARD_STEPS: Step[] = [
  { id: 'mode', name: 'Режим' },
  { id: 'info', name: 'Инфо' },
  { id: 'style', name: 'Стиль' },
  { id: 'review', name: 'Обзор' },
];
const LOCAL_STORAGE_KEY = 'generateWizardState';

// Helper component for progress bar with improved UX
const WizardProgress = ({ steps, currentStepId, onStepClick }: { steps: Step[], currentStepId: StepId, onStepClick: (stepId: StepId) => void }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="flex items-center justify-between mb-6 sm:mb-8 px-2 sm:px-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center w-full">
          <button
            onClick={() => onStepClick(step.id)}
            disabled={index > currentStepIndex}
            className="flex flex-col items-center disabled:cursor-not-allowed min-h-[44px] min-w-[44px] touch-manipulation group"
            aria-label={`Шаг ${index + 1}: ${step.name}`}
            aria-current={index === currentStepIndex ? 'step' : undefined}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all font-semibold ${
                index === currentStepIndex 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' 
                  : index < currentStepIndex 
                  ? 'bg-primary/80 text-primary-foreground hover:bg-primary active:scale-95' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <p className={`mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold transition-colors ${
              index === currentStepIndex 
                ? 'text-primary' 
                : index < currentStepIndex 
                ? 'text-primary/70 group-hover:text-primary' 
                : 'text-muted-foreground'
            }`}>
              {step.name}
            </p>
          </button>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-all duration-300 rounded-full ${
              index < currentStepIndex 
                ? 'bg-primary shadow-sm' 
                : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export const GenerateWizard = () => {
  const [step, setStep] = useState<StepId>('mode');
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(false);
  const [uploadExtendOpen, setUploadExtendOpen] = useState(false);
  const [uploadCoverOpen, setUploadCoverOpen] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { step: savedStep, formData: savedFormData } = JSON.parse(savedState);
        if (savedStep && savedFormData) {
          setStep(savedStep);
          setFormData(savedFormData);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
      const stateToSave = JSON.stringify({ step, formData });
      localStorage.setItem(LOCAL_STORAGE_KEY, stateToSave);
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [step, formData]);


  const handleNext = (newData: Partial<FormData>, nextStepId: StepId) => {
    const updatedFormData = { ...formData, ...newData };
    setFormData(updatedFormData);

    if (newData.mode === 'extend') {
      setUploadExtendOpen(true);
      return;
    }
    if (newData.mode === 'cover') {
      setUploadCoverOpen(true);
      return;
    }

    setStep(nextStepId);
  };

  const handleBack = (prevStepId: StepId) => {
    setStep(prevStepId);
  };

  const handleStepClick = (clickedStepId: StepId) => {
    const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === step);
    const clickedStepIndex = WIZARD_STEPS.findIndex(s => s.id === clickedStepId);
    if (clickedStepIndex < currentStepIndex) {
      setStep(clickedStepId);
    }
  };

  const handleSubmit = async () => {
    const { info, style } = formData;

    // Type guard to ensure info and style are defined
    if (!info || !style) {
      toast.error('Пожалуйста, заполните всю информацию');
      return;
    }

    const prompt = `${info.style || ''} ${info.tags || ''}`.trim();

    if (!prompt) {
      toast.error('Пожалуйста, заполните описание музыки');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('generate-music', {
        body: {
          prompt,
          title: info.title,
          lyrics: info.lyrics,
          style: style.style,
          tags: style.tags,
          has_vocals: !!info.lyrics,
        },
      });

      if (error) throw error;

      toast.success('Генерация началась!', {
        description: 'Ваш трек появится в библиотеке через несколько минут',
      });

      // Reset state and clear localStorage
      setFormData({});
      setStep('mode');
      localStorage.removeItem(LOCAL_STORAGE_KEY);

    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error('Ошибка генерации', {
        description: error.message || 'Попробуйте еще раз',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-3 sm:p-4 max-w-3xl mx-auto">
        <WizardProgress steps={WIZARD_STEPS} currentStepId={step} onStepClick={handleStepClick} />
        <AnimatePresence mode="wait">
          {step === 'mode' && (
            <motion.div 
              key="mode" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Step1Mode onNext={(mode) => handleNext({ mode }, 'info')} />
            </motion.div>
          )}
          {step === 'info' && (
            <motion.div 
              key="info" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Step2Info onNext={(data) => handleNext({ info: data }, 'style')} onBack={() => handleBack('mode')} />
            </motion.div>
          )}
          {step === 'style' && (
            <motion.div 
              key="style" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Step3Style onNext={(data) => handleNext({ style: data }, 'review')} onBack={() => handleBack('info')} />
            </motion.div>
          )}
          {step === 'review' && (
            <motion.div 
              key="review" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Step4Review formData={formData} onBack={() => handleBack('style')} onSubmit={handleSubmit} isLoading={loading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <UploadExtendDialog open={uploadExtendOpen} onOpenChange={setUploadExtendOpen} />
      <UploadCoverDialog open={uploadCoverOpen} onOpenChange={setUploadCoverOpen} />
    </>
  );
};
