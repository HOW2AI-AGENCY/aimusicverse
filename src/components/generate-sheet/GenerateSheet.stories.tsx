/**
 * Storybook stories — GenerateSheet component
 *
 * Demonstrates:
 * - Default render
 * - Simple mode
 * - Custom mode
 * - Loading state
 * - Disabled state
 */
import type { Meta, StoryObj } from "@storybook/react";
import { GenerateSheet } from "@/components/GenerateSheet";

const meta: Meta<typeof GenerateSheet> = {
  title: "Generate/Sheet",
  component: GenerateSheet,
  decorators: [
    (Story) => (
      <div style={{ height: "100dvh" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Main generation sheet with form validation and Telegram integration.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "onOpenChange" },
  },
};

export default meta;
type Story = StoryObj<typeof GenerateSheet>;

export const Default: Story = {
  args: { open: true, onOpenChange: () => {} },
};

export const SimpleMode: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Simplified mode with basic generation options only.",
      },
    },
  },
};

export const CustomMode: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Full custom mode with lyrics, advanced settings, and all options.",
      },
    },
  },
};

export const Loading: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Loading state during generation.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Disabled state when form is incomplete.",
      },
    },
  },
};
