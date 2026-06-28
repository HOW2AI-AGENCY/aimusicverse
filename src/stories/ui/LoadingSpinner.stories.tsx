/**
 * 037-06: Storybook story — LoadingSpinner component
 *
 * Demonstrates:
 * - Different sizes
 * - With label
 * - Full-page overlay variant
 */
import type { Meta, StoryObj } from "@storybook/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const meta: Meta<typeof LoadingSpinner> = {
  title: "UI/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Loading spinner with optional label. Used for async operations, page transitions, and data fetching states.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const WithText: Story = {
  args: {
    text: "Generating your track...",
  },
};

export const MusicVariant: Story = {
  args: {
    size: "lg",
    variant: "music",
    text: "Loading MusicVerse...",
  },
  render: (args) => (
    <div className="w-[400px] h-[300px] bg-background flex items-center justify-center">
      <LoadingSpinner {...args} />
    </div>
  ),
};

export const Minimal: Story = {
  args: {
    variant: "minimal",
    size: "sm",
  },
};
