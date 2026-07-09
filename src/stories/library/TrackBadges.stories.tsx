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
    trackId: "track-1",
    versionCount: 2,
    stemCount: 4,
    queuePosition: 3,
  },
};

export const NoContent: Story = {
  args: {
    trackId: "track-1",
    versionCount: 1,
    stemCount: 0,
    queuePosition: null,
  },
};
