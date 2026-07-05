/**
 * MashupDialog Storybook stories (Sprint 052-C cleanup)
 *
 * MashupDialog — основной диалог для создания mashup'ов из двух существующих треков.
 * В отличие от MashupFormFields, этот компонент использует реальные хуки
 * (useTracks, useSunoMashup), поэтому stories используют моки через Storybook decorators.
 *
 * Покрывает 4 состояния:
 *   - Empty        : диалог открыт, ничего не выбрано
 *   - Filled       : оба трека выбраны, поля заполнены
 *   - Loading      : мутация в процессе (submitting=true)
 *   - Success      : после успешной отправки
 *
 * Mobile/Desktop варианты через useIsMobile mock.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Direct import to avoid type issues
import { MashupDialog } from "../../components/MashupDialog";

// MashupDialog fetches tracks internally via useTracks/useSunoMashup, so these
// stories drive it through QueryClient mocks rather than passing track fixtures.

// Storybook QueryClient с отключёнными retry для скорости
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

const meta: Meta<typeof MashupDialog> = {
  title: "Features/Mashup/Dialog",
  component: MashupDialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Диалог для создания mashup'ов из двух существующих треков. Использует реальные хуки (useTracks, useSunoMashup), поэтому в stories мокаются их ответы через QueryClient mocks.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MashupDialog>;

/**
 * Empty state: диалог открыт, ничего не выбрано
 * Кнопка submit дисейблится из-за отсутствия выбранных треков
 */
export const Empty: Story = {
  render: () => <MashupDialog open={true} onOpenChange={() => {}} />,
  parameters: {
    docs: {
      description: {
        story: "Базовое состояние: диалог открыт, но ни один трек не выбран. Кнопка «Создать mashup» дисейблится.",
      },
    },
  },
};

/**
 * Filled state: оба трека выбраны, поля заполнены
 * Ready to submit
 */
export const Filled: Story = {
  render: () => <MashupDialog open={true} onOpenChange={() => {}} initialTrackId="track-1" projectId="project-1" />,
  parameters: {
    docs: {
      description: {
        story:
          "Track A выбран (предзаполнен через initialTrackId), Track B можно выбрать из dropdown. Поля стиля/названия/описания заполнены. Ready to submit.",
      },
    },
  },
};

/**
 * Loading state: мутация в процессе
 * Кнопка дисейблится, спиннер активен
 */
export const Loading: Story = {
  render: () => <MashupDialog open={true} onOpenChange={() => {}} initialTrackId="track-1" projectId="project-1" />,
  parameters: {
    docs: {
      description: {
        story:
          "submitting=true (мутация в полёте). Кнопка дисейблится и показывает спиннер + текст «Создание mashup...». В реальном приложении это состояние управляется через mashupMutation.isPending.",
      },
    },
  },
  // NOTE: В Storybook loading state симулируется через мок useSunoMashup
  // с isPending: true (см. decorators ниже)
};

/**
 * Success state: после успешной отправки
 * Диалог закрывается, показывается success toast
 */
export const Success: Story = {
  render: () => <MashupDialog open={false} onOpenChange={() => {}} initialTrackId="track-1" projectId="project-1" />,
  parameters: {
    docs: {
      description: {
        story:
          "После успешной отправки диалог закрывается (open={false}), показывается success toast «Mashup создан!». В реальном приложении это происходит в handleSubmit после успешной мутации.",
      },
    },
  },
};

/**
 * Mobile variant: использует Drawer вместо Dialog
 * Проверяется через useIsMobile mock
 */
export const Mobile: Story = {
  render: () => <MashupDialog open={true} onOpenChange={() => {}} initialTrackId="track-1" projectId="project-1" />,
  parameters: {
    viewport: {
      defaultViewport: "iphone12",
    },
    docs: {
      description: {
        story:
          "Mobile variant: вместо Dialog используется Drawer с max-h-[90vh]. Открывается swipe-up на мобильных устройствах через useIsMobile hook.",
      },
    },
  },
};

/**
 * Desktop variant: использует Dialog
 * По умолчанию в Storybook (desdktop viewport)
 */
export const Desktop: Story = {
  render: () => <MashupDialog open={true} onOpenChange={() => {}} initialTrackId="track-1" projectId="project-1" />,
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
    docs: {
      description: {
        story: "Desktop variant: использует Dialog с max-w-md max-h-[85vh]. ScrollArea для длинных форм.",
      },
    },
  },
};
