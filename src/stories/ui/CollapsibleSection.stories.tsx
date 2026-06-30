import type { Meta, StoryObj } from "@storybook/react";
import { Collapsible } from "@/components/ui/CollapsibleSection";
import { Music, Settings, Info } from "lucide-react";

const meta: Meta<typeof Collapsible> = {
  title: "UI/CollapsibleSection",
  component: Collapsible,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: { control: "boolean" },
    disabled: { control: "boolean" },
    variant: { control: { type: "select" }, options: ["default", "card", "ghost"] },
  },
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

const Content = () => (
  <div className="p-4 text-sm text-muted-foreground">
    <p>Содержимое секции. Может содержать любые компоненты.</p>
    <p className="mt-2">Ещё одна строка содержимого для демонстрации высоты.</p>
  </div>
);

export const Default: Story = {
  args: { title: "Настройки генерации", children: <Content /> },
};

export const OpenByDefault: Story = {
  args: { title: "Открыто по умолчанию", defaultOpen: true, children: <Content /> },
};

export const WithIcon: Story = {
  args: { title: "Музыкальные настройки", icon: Music, defaultOpen: true, children: <Content /> },
};

export const WithBadge: Story = {
  args: { title: "Треки", badge: 12, icon: Music, children: <Content /> },
};

export const CardVariant: Story = {
  args: { title: "Карточка", variant: "card", defaultOpen: true, children: <Content /> },
};

export const GhostVariant: Story = {
  args: { title: "Призрак", variant: "ghost", children: <Content /> },
};

export const Disabled: Story = {
  args: { title: "Отключено", disabled: true, children: <Content /> },
};

export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col w-80">
      <Collapsible title="Основные настройки" icon={Settings} defaultOpen>
        <Content />
      </Collapsible>
      <Collapsible title="Дополнительно" icon={Info} badge={3}>
        <Content />
      </Collapsible>
      <Collapsible title="Треки" icon={Music} badge="NEW">
        <Content />
      </Collapsible>
    </div>
  ),
};
