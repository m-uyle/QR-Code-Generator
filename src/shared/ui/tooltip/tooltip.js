const VIEWPORT_PADDING = 8;
const ANCHOR_GAP = 6;
const WARM_THRESHOLD_MS = 250;
const DEFAULT_DELAY_MS = 120;

let tooltipEl = null;
let currentAnchor = null;
let showTimer = null;
let lastHideTime = 0;

const ensureTooltipElement = () => {
  if (tooltipEl) {
    return tooltipEl;
  }
  tooltipEl = document.createElement("div");
  tooltipEl.className = "app-tooltip";
  tooltipEl.id = "app-tooltip";
  tooltipEl.setAttribute("role", "tooltip");
  tooltipEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(tooltipEl);
  return tooltipEl;
};

const positionTooltip = (anchor, el) => {
  const rect = anchor.getBoundingClientRect();
  const tipRect = el.getBoundingClientRect();

  let top = rect.top - tipRect.height - ANCHOR_GAP;
  if (top < VIEWPORT_PADDING) {
    top = rect.bottom + ANCHOR_GAP;
  }

  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  const maxLeft = window.innerWidth - tipRect.width - VIEWPORT_PADDING;
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  } else if (left > maxLeft) {
    left = maxLeft;
  }

  el.style.top = `${Math.round(top)}px`;
  el.style.left = `${Math.round(left)}px`;
};

const hideTooltip = () => {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (!currentAnchor) {
    return;
  }
  currentAnchor = null;
  lastHideTime = Date.now();
  if (tooltipEl) {
    tooltipEl.classList.remove("is-visible");
    tooltipEl.setAttribute("aria-hidden", "true");
  }
};

const showTooltip = (anchor, text) => {
  if (!(anchor && text)) {
    hideTooltip();
    return;
  }

  const el = ensureTooltipElement();
  currentAnchor = anchor;
  el.textContent = text;

  const isWarm = Date.now() - lastHideTime < WARM_THRESHOLD_MS;
  const delay = isWarm ? 0 : DEFAULT_DELAY_MS;

  if (showTimer) {
    clearTimeout(showTimer);
  }

  showTimer = setTimeout(() => {
    if (currentAnchor !== anchor) {
      return;
    }
    positionTooltip(anchor, el);
    el.classList.add("is-visible");
    el.setAttribute("aria-hidden", "false");
  }, delay);
};

const resolveTooltipText = (target) => {
  const anchor = target.closest?.("[data-tooltip], [title]");
  if (!anchor) {
    return { anchor: null, text: "" };
  }

  let text = anchor.dataset.tooltip;
  if (anchor.hasAttribute("title")) {
    text = anchor.getAttribute("title")?.trim() || "";
    anchor.dataset.tooltip = text;
    if (!anchor.hasAttribute("aria-label") && text) {
      anchor.setAttribute("aria-label", text);
    }
    anchor.removeAttribute("title");
  }

  return { anchor, text: text?.trim() || "" };
};

export const initTooltip = (options = {}) => {
  const { signal } = options;

  for (const el of document.querySelectorAll("[title]")) {
    const text = el.getAttribute("title")?.trim();
    if (text) {
      el.dataset.tooltip = text;
      if (!el.hasAttribute("aria-label")) {
        el.setAttribute("aria-label", text);
      }
      el.removeAttribute("title");
    }
  }

  const handlePointerEnter = (e) => {
    const { anchor, text } = resolveTooltipText(e.target);
    if (anchor && text) {
      showTooltip(anchor, text);
    }
  };

  const handlePointerLeave = (e) => {
    if (
      currentAnchor &&
      (e.target === currentAnchor || currentAnchor.contains(e.target))
    ) {
      hideTooltip();
    }
  };

  const handleFocusIn = (e) => {
    const { anchor, text } = resolveTooltipText(e.target);
    if (anchor && text) {
      showTooltip(anchor, text);
    }
  };

  const handleFocusOut = () => {
    hideTooltip();
  };

  const handleDismiss = () => {
    hideTooltip();
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape") {
      hideTooltip();
    }
  };

  document.addEventListener("pointerover", handlePointerEnter, {
    signal,
    passive: true,
  });
  document.addEventListener("pointerout", handlePointerLeave, {
    signal,
    passive: true,
  });
  document.addEventListener("focusin", handleFocusIn, {
    signal,
    passive: true,
  });
  document.addEventListener("focusout", handleFocusOut, {
    signal,
    passive: true,
  });
  document.addEventListener("pointerdown", handleDismiss, {
    signal,
    passive: true,
  });
  window.addEventListener("scroll", handleDismiss, { signal, passive: true });
  document.addEventListener("keydown", handleKeydown, { signal });

  signal?.addEventListener("abort", () => {
    hideTooltip();
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  });
};
