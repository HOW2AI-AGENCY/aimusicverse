/**
 * MashupDialog Unit Tests
 *
 * Регрессия на hotfix Sprint 052: компонент должен читать `tracks`
 * (а не `data`) из useTracks — иначе пикеры треков остаются пустыми.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MashupDialog } from "@/components/MashupDialog";

vi.mock("@/hooks/useTracks", () => ({
  useTracks: () => ({
    tracks: [
      { id: "track-a", title: "Track One" },
      { id: "track-b", title: "Track Two" },
    ],
  }),
}));

vi.mock("@/hooks/studio/useSunoMashup", () => ({
  useSunoMashup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

// Тянет useTelegram/TelegramProvider — вне рамок этого unit-теста
vi.mock("@/components/generate-form/PromptValidationAlert", () => ({
  PromptValidationAlert: () => null,
}));

describe("MashupDialog", () => {
  beforeAll(() => {
    // Radix Select в jsdom: pointer-capture и scrollIntoView отсутствуют
    Element.prototype.hasPointerCapture = vi.fn();
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
    // Глобальный мок из setup — не конструктор; Radix popper делает `new ResizeObserver()`
    globalThis.ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
  });

  it("renders dialog with track pickers when open", async () => {
    render(<MashupDialog open={true} onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Смешайте два своих трека в один")).toBeInTheDocument();
    });
    expect(screen.getByText("Трек A *")).toBeInTheDocument();
    expect(screen.getByText("Трек B *")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<MashupDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Трек A *")).not.toBeInTheDocument();
  });

  it("populates track A options from useTracks().tracks (hotfix regression)", async () => {
    render(<MashupDialog open={true} onOpenChange={() => {}} />);

    const triggers = await screen.findAllByRole("combobox");
    // Радикс-селект открывается с клавиатуры — надёжно в jsdom
    fireEvent.keyDown(triggers[0], { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Track One" })).toBeInTheDocument();
    });
    expect(screen.getByRole("option", { name: "Track Two" })).toBeInTheDocument();
  });

  it("excludes track A from track B options", async () => {
    render(<MashupDialog open={true} onOpenChange={() => {}} initialTrackId="track-a" />);

    const triggers = await screen.findAllByRole("combobox");
    fireEvent.keyDown(triggers[1], { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Track Two" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("option", { name: "Track One" })).not.toBeInTheDocument();
  });
});
