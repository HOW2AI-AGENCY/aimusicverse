import type { Meta, StoryObj } from "@storybook/react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const meta: Meta<typeof LoadingOverlay> = {
  title: "UI/LoadingOverlay",
  component: LoadingOverlay,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    visible: { control: "boolean" },
    variant: { control: { type: "select" }, options: ["default", "blur", "solid", "gradient"] },
    icon: { control: { type: "select" }, options: ["spinner", "music", "sparkles"] },
    fullScreen: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingOverlay>;

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-72 h-40 rounded-xl bg-muted/30 border overflow-hidden flex items-center justify-center">
    <p className="text-sm text-muted-foreground">Содержимое</p>
    {children}
  </div>
);

export const SpinnerOverlay: Story = {
  render: () => (
    <Card>
      <LoadingOverlay visible message="Загрузка..." />
    </Card>
  ),
};

export const MusicIcon: Story = {
  render: () => (
    <Card>
      <LoadingOverlay visible icon="music" message="Генерация трека" submessage="Это займёт около минуты" />
    </Card>
  ),
};

export const SparklesIcon: Story = {
  render: () => (
    <Card>
      <LoadingOverlay visible icon="sparkles" message="AI создаёт текст" variant="gradient" />
    </Card>
  ),
};

export const BlurVariant: Story = {
  render: () => (
    <Card>
      <LoadingOverlay visible variant="blur" message="Обработка..." />
    </Card>
  ),
};

export const SolidVariant: Story = {
  render: () => (
    <Card>
      <LoadingOverlay visible variant="solid" message="Загрузка данных" />
    </Card>
  ),
};

export const Hidden: Story = {
  render: () => (
    <Card>
      <LoadingOverlay visible={false} message="Не отображается" />
    </Card>
  ),
};
