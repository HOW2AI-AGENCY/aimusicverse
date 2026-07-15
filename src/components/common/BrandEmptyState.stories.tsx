/**
 * Storybook stories — BrandEmptyState
 *
 * Demonstrates the onboarding-quality, brand-anchored empty state used across
 * Library / Community / Projects after the Neon Studio redesign (Sprint 065).
 *
 * Coverage:
 * - Minimal (title only)
 * - Eyebrow + description + hint chips
 * - Primary + secondary actions
 * - Custom icon + realistic Library-empty usage
 */
import type { Meta, StoryObj } from "@storybook/react";
import { Sparkles, Music2, Search, Library, Wand2, Plus } from "@/lib/icons";
import { BrandEmptyState } from "./BrandEmptyState";

const meta: Meta<typeof BrandEmptyState> = {
  title: "Common/BrandEmptyState",
  component: BrandEmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Brand-anchored empty state (locked Neon Studio palette: violet #7C5CFF + mint #22E4A7, Bricolage Grotesque headings). Supports an eyebrow, description, hint chips, and up to two actions.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
    eyebrow: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
    hints: { control: "object" },
    primaryAction: { control: false },
    secondaryAction: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof BrandEmptyState>;

export const Minimal: Story = {
  args: {
    title: "Здесь пока пусто",
  },
  parameters: {
    docs: { description: { story: "Bare minimum — just a title with the default Sparkles anchor." } },
  },
};

export const WithHints: Story = {
  args: {
    icon: Sparkles,
    eyebrow: "С чего начать",
    title: "Создай свой первый трек",
    description: "Опиши идею — стиль, настроение, вокал — и MusicVerse соберёт две версии за минуту.",
    hints: ["фонк про ночной Токио", "ло-фай для учёбы", "эпичный оркестр"],
  },
  parameters: {
    docs: { description: { story: "Eyebrow, description, and tappable idea chips for onboarding." } },
  },
};

export const WithActions: Story = {
  args: {
    icon: Music2,
    eyebrow: "Библиотека",
    title: "Твоя музыка появится здесь",
    description: "Сгенерируй трек или загрузи собственный — всё сохранится в одном месте.",
    primaryAction: { label: "Создать трек", onClick: () => {}, icon: Wand2, variant: "primary" },
    secondaryAction: { label: "Загрузить", onClick: () => {}, icon: Plus, variant: "ghost" },
  },
  parameters: {
    docs: { description: { story: "Primary (mint) + secondary (ghost) actions with icons." } },
  },
};

export const LibraryEmpty: Story = {
  args: {
    icon: Library,
    title: "В библиотеке пока нет треков",
    description: "Начни с генерации — готовые треки будут храниться здесь.",
    primaryAction: { label: "Сгенерировать", onClick: () => {}, icon: Wand2 },
  },
  parameters: {
    docs: { description: { story: "Realistic Library empty state with a single primary action." } },
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: Search,
    eyebrow: "Поиск",
    title: "Ничего не найдено",
    description: "Попробуй изменить запрос или сбросить фильтры.",
    secondaryAction: { label: "Сбросить фильтры", onClick: () => {} },
  },
  parameters: {
    docs: { description: { story: "No-results variant with a single ghost action." } },
  },
};
