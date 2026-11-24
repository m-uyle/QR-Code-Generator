import { state } from "../../../entities/qr-code/index.js";
import {
  renderEmblemControls,
  syncEmblemControls,
} from "../../../features/emblem-controls/index.js";
import {
  renderGeometryControls,
  syncStyleControls,
} from "../../../features/geometry-controls/index.js";
import {
  renderPayloadEditor,
  updateAccordionHeight,
} from "../../../features/payload-editor/index.js";
import { renderQrExportActions } from "../../../features/qr-export/index.js";
import { updateAllPills } from "../../../shared/ui/segmented-control/index.js";

export function renderGeneratorControlsWidget() {
  return `
    <!-- MIDDLE & BOTTOM SECTIONS: Parameters & Export -->
    <section class="flex flex-col surface-panel" aria-label="Generator Controls">
      ${renderPayloadEditor()}
      ${renderGeometryControls()}
      ${renderEmblemControls()}
      ${renderQrExportActions()}
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
  const selectType = document.querySelector("#select-content-type");
  if (selectType && selectType.value !== state.contentType) {
    selectType.value = state.contentType;
    selectType.dispatchEvent(new Event("change", { bubbles: true }));
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

  syncStyleControls();
  syncRadio(
    "#group-badge-shape [data-badge-shape]",
    "badgeShape",
    state.logoBadgeShape
  );

  syncEmblemControls();

  const wt = document.querySelector("#wifi-type");
  const wp = document.querySelector("#wifi-password");
  if (wt && wp) {
    wp.classList.toggle("hidden", wt.value === "nopass");
  }

  updateAllPills(false);
  updateAccordionHeight();
}
