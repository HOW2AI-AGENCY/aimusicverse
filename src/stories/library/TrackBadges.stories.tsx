/**
 * Storybook story — TrackBadges
 */
import type { Meta, StoryObj } from "@storybook/react";
import { TrackBadges } from "@/components/library/shared/TrackBadges";

const meta: Meta<typeof TrackBadges> = {
  title: "Library/TrackBadges",
  component: TrackBadges,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TrackBadges>;

export const Default: Story = {
  args: {
    status: "completed",
    isPublic: true,
    generationMode: "generate",
  },
};
