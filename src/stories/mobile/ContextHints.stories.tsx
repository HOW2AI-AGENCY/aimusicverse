/**
 * Storybook story — ContextHints (contextual hints for mobile)
 */
import type { Meta, StoryObj } from "@storybook/react";
import { ContextHints } from "@/components/hints/ContextHints";

const meta: Meta<typeof ContextHints> = {
  title: "Mobile/ContextHints",
  component: ContextHints,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ContextHints>;

export const Default: Story = {};
