/**
 * Storybook story — LibraryFilterChips
 */
import type { Meta, StoryObj } from "@storybook/react";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";

const meta: Meta<typeof LibraryFilterChips> = {
  title: "Library/LibraryFilterChips",
  component: LibraryFilterChips,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LibraryFilterChips>;

export const Default: Story = {};
