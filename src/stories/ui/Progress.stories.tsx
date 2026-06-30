import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: { value: 40, className: "w-80" },
};

export const Empty: Story = {
  args: { value: 0, className: "w-80" },
};

export const Half: Story = {
  args: { value: 50, className: "w-80" },
};

export const Complete: Story = {
  args: { value: 100, className: "w-80" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-80 space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>Генерация трека</span>
        <span className="text-muted-foreground">67%</span>
      </div>
      <Progress value={67} />
    </div>
  ),
};

export const Animated: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const timer = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 2));
      }, 80);
      return () => clearInterval(timer);
    }, []);
    return (
      <div className="w-80 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">AI создаёт музыку...</span>
          <span className="tabular-nums text-muted-foreground">{value}%</span>
        </div>
        <Progress value={value} />
      </div>
    );
  },
};

export const MultipleStages: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      {[
        { label: "Анализ текста", value: 100 },
        { label: "Генерация мелодии", value: 75 },
        { label: "Микширование", value: 30 },
        { label: "Мастеринг", value: 0 },
      ].map(({ label, value }) => (
        <div key={label} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{label}</span>
            <span>{value}%</span>
          </div>
          <Progress value={value} className="h-1.5" />
        </div>
      ))}
    </div>
  ),
};
