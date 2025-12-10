import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "./lib/logger";

// Global error handlers to prevent app crashes
const mainLogger = logger.child({ module: 'main' });

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  mainLogger.error('Unhandled promise rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  event.preventDefault(); // Prevent default browser error console
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  mainLogger.error('Uncaught error', event.error instanceof Error ? event.error : new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
  event.preventDefault(); // Prevent default browser error console
});

// App entry point
createRoot(document.getElementById("root")!).render(<App />);
