import type { Meta, StoryObj } from "@storybook/react";
import { Shimmer } from "@/components/ui/Shimmer";

const meta: Meta<typeof Shimmer> = {
  title: "UI/Shimmer",
  component: Shimmer,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    active: { control: "boolean" },
    duration: { control: { type: "range", min: 0.5, max: 3, step: 0.1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Shimmer>;

export const CardPlaceholder: Story = {
  args: { active: true, className: "h-40 w-64 rounded-xl bg-muted" },
};

export const AvatarPlaceholder: Story = {
  args: { active: true, className: "h-12 w-12 rounded-full bg-muted" },
};

export const TextLinePlaceholder: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Shimmer active className="h-4 w-full rounded bg-muted" />
      <Shimmer active className="h-4 w-4/5 rounded bg-muted" />
      <Shimmer active className="h-4 w-2/3 rounded bg-muted" />
    </div>
  ),
};

export const TrackCardSkeleton: Story = {
  render: () => (
    <div className="flex gap-3 w-72 p-3 rounded-xl border bg-card">
      <Shimmer active className="h-14 w-14 rounded-lg bg-muted flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <Shimmer active className="h-4 w-full rounded bg-muted" />
        <Shimmer active className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  ),
};

export const Inactive: Story = {
  args: { active: false, className: "h-40 w-64 rounded-xl bg-muted" },
};
