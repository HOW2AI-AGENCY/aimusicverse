/**
 * Storybook story — HomeHeader component
 */
import type { Meta, StoryObj } from "@storybook/react";
import { HomeHeader } from "@/components/home/HomeHeader";

const meta: Meta<typeof HomeHeader> = {
  title: "Home/HomeHeader",
  component: HomeHeader,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomeHeader>;

export const SignedIn: Story = {
  args: {
    userName: "Alex",
    userPhotoUrl: null,
    onProfileClick: () => alert("Profile clicked"),
  },
};

export const SignedOut: Story = {
  args: {
    userName: undefined,
    userPhotoUrl: null,
    onProfileClick: () => alert("Profile clicked"),
  },
};
