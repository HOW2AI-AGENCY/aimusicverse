/**
 * Storybook story — HomeQuickCreate
 */
import type { Meta, StoryObj } from "@storybook/react";
import { HomeQuickCreate } from "@/components/home/HomeQuickCreate";

const meta: Meta<typeof HomeQuickCreate> = {
  title: "Home/HomeQuickCreate",
  component: HomeQuickCreate,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomeQuickCreate>;

export const Default: Story = {
  args: {
    onCreateClick: () => alert("Create"),
  },
};
