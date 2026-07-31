/**
 * Regression tests for ProtectedRoute + Telegram auto-login.
 *
 * Inside a real Telegram Mini App, `getSession()` resolves as anonymous before
 * the `initData` handshake lands a session. The guard must wait (skeleton)
 * instead of redirecting to /auth — a redirect there dropped the session and
 * the deep-link target.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const authState = {
  isAuthenticated: false,
  loading: false,
  isTelegramAuthPending: false,
};
let guestMode = false;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/contexts/GuestModeContext", () => ({
  useGuestMode: () => ({ isGuestMode: guestMode }),
}));

vi.mock("@/components/skeletons/PageSkeleton", () => ({
  PageSkeleton: () => <div data-testid="page-skeleton" />,
}));

const renderGuard = (initialPath = "/library") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content" />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<div data-testid="auth-page" />} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.loading = false;
    authState.isTelegramAuthPending = false;
    guestMode = false;
    // Simulate a real Telegram Mini App so the dev-preview bypass is inactive.
    (window as unknown as { Telegram: unknown }).Telegram = {
      WebApp: { initData: "user=%7B%22id%22%3A1%7D&hash=abc" },
    };
    Object.defineProperty(window, "location", {
      value: { ...window.location, hostname: "aimusicverse.lovable.app", search: "" },
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    (window as unknown as { Telegram: unknown }).Telegram = { WebApp: { initData: "" } };
  });

  it("waits instead of redirecting while the Telegram handshake is pending", () => {
    authState.isTelegramAuthPending = true;

    renderGuard();

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-page")).not.toBeInTheDocument();
  });

  it("renders children once the Telegram session lands", () => {
    authState.isTelegramAuthPending = false;
    authState.isAuthenticated = true;

    renderGuard();

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("redirects to /auth only after the handshake settled without a session", () => {
    authState.isTelegramAuthPending = false;
    authState.isAuthenticated = false;

    renderGuard();

    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
  });

  it("shows the skeleton while auth is still loading", () => {
    authState.loading = true;

    renderGuard();

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });
});
