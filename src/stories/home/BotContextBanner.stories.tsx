/**
 * Storybook story — BotContextBanner
 */
import type { Meta, StoryObj } from "@storybook/react";
import { BotContextBanner } from "@/components/home/BotContextBanner";

const meta: Meta<typeof BotContextBanner> = {
  title: "Home/BotContextBanner",
  component: BotContextBanner,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BotContextBanner>;

export const Default: Story = {};
