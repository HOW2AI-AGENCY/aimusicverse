/**
 * Storybook story — LibraryFilterModal
 */
import type { Meta, StoryObj } from "@storybook/react";
import { LibraryFilterModal } from "@/components/library/LibraryFilterModal";

const meta: Meta<typeof LibraryFilterModal> = {
  title: "Library/LibraryFilterModal",
  component: LibraryFilterModal,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LibraryFilterModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => alert("Close"),
    onApply: (filters: any) => alert(`Apply: ${JSON.stringify(filters)}`),
  },
};
