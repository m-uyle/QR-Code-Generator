import { initQrStudioPage } from "../pages/qr-studio/index.js";
import "../shared/styles/index.js";

const escapeHtml = (str) =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderErrorFallback = (error) => {
  const rawMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  const message = escapeHtml(rawMessage);
  return `
    <main class="w-studio surface-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border border-neutral-200 shadow-field select-none" role="alert" aria-live="assertive">
      <div class="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-500">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-base font-semibold text-neutral-800">Something went wrong</h1>
        <p class="text-xs text-neutral-500 leading-relaxed max-w-xs">${message}</p>
      </div>
      <div class="flex items-center gap-2 pt-2">
        <button type="button" id="btn-fallback-retry" class="btn-tactile px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
          Try Again
        </button>
        <button type="button" id="btn-fallback-reset" class="btn-tactile px-4 py-2 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors">
          Reset State
        </button>
      </div>
    </main>
  `;
};

if (window.trustedTypes?.createPolicy) {
  try {
    window.trustedTypes.createPolicy("default", {
      createHTML: (string) => string,
    });
  } catch {
    // Policy already registered or restricted by CSP
  }
}

const mountApp = () => {
  try {
    initQrStudioPage();
  } catch (error) {
    const appEl = document.querySelector("#app");
    if (appEl) {
      appEl.innerHTML = renderErrorFallback(error);
      const retryBtn = document.querySelector("#btn-fallback-retry");
      const resetBtn = document.querySelector("#btn-fallback-reset");
      retryBtn?.addEventListener("click", () => mountApp());
      resetBtn?.addEventListener("click", () => {
        try {
          localStorage.removeItem("qr_studio_state_v1");
        } catch {
          // Ignore localStorage access failure
        }
        window.location.reload();
      });
    }
  }
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mountApp);
} else {
  mountApp();
}

if (
  "serviceWorker" in navigator &&
  (window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
) {
  const registerSw = () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline capability registration failure guard
    });
  };

  if (document.readyState === "complete") {
    registerSw();
  } else {
    window.addEventListener("load", registerSw, { once: true });
  }
}
