/**
 * MashupFormFields Storybook stories (Sprint 052-C cleanup)
 *
 * MashupFormFields — pure-Dumb sub-component извлечённый из MashupDialog
 * в Sprint 052-C. Все состояния через props, без TanStack Query hooks →
 * stories тривиально работают в Storybook runtime.
 *
 * Покрывает 5 состояний:
 *   - Empty        : ничего не выбрано
 *   - FilledA      : trackA выбран, поля заполнены, custom-mode + vocal
 *   - Instrumental : customMode off, instrumental on (нет prompt)
 *   - Loading      : submitting=true (кнопка + спиннер)
 *   - Invalid      : кнопка дисейблится из-за невалидных полей
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MashupFormFields } from "@/components/mashup/MashupFormFields";
import type { MashupTrackOption, MashupModelOption, MashupFormFieldsProps } from "@/components/mashup/MashupFormFields";
import { getAvailableModels } from "@/constants/sunoModels";

const TRACK_OPTIONS: MashupTrackOption[] = [
  { value: "track-a", label: "Midnight Dreams" },
  { value: "track-b", label: "Neon Sunset" },
  { value: "track-c", label: "Velvet Highway" },
];

const MODEL_OPTIONS: MashupModelOption[] = getAvailableModels().map((m) => ({
  key: m.key,
  label: m.label,
}));

const meta: Meta<typeof MashupFormFields> = {
  title: "Features/Mashup/FormFields",
  component: MashupFormFields,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Pure-Dumb форма mashup'а: два трека + Suno-параметры. Вынесена из MashupDialog в Sprint 052-C для Storybook stories + лучшего юнит-тестирования. Состояние и сабмит — ответственность родителя.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MashupFormFields>;

// Helper: обёртка со stateful контролами (т.к. props должны быть контролируемыми)
const StatefulForm = (
  initial: Partial<MashupFormFieldsProps> & {
    scenario: "empty" | "filledA" | "instrumental" | "loading" | "invalid";
  },
) => {
  const [trackAId, setTrackAId] = useState(initial.trackAId ?? "");
  const [trackBId, setTrackBId] = useState(initial.trackBId ?? "");
  const [customMode, setCustomMode] = useState(initial.customMode ?? true);
  const [instrumental, setInstrumental] = useState(initial.instrumental ?? false);
  const [style, setStyle] = useState(initial.style ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [prompt, setPrompt] = useState(initial.prompt ?? "");
  const [model, setModel] = useState(initial.model ?? MODEL_OPTIONS[0]?.key ?? "V4_5ALL");

  const trackOptionsB = TRACK_OPTIONS.filter((o) => o.value !== trackAId);

  // Сценарии заполнения по умолчанию
  const defaults = (() => {
    switch (initial.scenario) {
      case "filledA":
        return {
          trackAId: "track-a",
          customMode: true,
          style: "Upbeat electronic with vocal chops",
          title: "Midnight Mashup",
          prompt: "Synth-heavy mumblecore with trap drums",
          instrumental: false,
        };
      case "instrumental":
        return {
          trackAId: "track-a",
          customMode: false,
          instrumental: true,
        };
      case "invalid":
        return {
          trackAId: "track-a",
          customMode: true,
          style: "",
          title: "",
          instrumental: false,
          prompt: "",
        };
      case "empty":
      case "loading":
      default:
        return {};
    }
  })();

  // Применяем defaults при первом рендере (если state пустой)
  if (!trackAId && defaults.trackAId) setTrackAId(defaults.trackAId);
  if (!style && defaults.style !== undefined) setStyle(defaults.style);
  if (!title && defaults.title !== undefined) setTitle(defaults.title);
  if (!prompt && defaults.prompt !== undefined) setPrompt(defaults.prompt);
  if (customMode && defaults.customMode === false) setCustomMode(false);
  if (!instrumental && defaults.instrumental === true) setInstrumental(true);

  const submitting = initial.scenario === "loading";

  return (
    <div className="w-[28rem] rounded-lg border bg-card p-6 shadow-lg">
      <MashupFormFields
        trackAId={trackAId}
        trackBId={trackBId}
        onTrackAChange={setTrackAId}
        onTrackBChange={setTrackBId}
        trackOptions={TRACK_OPTIONS}
        trackOptionsB={trackOptionsB}
        customMode={customMode}
        onCustomModeChange={setCustomMode}
        instrumental={instrumental}
        onInstrumentalChange={setInstrumental}
        style={style}
        onStyleChange={setStyle}
        title={title}
        onTitleChange={setTitle}
        prompt={prompt}
        onPromptChange={setPrompt}
        model={model}
        onModelChange={setModel}
        modelOptions={MODEL_OPTIONS}
        submitting={submitting}
        onSubmit={() => {
          // Storybook demo — реальный submit вне scope
          // eslint-disable-next-line no-console
          console.info("[story] submit", { trackAId, trackBId, style, title, prompt, instrumental });
        }}
      />
    </div>
  );
};

export const Empty: Story = {
  render: () => StatefulForm({ scenario: "empty" }),
  parameters: {
    docs: {
      description: { story: "Базовое состояние: ничего не выбрано, кнопка дисейблится." },
    },
  },
};

export const FilledA: Story = {
  render: () => StatefulForm({ scenario: "filledA" }),
  parameters: {
    docs: {
      description: {
        story: "Track A выбран, поля стиля/названия/описания заполнены, custom-mode + vocal. Ready to submit.",
      },
    },
  },
};

export const Instrumental: Story = {
  render: () => StatefulForm({ scenario: "instrumental" }),
  parameters: {
    docs: {
      description: {
        story: "Custom-mode выключен (нет стиля/названия), instrumental on (нет prompt). Минимальная конфигурация.",
      },
    },
  },
};

export const Loading: Story = {
  render: () => StatefulForm({ scenario: "loading" }),
  parameters: {
    docs: {
      description: {
        story:
          "submitting=true (мутация в полёте). Кнопка дисейблится и показывает спиннер + текст «Создание mashup...».",
      },
    },
  },
};

export const Invalid: Story = {
  render: () => StatefulForm({ scenario: "invalid" }),
  parameters: {
    docs: {
      description: {
        story:
          "Custom-mode on, но поля стиля/названия пустые → кнопка дисейблится по встроенной логике `disabled={customMode && (!style || !title)}`.",
      },
    },
  },
};
