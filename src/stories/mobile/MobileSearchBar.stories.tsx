/**
 * Storybook story — MobileSearchBar
 */
import type { Meta, StoryObj } from "@storybook/react";
import MobileSearchBar from "@/components/mobile/MobileSearchBar";

const meta: Meta<typeof MobileSearchBar> = {
  title: "Mobile/MobileSearchBar",
  component: MobileSearchBar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MobileSearchBar>;

export const Empty: Story = {
  args: {
    value: "",
    onChange: (v) => console.log(v),
    placeholder: "Поиск...",
  },
};

export const WithText: Story = {
  args: {
    value: "midnight",
    onChange: (v) => console.log(v),
  },
};

export const WithCancel: Story = {
  args: {
    value: "piano",
    onChange: (v) => console.log(v),
    showCancel: true,
    onCancel: () => alert("cancelled"),
  },
};
