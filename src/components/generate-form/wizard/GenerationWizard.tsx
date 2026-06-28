/**
 * GenerationWizard - Step-by-step music generation with AI assistance
 * A/B tested: 2-step (treatment) vs 4-step (control) — WIZARD_STEPS experiment
 */

import { useCallback } from "react";
import { AnimatePresence } from "@/lib/motion";
import { useGenerationWizardStore, type WizardStep } from "@/stores/generationWizardStore";
import { useExperiment } from "@/hooks/useExperiment";
import { EXPERIMENTS } from "@/lib/ab-testing";
import { WizardProgress } from "./WizardProgress";
import { IdeaStep } from "./steps/IdeaStep";
import { StyleSettingsStep } from "./steps/StyleSettingsStep";
import { VocalsLyricsStep } from "./steps/VocalsLyricsStep";
import { PreviewStep } from "./steps/PreviewStep";
import { IdeaStyleCombinedStep } from "./steps/IdeaStyleCombinedStep";
import { VocalsGenerateStep } from "./steps/VocalsGenerateStep";

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
  vocalGender: "" | "m" | "f";
  model: string;
  isPublic: boolean;
}

const TWO_STEP_FLOW: WizardStep[] = ["idea", "vocals-lyrics"];

export function GenerationWizard({ onGenerate, isLoading }: GenerationWizardProps) {
  const { currentStep, completedSteps, data, setStep, nextStep, prevStep, markStepComplete } =
    useGenerationWizardStore();

  const { isControl: isFourStep, trackConversion } = useExperiment(
    EXPERIMENTS.WIZARD_STEPS as unknown as Parameters<typeof useExperiment>[0],
  );
  const isTwoStep = !isFourStep;

  const handleStepClick = useCallback(
    (step: WizardStep) => {
      setStep(step);
    },
    [setStep],
  );

  const handleNext = useCallback(() => {
    markStepComplete(currentStep);
    if (isTwoStep) {
      const currentIndex = TWO_STEP_FLOW.indexOf(currentStep);
      if (currentIndex < TWO_STEP_FLOW.length - 1) {
        setStep(TWO_STEP_FLOW[currentIndex + 1]);
      }
    } else {
      nextStep();
    }
  }, [currentStep, markStepComplete, nextStep, isTwoStep, setStep]);

  const handleBack = useCallback(() => {
    if (isTwoStep) {
      const currentIndex = TWO_STEP_FLOW.indexOf(currentStep);
      if (currentIndex > 0) {
        setStep(TWO_STEP_FLOW[currentIndex - 1]);
      }
    } else {
      prevStep();
    }
  }, [currentStep, isTwoStep, prevStep, setStep]);

  const handleGenerate = useCallback(() => {
    const styleParts: string[] = [];
    if (data.selectedGenre) styleParts.push(data.selectedGenre);
    if (data.selectedMood) styleParts.push(data.selectedMood);
    if (data.vocalStyle) styleParts.push(`${data.vocalStyle} vocals`);
    if (data.styleTags.length > 0) styleParts.push(...data.styleTags);

    const params: WizardGenerateParams = {
      description: data.ideaDescription,
      title: data.title,
      style: styleParts.join(", "),
      lyrics: data.hasVocals ? data.lyrics : "",
      hasVocals: data.hasVocals,
      vocalGender: data.vocalGender,
      model: data.model,
      isPublic: data.isPublic,
    };

    trackConversion("generation_started");
    onGenerate(params);
  }, [data, onGenerate, trackConversion]);

  const renderStep = () => {
    if (isTwoStep) {
      switch (currentStep) {
        case "idea":
          return <IdeaStyleCombinedStep onNext={handleNext} />;
        case "vocals-lyrics":
          return <VocalsGenerateStep onGenerate={handleGenerate} onBack={handleBack} isLoading={isLoading} />;
        default:
          return <IdeaStyleCombinedStep onNext={handleNext} />;
      }
    }

    switch (currentStep) {
      case "idea":
        return <IdeaStep onNext={handleNext} />;
      case "style-settings":
        return <StyleSettingsStep onNext={handleNext} onBack={handleBack} />;
      case "vocals-lyrics":
        return <VocalsLyricsStep onNext={handleNext} onBack={handleBack} />;
      case "preview":
        return <PreviewStep onGenerate={handleGenerate} onBack={handleBack} isLoading={isLoading} />;
      default:
        return <IdeaStep onNext={handleNext} />;
    }
  };

  const activeSteps = isTwoStep ? TWO_STEP_FLOW : undefined;

  return (
    <div className="space-y-4">
      <WizardProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        steps={activeSteps}
      />
      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
    </div>
  );
}
