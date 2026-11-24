import {
  anim,
  applyEyeChoice,
  applyStylePreset,
  renderMemo,
  startAnim,
  state,
} from "../../../entities/qr-code/index.js";
import { reducedMotion } from "../../../shared/config/index.js";
import {
  bindSegmentedGroup,
  updatePillPosition,
} from "../../../shared/ui/segmented-control/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

let cbRenderQR = () => undefined;

export function renderGeometryControls() {
  return `        <!-- SECTION 2: Style & Corners -->
        <div class="studio-section border-b border-neutral-200 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-neutral-700">Style</span>
          </div>

          <!-- Geometry Preset & Corner Eyes & Transparent BG -->
          <div class="flex items-center gap-2">
            <!-- Geometry Style -->
            <div class="segmented-track grid-cols-2 h-8 flex-1 min-w-0" id="group-style" role="radiogroup" aria-label="Geometry Style">
              <button type="button" class="segmented-item active flex items-center justify-center" data-style="classic" role="radio" aria-checked="true" title="Classic square">
                <span class="text-xs font-medium">Classic</span>
              </button>
              <button type="button" class="segmented-item flex items-center justify-center" data-style="rounded" role="radio" aria-checked="false" title="Rounded modules">
                <span class="text-xs font-medium">Rounded</span>
              </button>
            </div>

            <!-- Corner Eyes -->
            <div class="segmented-track h-8 shrink-0" id="group-eye-choice" role="radiogroup" aria-label="Corner Eyes Shape">
              <button type="button" class="segmented-item active flex items-center justify-center" data-eye-choice="default" role="radio" aria-checked="true" id="eye-btn-default" title="Auto shape" aria-label="Auto shape">
                <svg id="eye-icon-auto" aria-hidden="true" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="1.5" />
                </svg>
              </button>
              <button type="button" class="segmented-item flex items-center justify-center" data-eye-choice="circle" role="radio" aria-checked="false" title="Circle eyes" aria-label="Circle eyes">
                <svg aria-hidden="true" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="8.5" />
                </svg>
              </button>
              <button type="button" class="segmented-item flex items-center justify-center" data-eye-choice="leaf" role="radio" aria-checked="false" title="Leaf eyes" aria-label="Leaf eyes">
                <svg aria-hidden="true" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3.5h8.5v8.5a8.5 8.5 0 0 1-8.5 8.5H3.5v-8.5a8.5 8.5 0 0 1 8.5-8.5z" />
                </svg>
              </button>
            </div>

            <!-- Transparent Background Toggle Button -->
            <button
              type="button"
              id="btn-toggle-transparent"
              class="btn-tactile shrink-0 flex items-center justify-center rounded-lg"
              title="Transparent background"
              aria-label="Toggle Transparent Background"
              aria-pressed="false"
              data-tooltip="Transparent background"
            >
              <svg aria-hidden="true" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <defs>
                  <clipPath id="tile-clip">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </clipPath>
                </defs>
                <g clip-path="url(#tile-clip)">
                  <rect x="3" y="3" width="4.5" height="4.5" />
                  <rect x="12" y="3" width="4.5" height="4.5" />
                  <rect x="7.5" y="7.5" width="4.5" height="4.5" />
                  <rect x="16.5" y="7.5" width="4.5" height="4.5" />
                  <rect x="3" y="12" width="4.5" height="4.5" />
                  <rect x="12" y="12" width="4.5" height="4.5" />
                  <rect x="7.5" y="16.5" width="4.5" height="4.5" />
                  <rect x="16.5" y="16.5" width="4.5" height="4.5" />
                </g>
                <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </button>
          </div>
        </div>
`;
}

function syncAutoEyeIcon(currentStyle) {
  const autoEyeIcon = document.querySelector("#eye-icon-auto");
  if (autoEyeIcon) {
    autoEyeIcon.innerHTML =
      currentStyle === "rounded"
        ? '<rect x="3" y="3" width="18" height="18" rx="5" />'
        : '<rect x="3" y="3" width="18" height="18" rx="1.5" />';
  }

  const defaultEyeBtn = document.querySelector("#eye-btn-default");
  if (defaultEyeBtn) {
    const tip = currentStyle === "rounded" ? "Auto (Rounded)" : "Auto (Square)";
    defaultEyeBtn.title = tip;
    defaultEyeBtn.dataset.tooltip = tip;
    defaultEyeBtn.setAttribute("aria-label", tip);
  }
}

function syncTransparentButton() {
  const btnTransparent = document.querySelector("#btn-toggle-transparent");
  if (!btnTransparent) {
    return;
  }
  const isTrans = Boolean(state.isTransparent);
  btnTransparent.classList.toggle("active", isTrans);
  btnTransparent.setAttribute("aria-pressed", isTrans ? "true" : "false");
  const tip = isTrans
    ? "Disable transparent background"
    : "Transparent background";
  btnTransparent.title = tip;
  btnTransparent.dataset.tooltip = tip;
  btnTransparent.setAttribute("aria-label", tip);
}

export function syncStyleControls() {
  const currentStyle = state.codeStyle || "classic";
  const currentEyeChoice = state.eyeChoice || "default";

  for (const btn of document.querySelectorAll("#group-style [data-style]")) {
    const match = btn.dataset.style === currentStyle;
    btn.classList.toggle("active", match);
    btn.setAttribute("aria-checked", match ? "true" : "false");
  }

  for (const btn of document.querySelectorAll(
    "#group-eye-choice [data-eye-choice]"
  )) {
    const match = btn.dataset.eyeChoice === currentEyeChoice;
    btn.classList.toggle("active", match);
    btn.setAttribute("aria-checked", match ? "true" : "false");
  }

  syncAutoEyeIcon(currentStyle);
  syncTransparentButton();

  const trackStyle = document.querySelector("#group-style");
  if (trackStyle) {
    updatePillPosition(trackStyle, false);
  }
  const trackEye = document.querySelector("#group-eye-choice");
  if (trackEye) {
    updatePillPosition(trackEye, false);
  }
}

export function initGeometryControls(callbacks = {}, options = {}) {
  if (callbacks.onRenderQR) {
    cbRenderQR = callbacks.onRenderQR;
  }

  const triggerRerender = () => {
    if (reducedMotion() || !renderMemo) {
      cbRenderQR();
      return;
    }
    if (anim) {
      anim.snapR = false;
    }
    startAnim(cbRenderQR);
  };

  bindSegmentedGroup(
    "#group-style [data-style]",
    "style",
    (val) => {
      applyStylePreset(val);
      syncStyleControls();
      triggerRerender();
    },
    null,
    options
  );

  bindSegmentedGroup(
    "#group-eye-choice [data-eye-choice]",
    "eyeChoice",
    (val) => {
      applyEyeChoice(val);
      syncStyleControls();
      triggerRerender();
    },
    null,
    options
  );

  const btnTransparent = document.querySelector("#btn-toggle-transparent");
  if (btnTransparent) {
    const listenerOpts = options.signal
      ? { signal: options.signal }
      : undefined;
    btnTransparent.addEventListener(
      "click",
      () => {
        state.isTransparent = !state.isTransparent;
        syncStyleControls();
        triggerRerender();
        showToast(
          state.isTransparent
            ? "Transparent background enabled"
            : "Solid background enabled"
        );
      },
      listenerOpts
    );
  }

  syncStyleControls();
}
