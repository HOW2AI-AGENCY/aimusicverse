/**
 * Storybook story — BrandEmptyState
 *
 * Onboarding-quality empty state on the Neon Studio palette
 * (violet #7C5CFF + mint #22E4A7, Bricolage Grotesque headings).
 */
import type { Meta, StoryObj } from "@storybook/react";
import { Music2, Sparkles, ArrowRight } from "@/lib/icons";
import { BrandEmptyState } from "@/components/common/BrandEmptyState";

const meta: Meta<typeof BrandEmptyState> = {
  title: "Common/BrandEmptyState",
  component: BrandEmptyState,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BrandEmptyState>;

export const Default: Story = {
  args: {
    eyebrow: "Библиотека пуста",
    title: "Твои треки появятся здесь",
    description: "Сгенерируй первый трек — и он сразу попадёт в библиотеку.",
    primaryAction: {
      label: "Создать трек",
      onClick: () => alert("create"),
      icon: ArrowRight,
    },
    hints: ["Фонк", "Lo-fi", "Электропоп"],
  },
};

export const Minimal: Story = {
  args: {
    title: "Пока пусто",
    icon: Music2,
  },
};

export const WithTwoActions: Story = {
  args: {
    eyebrow: "Нет проектов",
    title: "Начни новый проект",
    description: "Собери трек из стемов или сгенерируй с нуля.",
    primaryAction: {
      label: "Новый проект",
      onClick: () => alert("new"),
      icon: Sparkles,
    },
    secondaryAction: {
      label: "Импортировать",
      onClick: () => alert("import"),
    },
  },
};
