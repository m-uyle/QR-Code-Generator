import { state } from "../../../entities/qr-code/index.js";
import {
  renderEmblemControls,
  updateSizeIcons,
} from "../../../features/emblem-controls/index.js";
import {
  renderGeometryControls,
  syncSmoothSlider,
} from "../../../features/geometry-controls/index.js";
import {
  renderPayloadEditor,
  updateAccordionHeight,
} from "../../../features/payload-editor/index.js";
import { updateAllPills } from "../../../shared/ui/segmented-control/index.js";

export function renderGeneratorControlsWidget() {
  return `
    <!-- LEFT COLUMN: Controls & Header -->
    <section class="flex flex-col surface-panel overflow-hidden" aria-label="Generator Controls">
      
      <!-- Panel Local Header Bar with Matrix Info & Icon Reset Button -->
      <header class="h-12 px-6 border-b border-neutral-200 flex items-center justify-between surface-panel shrink-0">
        <h1 class="text-title font-medium text-neutral-800 tracking-tight leading-none">QR-Code Generator</h1>
        
        <div class="flex items-center gap-2.5">
          <span id="matrix-info" class="text-xs font-mono font-medium text-neutral-500 select-none">29 × 29</span>
          <button type="button" id="btn-reset" class="btn-reset-icon w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-900 surface-btn-secondary hover:surface-btn-secondary rounded-md" title="Reset all settings & clear cache" aria-label="Reset all settings to default">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Panel Content Body (Auto-fitting height without dead space) -->
      <div class="p-6 flex flex-col gap-3.5 flex-1 justify-between">
        ${renderPayloadEditor()}
        ${renderGeometryControls()}
        ${renderEmblemControls()}
      </div>

    </section>
  `;
}

function syncRadio(selector, dataAttr, stateVal) {
  for (const btn of document.querySelectorAll(selector)) {
    const match = btn.dataset[dataAttr] === String(stateVal);
    btn.classList.toggle("active", match);
    btn.setAttribute("aria-checked", match ? "true" : "false");
  }
}

export function syncAllUIControls() {
  const elToggleTransparent = document.querySelector("#toggle-transparent");
  if (elToggleTransparent) {
    elToggleTransparent.checked = Boolean(state.isTransparent);
  }

  for (const btn of document.querySelectorAll("[data-type]")) {
    const active = btn.dataset.type === state.contentType;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }

  for (const f of document.querySelectorAll(".type-field")) {
    f.classList.add("hidden");
    f.classList.remove("flex");
  }
  const targetField = document.querySelector(`#field-${state.contentType}`);
  if (targetField) {
    targetField.classList.remove("hidden");
    targetField.classList.add("flex");
  }

  syncRadio("#group-shape [data-shape]", "shape", state.moduleShape);
  syncRadio("#group-eye-shape [data-eye]", "eye", state.eyeShape);
  syncSmoothSlider();
  syncRadio("#group-ecc [data-ecc]", "ecc", state.eccLevel);
  syncRadio(
    "#group-badge-shape [data-badge-shape]",
    "badgeShape",
    state.logoBadgeShape
  );
  syncRadio("#group-icon-size [data-size]", "size", state.iconSize);

  const logoStatus = document.querySelector("#logo-status-text");
  const btnRemoveLogo = document.querySelector("#btn-remove-logo");
  if (state.customLogoUrl) {
    if (logoStatus) {
      logoStatus.textContent = "Emblem Attached";
    }
    if (btnRemoveLogo) {
      btnRemoveLogo.classList.remove("hidden");
    }
  } else {
    if (logoStatus) {
      logoStatus.textContent = "PNG / JPG / SVG";
    }
    if (btnRemoveLogo) {
      btnRemoveLogo.classList.add("hidden");
    }
  }

  const bi = document.querySelector("#toggle-builtin-icon");
  if (bi) {
    bi.checked = Boolean(state.builtinIcon);
  }
  const wt = document.querySelector("#wifi-type");
  const wp = document.querySelector("#wifi-password");
  if (wt && wp) {
    wp.classList.toggle("hidden", wt.value === "nopass");
  }

  updateSizeIcons();
  updateAllPills(false);
  updateAccordionHeight();
}
