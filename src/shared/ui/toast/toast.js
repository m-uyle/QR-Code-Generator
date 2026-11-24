export function renderToastContainer() {
  return `<div id="toast-container" class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite"></div>`;
}

export function showToast(message) {
  const elToastContainer = document.querySelector("#toast-container");
  if (!elToastContainer) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.innerHTML = `
    <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
  `;
  const span = document.createElement("span");
  span.textContent = String(message ?? "");
  toast.appendChild(span);
  elToastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}
