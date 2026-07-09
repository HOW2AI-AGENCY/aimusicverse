/**
 * Storybook story — EmptyLibraryState
 */
import type { Meta, StoryObj } from "@storybook/react";
import { EmptyLibraryState } from "@/components/library/EmptyLibraryState";

const meta: Meta<typeof EmptyLibraryState> = {
  title: "Library/EmptyLibraryState",
  component: EmptyLibraryState,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyLibraryState>;

export const Default: Story = {};
