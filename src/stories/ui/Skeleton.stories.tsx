import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-40" />,
};

export const Circle: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
};

export const Card: Story = {
  render: () => (
    <div className="w-72 space-y-3">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  ),
};

export const TrackList: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-8 shrink-0" />
        </div>
      ))}
    </div>
  ),
};

export const ProfileHeader: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex items-center gap-4 px-4">
        <Skeleton className="h-16 w-16 rounded-full -mt-10 border-2 border-background" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-6 justify-center">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  ),
};
