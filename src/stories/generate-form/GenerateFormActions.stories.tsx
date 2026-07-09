/**
 * Storybook story — GenerateFormActions
 */
import type { Meta, StoryObj } from "@storybook/react";
import { GenerateFormActions } from "@/components/generate-form/GenerateFormActions";

const meta: Meta<typeof GenerateFormActions> = {
  title: "GenerateForm/GenerateFormActions",
  component: GenerateFormActions,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GenerateFormActions>;

export const Default: Story = {
  args: {
    isGenerating: false,
    onGenerate: () => alert("Generate"),
    onCancel: () => alert("Cancel"),
  },
};

export const Generating: Story = {
  args: {
    isGenerating: true,
    onGenerate: () => alert("Generate"),
    onCancel: () => alert("Cancel"),
  },
};
