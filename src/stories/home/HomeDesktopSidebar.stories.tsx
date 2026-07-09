/**
 * Storybook story — HomeDesktopSidebar
 */
import type { Meta, StoryObj } from "@storybook/react";
import { HomeDesktopSidebar } from "@/components/home/HomeDesktopSidebar";

const meta: Meta<typeof HomeDesktopSidebar> = {
  title: "Home/HomeDesktopSidebar",
  component: HomeDesktopSidebar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomeDesktopSidebar>;

export const Authenticated: Story = {
  args: { isAuthenticated: true },
};

export const Guest: Story = {
  args: { isAuthenticated: false },
};
