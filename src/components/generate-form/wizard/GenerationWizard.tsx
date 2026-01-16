/**
 * GenerationWizard - Step-by-step music generation with AI assistance
 */

import { useCallback } from 'react';
import { AnimatePresence } from '@/lib/motion';
import { useGenerationWizardStore, type WizardStep } from '@/stores/generationWizardStore';
import { WizardProgress } from './WizardProgress';
import { IdeaStep } from './steps/IdeaStep';
import { StyleStep } from './steps/StyleStep';
import { VocalsStep } from './steps/VocalsStep';
import { LyricsStep } from './steps/LyricsStep';
import { SettingsStep } from './steps/SettingsStep';
import { PreviewStep } from './steps/PreviewStep';

interface GenerationWizardProps {
  onGenerate: (params: WizardGenerateParams) => void;
  isLoading?: boolean;
}

export interface WizardGenerateParams {
  description: string;
  title: string;
  style: string;
  lyrics: string;
  hasVocals: boolean;
  vocalGender: '' | 'm' | 'f';
  model: string;
  isPublic: boolean;
}

export function GenerationWizard({ onGenerate, isLoading }: GenerationWizardProps) {
  const { 
    currentStep, 
    completedSteps, 
    data,
    setStep, 
    nextStep, 
    prevStep,
    markStepComplete,
  } = useGenerationWizardStore();

  const handleStepClick = useCallback((step: WizardStep) => {
    setStep(step);
  }, [setStep]);

  const handleNext = useCallback(() => {
    markStepComplete(currentStep);
    nextStep();
  }, [currentStep, markStepComplete, nextStep]);

  const handleGenerate = useCallback(() => {
    // Build style string from wizard data
    const styleParts: string[] = [];
    if (data.selectedGenre) styleParts.push(data.selectedGenre);
    if (data.selectedMood) styleParts.push(data.selectedMood);
    if (data.vocalStyle) styleParts.push(`${data.vocalStyle} vocals`);
    if (data.styleTags.length > 0) styleParts.push(...data.styleTags);

    const params: WizardGenerateParams = {
      description: data.ideaDescription,
      title: data.title,
      style: styleParts.join(', '),
      lyrics: data.hasVocals ? data.lyrics : '',
      hasVocals: data.hasVocals,
      vocalGender: data.vocalGender,
      model: data.model,
      isPublic: data.isPublic,
    };

    onGenerate(params);
  }, [data, onGenerate]);

  const renderStep = () => {
    switch (currentStep) {
      case 'idea':
        return <IdeaStep onNext={handleNext} />;
      case 'style':
        return <StyleStep onNext={handleNext} onBack={prevStep} />;
      case 'vocals':
        return <VocalsStep onNext={handleNext} onBack={prevStep} />;
      case 'lyrics':
        return <LyricsStep onNext={handleNext} onBack={prevStep} />;
      case 'settings':
        return <SettingsStep onNext={handleNext} onBack={prevStep} />;
      case 'preview':
        return <PreviewStep onGenerate={handleGenerate} onBack={prevStep} isLoading={isLoading} />;
      default:
        return <IdeaStep onNext={handleNext} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <WizardProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Step content */}
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}
