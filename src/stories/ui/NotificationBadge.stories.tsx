import type { Meta, StoryObj } from "@storybook/react";
import { NotificationBadge, StatusIndicator, LabelBadge } from "@/components/ui/NotificationBadge";
import { Bell } from "lucide-react";

const meta = {
  title: "ui/NotificationBadge",
  component: NotificationBadge,
  tags: ["autodocs"],
  args: {
    count: 5,
    showZero: false,
    dot: false,
  },
} satisfies Meta<typeof NotificationBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dot: Story = {
  args: { dot: true, count: 0 },
};

export const MaxCount: Story = {
  args: { count: 150, maxCount: 99 },
  render: () => (
    <NotificationBadge count={150} maxCount={99}>
      <Bell className="w-5 h-5" />
    </NotificationBadge>
  ),
};

export const StatusIndicators: Story = {
  render: () => (
    <div className="flex gap-4">
      <StatusIndicator status="online" />
      <StatusIndicator status="away" />
      <StatusIndicator status="busy" />
      <StatusIndicator status="offline" />
    </div>
  ),
};

export const Labels: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <LabelBadge variant="primary">New</LabelBadge>
      <LabelBadge variant="success">Active</LabelBadge>
      <LabelBadge variant="warning">Pending</LabelBadge>
      <LabelBadge variant="destructive">Error</LabelBadge>
      <LabelBadge removable onRemove={() => {}}>
        Removable
      </LabelBadge>
    </div>
  ),
};
