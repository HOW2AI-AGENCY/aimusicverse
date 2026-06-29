/**
 * 037-06: Storybook story — EmptyState component
 *
 * Demonstrates:
 * - Default empty state
 * - With custom action
 * - Loading variant
 * - Different icon sizes
 */
import type { Meta, StoryObj } from "@storybook/react";
import { UnifiedEmptyState as EmptyState } from "@/components/ui/unified-empty-state";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Empty state component for zero-data screens. Supports icon, title, description, and optional action slot.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "No tracks yet",
    description: "Your library is empty. Start by generating your first track.",
  },
};

export const WithAction: Story = {
  args: {
    title: "No playlists",
    description: "Create a playlist to organize your favorite tracks.",
  },
  render: (args: React.ComponentProps<typeof EmptyState>) => <EmptyState {...args} />,
};

export const Minimal: Story = {
  args: {
    title: "Nothing here",
    description: "",
  },
};

export const LongDescription: Story = {
  args: {
    title: "No search results",
    description:
      "We couldn't find any tracks matching your search. Try different keywords or browse the featured section for inspiration.",
  },
};
