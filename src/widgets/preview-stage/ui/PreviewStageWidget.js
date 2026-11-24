import {
  anim,
  buildSvg,
  cancelActiveAnim,
  debouncedSaveState,
  getPayload,
  renderMemo,
  setRenderMemo,
  startAnim,
  state,
  updateCardShape,
} from "../../../entities/qr-code/index.js";
import {
  initQrExport,
  updatePngLabel,
} from "../../../features/qr-export/index.js";
import { scheduleHistory } from "../../../features/style-history/index.js";
import { reducedMotion } from "../../../shared/config/index.js";
import { debounce } from "../../../shared/lib/debounce.js";
import {
  ensureUtf8Support,
  getQrEngine,
} from "../../../shared/lib/qrcode-engine.js";
import { setup3DTilt } from "../../../shared/ui/tilt-card/index.js";

export function renderPreviewStageWidget() {
  return `
    <!-- TOP SECTION: Preview Stage -->
    <section class="flex flex-col surface-viewport relative overflow-hidden select-none" aria-label="QR Code Preview Stage">
      
      <!-- Stage Header Bar with Title -->
      <header class="studio-header h-12 flex items-center justify-between surface-panel shrink-0 z-20">
        <div class="flex items-center gap-2">
          <h1 class="text-title font-medium text-neutral-800 leading-none">QR Code Generator</h1>
        </div>
      </header>

      <!-- Center Dynamic Viewport Area -->
      <div class="preview-stage-box relative flex items-center justify-center overflow-hidden">
        
        <!-- 3D Tilt Preview Stage -->
        <div id="tilt-container" class="tilt-stage flex w-full flex-1 cursor-default items-center justify-center">
          <div aria-hidden="true" class="contact-shadow"></div>
          <div id="tilt-card" class="tilt-card w-preview h-preview relative flex aspect-square items-center justify-center select-none">
            <div id="preview-wrapper" class="pointer-events-none relative flex h-full w-full items-center justify-center">
              <!-- QR SVG Injection Output Anchor -->
              <div id="qr-output-container" class="flex h-full w-full items-center justify-center"></div>
            </div>
            <div aria-hidden="true" class="drop-hint" id="drop-hint">
              <span>Drop an image to set the emblem</span>
            </div>
          </div>
        </div>

      </div>

    </section>
  `;
}

const showQrEngineUnavailable = (elQrContainer) => {
  if (elQrContainer) {
    elQrContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-6 text-neutral-500 gap-2 select-none">
        <svg class="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="text-xs font-medium text-neutral-800">QR Engine Unavailable</span>
        <span class="text-caption text-neutral-500 leading-tight">The embedded QR library failed to run. Please reload the file.</span>
      </div>
    `;
  }
};

const showEmptyQr = (elQrContainer) => {
  if (elQrContainer) {
    elQrContainer.innerHTML = `<span class="text-xs font-medium text-neutral-500 select-none">Enter content to create your QR code</span>`;
  }
  debouncedSaveState();
};

const showOverflowQr = (elQrContainer) => {
  if (elQrContainer) {
    elQrContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-6 text-neutral-500 gap-2 select-none">
        <svg class="w-6 h-6 stroke-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="text-xs font-medium text-neutral-700">Payload exceeds QR capacity</span>
        <span class="text-caption text-neutral-500 leading-tight">Shorten input text or decrease error correction level</span>
      </div>
    `;
  }
};

export const renderQR = debounce(() => {
  scheduleHistory();
  const elQrContainer = document.querySelector("#qr-output-container");
  const elPreviewWrapper = document.querySelector("#preview-wrapper");
  const qrcode = getQrEngine();

  if (typeof qrcode === "undefined") {
    showQrEngineUnavailable(elQrContainer);
    return;
  }
  ensureUtf8Support();

  const payloadNow = getPayload();
  const styleKey = [
    state.moduleShape,
    state.logoBadgeShape,
    state.eccLevel,
    state.isTransparent,
    state.builtinIcon,
    Boolean(state.customLogoUrl),
    state.contentType,
  ].join("|");

  const isSamePayload = renderMemo?.payload === payloadNow;
  const isSameStyle = renderMemo?.styleKey === styleKey;
  const sameDoc = Boolean(payloadNow && isSamePayload && isSameStyle);
  if (
    sameDoc &&
    !reducedMotion() &&
    (anim ||
      renderMemo.radius !== state.moduleRadius ||
      renderMemo.margin !== state.margin ||
      renderMemo.eye !== state.eyeShape)
  ) {
    startAnim(renderQR);
    return;
  }
  cancelActiveAnim();
  setRenderMemo(null);

  const svg = buildSvg();

  if (elPreviewWrapper) {
    elPreviewWrapper.classList.toggle(
      "transparent-checker",
      Boolean(state.isTransparent)
    );
  }
  updateCardShape(svg);

  if (svg === "EMPTY") {
    showEmptyQr(elQrContainer);
    return;
  }

  if (!svg) {
    showOverflowQr(elQrContainer);
    return;
  }

  if (elQrContainer) {
    elQrContainer.innerHTML = svg;
  }
  updatePngLabel(svg);
  setRenderMemo({
    payload: payloadNow,
    styleKey,
    radius: state.moduleRadius,
    margin: state.margin,
    eye: state.eyeShape,
  });

  debouncedSaveState();
}, 50);

export function initPreviewStage(options = {}) {
  setup3DTilt(options);
  initQrExport(options);
}
