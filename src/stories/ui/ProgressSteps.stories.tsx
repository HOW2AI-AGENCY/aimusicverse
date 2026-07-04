import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { Music, Mic, Sparkles, Download } from "lucide-react";

const meta: Meta<typeof ProgressSteps> = {
  title: "UI/ProgressSteps",
  component: ProgressSteps,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: { type: "select" }, options: ["default", "compact", "vertical"] },
    currentStep: { control: { type: "range", min: 0, max: 4, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressSteps>;

const STEPS = [
  { id: "style", label: "Стиль", description: "Выберите жанр и настроение" },
  { id: "lyrics", label: "Текст", description: "Введите текст песни" },
  { id: "generate", label: "Генерация", description: "AI создаёт трек" },
  { id: "result", label: "Результат", description: "Слушайте и скачивайте" },
];

export const Step1: Story = {
  args: { steps: STEPS, currentStep: 0 },
};

export const Step2: Story = {
  args: { steps: STEPS, currentStep: 1 },
};

export const Step3: Story = {
  args: { steps: STEPS, currentStep: 2 },
};

export const Completed: Story = {
  args: { steps: STEPS, currentStep: 4 },
};

export const Compact: Story = {
  args: { steps: STEPS, currentStep: 2, variant: "compact" },
};

export const Vertical: Story = {
  args: { steps: STEPS, currentStep: 1, variant: "vertical" },
};

export const WithIcons: Story = {
  args: {
    steps: [
      { id: "style", label: "Стиль", icon: Music },
      { id: "lyrics", label: "Текст", icon: Mic },
      { id: "generate", label: "Создать", icon: Sparkles },
      { id: "download", label: "Скачать", icon: Download },
    ],
    currentStep: 2,
  },
};

export const Interactive: Story = {
  render: () => {
    const [step, setStep] = useState(1);
    return (
      <div className="flex flex-col gap-4 w-80">
        <ProgressSteps steps={STEPS} currentStep={step} onStepClick={setStep} allowClickPrevious />
        <div className="flex gap-2 justify-center">
          <button className="px-3 py-1 rounded bg-muted text-sm" onClick={() => setStep(Math.max(0, step - 1))}>
            Назад
          </button>
          <button
            className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm"
            onClick={() => setStep(Math.min(STEPS.length, step + 1))}
          >
            Далее
          </button>
        </div>
      </div>
    );
  },
};
