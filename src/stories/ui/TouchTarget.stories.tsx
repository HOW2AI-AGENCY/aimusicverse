import type { Meta, StoryObj } from "@storybook/react";
import { TouchTarget, TouchIcon } from "@/components/ui/TouchTarget";
import { X, Heart, Plus, Settings } from "lucide-react";

const meta: Meta<typeof TouchTarget> = {
  title: "UI/TouchTarget",
  component: TouchTarget,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: { type: "range", min: 32, max: 64, step: 4 } },
    as: { control: { type: "select" }, options: ["span", "div"] },
  },
};

export default meta;
type Story = StoryObj<typeof TouchTarget>;

export const Default: Story = {
  args: {
    children: <X className="w-4 h-4" />,
    size: 44,
    className: "border border-dashed border-muted-foreground/30 rounded",
  },
  parameters: {
    docs: {
      description: { story: "The dashed border shows the 44×44px minimum touch target area." },
    },
  },
};

export const SmallIcon: Story = {
  args: {
    children: <Heart className="w-3.5 h-3.5 text-rose-500" />,
    size: 44,
    className: "bg-muted/40 rounded-lg",
  },
};

export const LargeTarget: Story = {
  args: {
    children: <Plus className="w-5 h-5 text-primary" />,
    size: 56,
    className: "bg-primary/10 rounded-xl",
  },
};

export const TouchIconExample: Story = {
  render: () => (
    <div className="flex gap-2">
      <TouchIcon>
        <X className="w-4 h-4" />
      </TouchIcon>
      <TouchIcon>
        <Heart className="w-4 h-4 text-rose-500" />
      </TouchIcon>
      <TouchIcon>
        <Plus className="w-4 h-4 text-primary" />
      </TouchIcon>
      <TouchIcon>
        <Settings className="w-4 h-4 text-muted-foreground" />
      </TouchIcon>
    </div>
  ),
};

export const ComparisonWithoutTarget: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <div className="flex flex-col items-center gap-1">
        <button className="p-0">
          <X className="w-3 h-3" />
        </button>
        <span className="text-xs text-destructive">Слишком мало</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <TouchIcon>
          <X className="w-3 h-3" />
        </TouchIcon>
        <span className="text-xs text-emerald-500">44×44px ✓</span>
      </div>
    </div>
  ),
};
