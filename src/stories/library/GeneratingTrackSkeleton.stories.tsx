/**
 * Storybook story — GeneratingTrackSkeleton
 */
import type { Meta, StoryObj } from "@storybook/react";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";

const meta: Meta<typeof GeneratingTrackSkeleton> = {
  title: "Library/GeneratingTrackSkeleton",
  component: GeneratingTrackSkeleton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GeneratingTrackSkeleton>;

export const Default: Story = {};
