/**
 * Storybook story — FirstTimeHeroCard
 */
import type { Meta, StoryObj } from "@storybook/react";
import { FirstTimeHeroCard } from "@/components/home/FirstTimeHeroCard";

const meta: Meta<typeof FirstTimeHeroCard> = {
  title: "Home/FirstTimeHeroCard",
  component: FirstTimeHeroCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FirstTimeHeroCard>;

export const Default: Story = {
  args: {
    onCreateClick: () => alert("Create"),
  },
};
