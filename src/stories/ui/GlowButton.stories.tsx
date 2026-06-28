/**
 * 037-06: Storybook story — GlowButton component
 *
 * Demonstrates:
 * - Default glow
 * - Variants (default, secondary, destructive, ghost)
 * - Sizes (sm, md, lg)
 * - Disabled state
 */
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Animated button with glow effect on hover. Used for primary actions throughout the app.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Glow: Story = {
  args: {
    children: "Generate Track",
    variant: "glow",
    size: "default",
  },
};

export const Default: Story = {
  args: {
    children: "Save Draft",
    variant: "default",
  },
};

export const Small: Story = {
  args: {
    children: "Like",
    size: "sm",
  },
};

export const LargeGlow: Story = {
  args: {
    children: "Create Now",
    variant: "glow",
    size: "lg",
  },
};

export const Disabled: Story = {
  args: {
    children: "Processing...",
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: "Play Now",
    variant: "glow",
  },
  render: (args) => (
    <Button {...args}>
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      {args.children}
    </Button>
  ),
};
