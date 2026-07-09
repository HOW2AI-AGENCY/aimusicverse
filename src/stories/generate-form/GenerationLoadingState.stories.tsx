/**
 * Storybook story — GenerationLoadingState
 */
import type { Meta, StoryObj } from "@storybook/react";
import { GenerationLoadingState } from "@/components/generate-form/GenerationLoadingState";

const meta: Meta<typeof GenerationLoadingState> = {
  title: "GenerateForm/GenerationLoadingState",
  component: GenerationLoadingState,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GenerationLoadingState>;

export const Default: Story = {};
