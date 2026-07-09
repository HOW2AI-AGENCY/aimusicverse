/**
 * Storybook story — HomeSearchBar component
 */
import type { Meta, StoryObj } from "@storybook/react";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";

const meta: Meta<typeof HomeSearchBar> = {
  title: "Home/HomeSearchBar",
  component: HomeSearchBar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomeSearchBar>;

export const Empty: Story = {
  args: {
    onSearch: (q) => console.log("search:", q),
  },
};

export const WithQuery: Story = {
  args: {
    onSearch: (q) => console.log("search:", q),
  },
  render: (args) => (
    <div className="max-w-md">
      <HomeSearchBar onSearch={args.onSearch} />
      <p className="text-xs text-muted-foreground mt-2">Type query and press Enter to search</p>
    </div>
  ),
};
