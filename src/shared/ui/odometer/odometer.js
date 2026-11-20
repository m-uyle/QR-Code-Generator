export function setOdometer(el, text) {
  if (!el) {
    return;
  }
  if (el.textContent === text) {
    return;
  }
  el.textContent = text;
  el.setAttribute("aria-label", text);
}
