/**
 * Storybook story — HomeStickyCTA
 */
import type { Meta, StoryObj } from "@storybook/react";
import { HomeStickyCTA } from "@/components/home/HomeStickyCTA";

const meta: Meta<typeof HomeStickyCTA> = {
  title: "UI/HomeStickyCTA",
  component: HomeStickyCTA,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomeStickyCTA>;

export const Default: Story = {};
