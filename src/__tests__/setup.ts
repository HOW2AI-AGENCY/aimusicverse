/**
 * Jest test setup file
 */

import "@testing-library/jest-dom";

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn(),
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: "http://test.com/file" } })),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Telegram WebApp
Object.defineProperty(window, "Telegram", {
  writable: true,
  value: {
    WebApp: {
      ready: jest.fn(),
      expand: jest.fn(),
      close: jest.fn(),
      MainButton: { show: jest.fn(), hide: jest.fn(), setText: jest.fn(), onClick: jest.fn(), offClick: jest.fn() },
      BackButton: { show: jest.fn(), hide: jest.fn(), onClick: jest.fn(), offClick: jest.fn() },
      HapticFeedback: { impactOccurred: jest.fn(), notificationOccurred: jest.fn(), selectionChanged: jest.fn() },
      initDataUnsafe: { user: { id: 123456789, first_name: "Test", last_name: "User" } },
      colorScheme: "dark",
      themeParams: {},
      viewportHeight: 800,
      viewportStableHeight: 800,
      isExpanded: true,
      platform: "tdesktop",
    },
  },
});

// Mock Audio
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 0,
  paused: true,
  volume: 1,
  muted: false,
  src: "",
}));

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({ gain: { value: 1 }, connect: jest.fn(), disconnect: jest.fn() })),
  createAnalyser: jest.fn(() => ({ connect: jest.fn(), disconnect: jest.fn(), getByteFrequencyData: jest.fn(), fftSize: 256 })),
  createMediaElementSource: jest.fn(() => ({ connect: jest.fn(), disconnect: jest.fn() })),
  destination: {},
  state: "running",
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
}));

// Mock crypto.randomUUID
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = jest.fn(() =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),
  ) as () => `${string}-${string}-${string}-${string}-${string}`;
}

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(""),
});
