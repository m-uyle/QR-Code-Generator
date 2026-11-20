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
    <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  elToastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

export function showUndoToast(message, onUndo, ms = 5000) {
  const t = document.createElement("div");
  t.className = "undo-toast";
  t.setAttribute("role", "status");
  const label = document.createElement("span");
  label.textContent = message;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "undo-action-btn";
  btn.textContent = "Undo";
  const bar = document.createElement("i");
  bar.className = "undo-bar";
  bar.style.setProperty("--undo-duration", `${ms}ms`);
  t.append(label, btn, bar);
  document.body.appendChild(t);

  const place = () => {
    const win = document
      .querySelector("#studio-window")
      ?.getBoundingClientRect();
    const fields = document
      .querySelector("#group-margin")
      ?.getBoundingClientRect();
    const reset = document.querySelector("#btn-reset")?.getBoundingClientRect();
    if (!(win && fields && reset)) {
      return;
    }
    const h = t.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const above = win.top - h - 10;
    if (above >= 6) {
      t.style.setProperty("--undo-right", `${vw - fields.right}px`);
      t.style.setProperty("--undo-top", `${above}px`);
    } else {
      t.style.setProperty("--undo-right", `${vw - reset.left + 8}px`);
      t.style.setProperty("--undo-top", `${reset.top - h - 6}px`);
    }
  };

  place();
  requestAnimationFrame(() => t.classList.add("on"));
  let timer = null;

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      dismiss();
      const reset = document.querySelector("#btn-reset");
      reset?.focus();
    }
  };

  const dismiss = () => {
    clearTimeout(timer);
    window.removeEventListener("resize", place);
    window.removeEventListener("keydown", onKeyDown);
    t.classList.remove("on");
    setTimeout(() => t.remove(), 250);
  };

  btn.addEventListener("click", () => {
    dismiss();
    onUndo();
    const reset = document.querySelector("#btn-reset");
    reset?.focus();
  });
  window.addEventListener("resize", place);
  window.addEventListener("keydown", onKeyDown);
  timer = setTimeout(dismiss, ms);
}
