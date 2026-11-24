export function morphButtonToSuccess(btn, originalText) {
  if (!btn || btn.__morphing) {
    return;
  }
  btn.__morphing = true;

  const iconSlot = btn.querySelector(".btn-icon-slot");
  const labelSlot = btn.querySelector(".btn-label-slot");
  const origIconHtml = iconSlot ? iconSlot.innerHTML : "";

  if (iconSlot) {
    iconSlot.innerHTML = `
      <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }
  if (labelSlot) {
    labelSlot.textContent = "Copied!";
    labelSlot.classList.add("font-medium");
  }

  btn.classList.add("is-success");

  setTimeout(() => {
    if (iconSlot) {
      iconSlot.innerHTML = origIconHtml;
    }
    if (labelSlot) {
      labelSlot.textContent = originalText;
      labelSlot.classList.remove("font-medium");
    }
    btn.classList.remove("is-success");
    btn.__morphing = false;
  }, 1400);
}
