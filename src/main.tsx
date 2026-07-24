import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App.tsx";
// Brand fonts (Space Grotesk for display, DM Sans for body)
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./index.css";
// Feature 032-professional-ui: Design system CSS imports
import "./styles/typography.css";
import "./styles/colors.css";
import "./styles/spacing.css";
import "./styles/shadows.css";
import "./styles/animations.css";
// Feature 033-mobile-ui-improvements: Accessibility and shimmer styles
import "./styles/accessibility.css";
import "./styles/shimmer.css";
// Feature 036-mobile-perf-ux-redesign: Consolidated design tokens
import "./styles/tokens.css";
import { logger } from "./lib/logger";
import { initSentry, captureError } from "./lib/sentry";
import { initTelemetry } from "./lib/telemetry";
import { migrateQueueFromPlayerStore } from "./lib/migration";
import { perfMark, perfMeasure } from "./lib/perfMarks";

perfMark("app:scriptStart");


// === CRITICAL: Early error logging for black screen debugging ===
const BOOT_LOG: string[] = [];
const bootLog = (msg: string) => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${msg}`;
  BOOT_LOG.push(entry);
  console.log(`[BOOT] ${entry}`);

  // Also save to sessionStorage for persistence
  try {
    sessionStorage.setItem("musicverse_boot_log", JSON.stringify(BOOT_LOG));
  } catch (e) {
    // Ignore storage errors
  }
};

bootLog("main.tsx: Script started");
bootLog(`Platform: ${navigator.userAgent}`);
bootLog(`URL: ${window.location.href}`);
bootLog(`Telegram WebApp available: ${!!window.Telegram?.WebApp}`);

// Expose boot log globally for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Debug-only window augmentation for DevTools hooks
(window as any).__BOOT_LOG = BOOT_LOG;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Debug-only window augmentation for DevTools hooks
(window as any).__getBootLog = () => BOOT_LOG.join("\n");

// Initialize error tracking
try {
  initSentry();
  initTelemetry();
  bootLog("Sentry and Telemetry initialized");
} catch (e) {
  bootLog(`Init failed: ${e}`);
}

// Global error handlers to prevent app crashes
const mainLogger = logger.child({ module: "main" });

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const errorMsg =
    event.reason instanceof Error ? `${event.reason.name}: ${event.reason.message}` : String(event.reason);

  bootLog(`Unhandled rejection: ${errorMsg}`);

  // Ignore AbortError - these are expected during component cleanup
  if (event.reason?.name === "AbortError") {
    event.preventDefault();
    return;
  }

  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  mainLogger.error("Unhandled promise rejection", error);
  captureError(error, { type: "unhandledrejection" });
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener("error", (event) => {
  bootLog(`Uncaught error: ${event.message} at ${event.filename}:${event.lineno}`);

  const error = event.error instanceof Error ? event.error : new Error(event.message);
  mainLogger.error("Uncaught error", error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
  captureError(error, {
    type: "uncaughterror",
    filename: event.filename,
    lineno: event.lineno,
  });
  event.preventDefault();
});

// Dynamic viewport height fix for mobile browsers
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

setViewportHeight();
window.addEventListener("resize", setViewportHeight);
window.addEventListener("orientationchange", () => {
  setTimeout(setViewportHeight, 100);
});

// iOS Keyboard height tracking via visualViewport API
// This allows CSS to respond to keyboard appearance
if ("visualViewport" in window && window.visualViewport) {
  const updateKeyboardHeight = () => {
    const keyboardHeight = window.innerHeight - window.visualViewport!.height;
    const safeKeyboardHeight = Math.max(0, keyboardHeight);
    document.documentElement.style.setProperty("--keyboard-height", `${safeKeyboardHeight}px`);

    // Add/remove class for keyboard-open state
    if (safeKeyboardHeight > 100) {
      document.body.classList.add("keyboard-open");
    } else {
      document.body.classList.remove("keyboard-open");
    }
  };

  window.visualViewport.addEventListener("resize", updateKeyboardHeight);
  window.visualViewport.addEventListener("scroll", updateKeyboardHeight);
  updateKeyboardHeight();
}

bootLog("Event listeners registered");

// Run data migrations before app render
try {
  migrateQueueFromPlayerStore();
  bootLog("Queue migration completed");
} catch (e) {
  bootLog(`Queue migration failed: ${e}`);
}

// Register Audio Service Worker for offline caching
if ("serviceWorker" in navigator) {
  // Register after initial render to not block app startup
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/audio-sw.js", { scope: "/" })
      .then((registration) => {
        bootLog(`Audio SW registered: ${registration.scope}`);
      })
      .catch((error) => {
        bootLog(`Audio SW registration failed: ${error}`);
      });
  });
}

// App entry point
try {
  bootLog("Creating React root...");
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    bootLog("CRITICAL: Root element not found!");
    throw new Error("Root element not found");
  }

  bootLog("Root element found, rendering App...");
  const root = createRoot(rootElement);
  perfMark("app:beforeRender");
  perfMeasure("app: scriptStart → beforeRender", "app:scriptStart", "app:beforeRender");
  root.render(<App />);
  perfMark("app:renderCalled");
  bootLog("App render called");

  // Measure first paint / interactive frames after render.
  requestAnimationFrame(() => {
    perfMark("app:firstFrame");
    perfMeasure("app: scriptStart → firstFrame", "app:scriptStart", "app:firstFrame");
    requestAnimationFrame(() => {
      perfMark("app:secondFrame");
      perfMeasure("app: scriptStart → secondFrame", "app:scriptStart", "app:secondFrame");
    });
  });

  // When the browser is idle, log navigation + paint timings to logger.
  const logNavTimings = () => {
    try {
      const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint");
      logger.info("[perf] navigation timings", {
        dom_content_loaded_ms: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        load_event_ms: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
        first_contentful_paint_ms: fcp ? Math.round(fcp.startTime) : null,
        transfer_size_bytes: nav?.transferSize ?? null,
      });
    } catch {
      /* noop */
    }
  };
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(logNavTimings);
  } else {
    window.addEventListener("load", () => setTimeout(logNavTimings, 0));
  }

} catch (e) {
  bootLog(`CRITICAL: React render failed: ${e}`);
  captureError(e);

  // Show error on screen
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h2>App failed to start</h2>
        <pre>${e}</pre>
        <h3>Boot Log:</h3>
        <pre>${BOOT_LOG.join("\n")}</pre>
      </div>
    `;
  }
}
