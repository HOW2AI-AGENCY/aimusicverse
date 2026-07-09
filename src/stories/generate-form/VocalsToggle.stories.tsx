/**
 * Storybook story — VocalsToggle
 */
import type { Meta, StoryObj } from "@storybook/react";
import { VocalsToggle } from "@/components/generate-form/sections/VocalsToggle";

const meta: Meta<typeof VocalsToggle> = {
  title: "GenerateForm/VocalsToggle",
  component: VocalsToggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VocalsToggle>;

export const Instrumental: Story = {
  args: {
    value: false,
    onChange: (v) => console.log(v),
  },
};

export const WithVocals: Story = {
  args: {
    value: true,
    onChange: (v) => console.log(v),
  },
};
