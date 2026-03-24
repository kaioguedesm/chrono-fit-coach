import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_VERSION = "2026-03-24-cache-fix-1";
const VERSION_KEY = "nexfit-app-version";
const RECOVERY_KEY = "nexfit-cache-recovery";

const chunkLoadErrorPatterns = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "ChunkLoadError",
  "Loading chunk",
];

const isChunkLoadError = (value: unknown) => {
  const message = value instanceof Error ? value.message : String(value ?? "");
  return chunkLoadErrorPatterns.some((pattern) => message.includes(pattern));
};

const clearBrowserRuntimeCache = async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  }
};

const recoverFromStaleAssets = async () => {
  if (sessionStorage.getItem(RECOVERY_KEY) === APP_VERSION) {
    return;
  }

  sessionStorage.setItem(RECOVERY_KEY, APP_VERSION);
  await clearBrowserRuntimeCache();
  window.location.reload();
};

window.addEventListener("error", (event) => {
  if (isChunkLoadError(event.error ?? event.message)) {
    event.preventDefault();
    void recoverFromStaleAssets();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    void recoverFromStaleAssets();
  }
});

async function bootstrap() {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== APP_VERSION) {
      await clearBrowserRuntimeCache();
      localStorage.setItem(VERSION_KEY, APP_VERSION);
    }
  } catch (error) {
    console.error("[Bootstrap] Falha ao limpar cache antigo:", error);
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
