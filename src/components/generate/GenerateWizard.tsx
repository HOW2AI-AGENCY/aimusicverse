import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1Mode } from './Step1_Mode';
import { Step2Info } from './Step2_Info';
import { Step3Style } from './Step3_Style';
import { Step4Review } from './Step4_Review';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UploadExtendDialog } from '../UploadExtendDialog';
import { UploadCoverDialog } from '../UploadCoverDialog';

type Step = 'mode' | 'info' | 'style' | 'review';

export const GenerateWizard = () => {
  const [step, setStep] = useState<Step>('mode');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploadExtendOpen, setUploadExtendOpen] = useState(false);
  const [uploadCoverOpen, setUploadCoverOpen] = useState(false);

  const handleNext = (newData: any, nextStep: Step) => {
    setFormData((prev: any) => ({ ...prev, ...newData }));

    if (newData.mode === 'extend') {
      setUploadExtendOpen(true);
      return;
    }
    if (newData.mode === 'cover') {
      setUploadCoverOpen(true);
      return;
    }

    setStep(nextStep);
  };

  const handleBack = (prevStep: Step) => {
    setStep(prevStep);
  };

  const handleSubmit = async () => {
    const { info, style } = formData;
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

      setFormData({});
      setStep('mode');

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
      <div className="p-4">
        <AnimatePresence mode="wait">
          {step === 'mode' && (
            <motion.div key="mode" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
              <Step1Mode onNext={(mode) => handleNext({ mode }, 'info')} />
            </motion.div>
          )}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
              <Step2Info onNext={(data) => handleNext({ info: data }, 'style')} onBack={() => handleBack('mode')} />
            </motion.div>
          )}
          {step === 'style' && (
            <motion.div key="style" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
              <Step3Style onNext={(data) => handleNext({ style: data }, 'review')} onBack={() => handleBack('info')} />
            </motion.div>
          )}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
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
