import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "@/components/ui/Heading";

const meta: Meta<typeof Heading> = {
  title: "UI/Heading",
  component: Heading,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    level: { control: { type: "select" }, options: [1, 2, 3, 4, 5] },
    gradient: { control: "boolean" },
    muted: { control: "boolean" },
    animate: { control: "boolean" },
    balance: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const H1: Story = {
  args: { level: 1, children: "Page Heading H1" },
};

export const H2: Story = {
  args: { level: 2, children: "Section Heading H2" },
};

export const H3: Story = {
  args: { level: 3, children: "Subsection Heading H3" },
};

export const Gradient: Story = {
  args: { level: 1, gradient: true, children: "Gradient Heading" },
};

export const Muted: Story = {
  args: { level: 2, muted: true, children: "Secondary / Muted Heading" },
};

export const Animated: Story = {
  args: { level: 2, animate: true, children: "Animated Entrance" },
};

export const Truncated: Story = {
  args: {
    level: 3,
    truncate: 1,
    children: "This very long heading text will be truncated after one line of content",
    className: "w-48",
  },
};
