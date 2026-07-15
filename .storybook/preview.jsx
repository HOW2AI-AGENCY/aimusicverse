import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "../.storybook/mocks/AuthContext";
import { ThemeProvider } from "../.storybook/mocks/ThemeContext";
import { TelegramProvider } from "../.storybook/mocks/TelegramContext";
import { NotificationProvider } from "../.storybook/mocks/NotificationContext";
import "../src/index.css";

/**
 * Storybook global preview decorator.
 *
 * Mounts all required providers so stories can render in isolation:
 *   QueryClient (TanStack Query)     - data fetching
 *   MemoryRouter                     - react-router
 *   TooltipProvider (Radix)          - shadcn/ui tooltips
 *   Sonner                           - toasts
 *   ThemeProvider (mock)             - dark theme by default
 *   TelegramProvider (mock)          - mock Telegram WebApp
 *   AuthProvider (mock)              - mock authenticated user
 *   NotificationProvider (mock)      - empty notifications
 *
 * NOTE: we import mock providers from .storybook/mocks/ directly (not
 * via @/ alias) because resolve.alias from viteFinal does not always
 * apply in the dev server — explicit imports work in both dev and build.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid noisy retries in stories
      retry: false,
      // No background refetches in Storybook
      refetchOnWindowFocus: false,
    },
  },
});

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(
              TelegramProvider,
              null,
              React.createElement(
                AuthProvider,
                null,
                React.createElement(
                  NotificationProvider,
                  null,
                  React.createElement(
                    TooltipProvider,
                    { delayDuration: 150, skipDelayDuration: 300 },
                    React.createElement(React.Fragment, null, React.createElement(Story), React.createElement(Sonner, null)),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
  ],
};

export default preview;
