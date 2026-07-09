/**
 * Storybook story — CompactFilterBar
 */
import type { Meta, StoryObj } from "@storybook/react";
import { CompactFilterBar } from "@/components/library/CompactFilterBar";

const meta: Meta<typeof CompactFilterBar> = {
  title: "Library/CompactFilterBar",
  component: CompactFilterBar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CompactFilterBar>;

export const Default: Story = {
  args: {
    onOpenFilterMenu: () => alert("Open filters"),
    totalTracks: 42,
  },
};
