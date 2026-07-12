import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "../src/index.css";

// Storybook-global mock contexts (aliased via .storybook/main.js):
//   @/contexts/AuthContext           -> .storybook/mocks/AuthContext.tsx
//   @/contexts/TelegramContext       -> .storybook/mocks/TelegramContext.tsx
//   @/contexts/telegram/TelegramProvider -> .storybook/mocks/TelegramContext.tsx
//   @/contexts/ThemeContext          -> .storybook/mocks/ThemeContext.tsx
//   @/contexts/NotificationContext   -> .storybook/mocks/NotificationContext.tsx
//   @/hooks/useNotifications         -> .storybook/mocks/NotificationContext.tsx
//
// Stories that need additional providers (e.g. playerStore, modal root, etc.)
// should declare them via their own `decorators` array — keep this preview
// file lean so it works for every story.

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
          TooltipProvider,
          { delayDuration: 150, skipDelayDuration: 300 },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(React.Fragment, null, React.createElement(Story), React.createElement(Sonner, null)),
          ),
        ),
      ),
  ],
};

export default preview;
