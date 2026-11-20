import {
  getMotionTokens,
  reducedMotion,
} from "../../../shared/config/index.js";

let swapTimer = 0;

export function updateAccordionHeight() {
  const elAccordion = document.querySelector("#payload-accordion-container");
  if (!elAccordion) {
    return;
  }
  const activeField = elAccordion.querySelector(".type-field:not(.hidden)");
  if (activeField) {
    const targetHeight = activeField.offsetHeight;
    elAccordion.style.setProperty("--accordion-h", `${targetHeight}px`);
  }
}

export function swapField(prev, next) {
  clearTimeout(swapTimer);
  const MOTION = getMotionTokens();
  const show = () => {
    for (const f of document.querySelectorAll(".type-field")) {
      f.classList.add("hidden");
      f.classList.remove("flex", "leaving");
    }
    if (next) {
      next.classList.remove("hidden");
      next.classList.add("flex");
    }
    updateAccordionHeight();
  };
  if (!prev || prev === next || reducedMotion()) {
    show();
    return;
  }
  prev.classList.add("leaving");
  swapTimer = setTimeout(show, MOTION.fast);
}
