/**
 * Storybook story — PrivacyToggle
 */
import type { Meta, StoryObj } from "@storybook/react";
import { PrivacyToggle } from "@/components/generate-form/sections/PrivacyToggle";

const meta: Meta<typeof PrivacyToggle> = {
  title: "GenerateForm/PrivacyToggle",
  component: PrivacyToggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PrivacyToggle>;

export const Public: Story = {
  args: {
    isPublic: true,
    onChange: (v) => console.log(v),
  },
};

export const Private: Story = {
  args: {
    isPublic: false,
    onChange: (v) => console.log(v),
  },
};
