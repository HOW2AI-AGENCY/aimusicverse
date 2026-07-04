import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "@/components/ui/StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "UI/StatusBadge",
  component: StatusBadge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: { type: "select" },
      options: [
        "success",
        "pending",
        "warning",
        "error",
        "loading",
        "generating",
        "playing",
        "processing",
        "downloading",
        "idle",
      ],
    },
    size: { control: { type: "select" }, options: ["xs", "sm", "md"] },
    pulse: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Success: Story = { args: { status: "success", label: "Готово" } };
export const Generating: Story = { args: { status: "generating", label: "Генерация..." } };
export const Loading: Story = { args: { status: "loading", pulse: true } };
export const Error: Story = { args: { status: "error", label: "Ошибка" } };
export const Playing: Story = { args: { status: "playing", pulse: true } };
export const Pending: Story = { args: { status: "pending", label: "В очереди" } };
export const Downloading: Story = { args: { status: "downloading", label: "Загрузка" } };
export const Processing: Story = { args: { status: "processing", label: "Обработка" } };

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <StatusBadge status="success" size="xs" label="xs size" />
      <StatusBadge status="success" size="sm" label="sm size" />
      <StatusBadge status="success" size="md" label="md size" />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(
        [
          "success",
          "pending",
          "warning",
          "error",
          "loading",
          "generating",
          "playing",
          "processing",
          "downloading",
          "idle",
        ] as const
      ).map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
