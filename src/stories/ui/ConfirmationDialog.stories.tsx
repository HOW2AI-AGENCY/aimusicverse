/**
 * Storybook story — ConfirmationDialog
 */
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

const meta: Meta<typeof ConfirmationDialog> = {
  title: "UI/ConfirmationDialog",
  component: ConfirmationDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ConfirmationDialog>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: "Delete Track",
    message: "Are you sure you want to delete this track? This action cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: () => alert("Confirmed"),
    onCancel: () => alert("Cancelled"),
  },
};

export const Destructive: Story = {
  args: {
    isOpen: true,
    title: "Remove from Playlist",
    message: "This track will be removed from the playlist.",
    confirmLabel: "Remove",
    variant: "destructive",
    onConfirm: () => alert("Removed"),
    onCancel: () => alert("Cancelled"),
  },
};
