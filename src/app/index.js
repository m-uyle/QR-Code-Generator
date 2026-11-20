import { initQrStudioPage } from "../pages/qr-studio/index.js";
import "../shared/styles/index.js";

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initQrStudioPage);
} else {
  initQrStudioPage();
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
