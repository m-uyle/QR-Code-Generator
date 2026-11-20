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
  validateAll,
} from "../../../entities/qr-code/index.js";
import {
  initQrExport,
  renderQrExportActions,
  updatePngLabel,
} from "../../../features/qr-export/index.js";
import {
  drawQuietZone,
  encodingInfo,
  healthCtx,
  incrementScanToken,
  initScanHealthListeners,
  qzActive,
  renderHealth,
  renderScanHealthBadge,
  scheduleScan,
  setScanState,
  svgStats,
  updateHealthBadge,
} from "../../../features/scan-health/index.js";
import { scheduleHistory } from "../../../features/style-history/index.js";
import { reducedMotion } from "../../../shared/config/index.js";
import { debounce } from "../../../shared/lib/debounce.js";
import {
  ensureUtf8Support,
  getQrEngine,
} from "../../../shared/lib/qrcode-engine.js";
import { setup3DTilt } from "../../../shared/ui/tilt-card/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

const VIEWBOX_DIM_RE = /viewBox="0 0 (?<dim>[0-9.]+)/u;

export function renderPreviewStageWidget() {
  return `
    <!-- RIGHT COLUMN: Centered Stage (Natural dynamic centering without hardcoded offset clamps) -->
    <main class="flex-1 flex flex-col surface-canvas relative overflow-hidden select-none" aria-label="QR Code Preview Stage">
      
      <!-- Stage Local Header Bar with Live Health Popover Trigger & Transparent Switch -->
      <header class="h-12 px-6 border-b border-neutral-200 flex items-center justify-between surface-panel shrink-0 z-20">
        <div class="relative flex items-center" id="health-wrap">
          ${renderScanHealthBadge()}
        </div>

        <!-- Transparent Background Toggle Switch -->
        <label class="flex items-center gap-2 cursor-pointer select-none group" title="Make SVG background completely transparent">
          <span class="text-xs font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">Transparent</span>
          <div class="relative inline-flex items-center">
            <input type="checkbox" id="toggle-transparent" class="sr-only peer" aria-label="Toggle Transparent Background">
            <div class="w-7 h-4 bg-neutral-200 peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400 rounded-full peer peer-checked:after:translate-x-3 after:empty-content after:absolute after:offset-knob after:surface-panel after:rounded-full after:h-3 after:w-3 after:transition-all after:shadow-sm peer-checked:bg-neutral-900 transition-colors"></div>
          </div>
        </label>
      </header>

      <!-- Center Dynamic Viewport Area (100% dead-center in viewport) -->
      <div class="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        
        <!-- 3D Perspective Card Container with Subtle Physics Tilt & Hover Lighting -->
        <div id="tilt-container" class="preview-tilt-container relative">
          
          <div id="preview-wrapper" class="relative rounded-2xl p-6 transition-all duration-300">
            <!-- QR SVG Injection Output Anchor -->
            <div id="qr-output-container" class="flex items-center justify-center select-none">
              <span class="text-xs font-medium text-neutral-500 select-none">Generating...</span>
            </div>
            
            <div id="qz-overlay" class="qz-overlay pointer-events-none"></div>
            
            <!-- Quiet Zone Hover Micro-Tooltip -->
            <div id="qz-tip" class="qz-tip" role="tooltip">Quiet Zone</div>
          </div>

        </div>

      </div>

      ${renderQrExportActions()}

    </main>
  `;
}

function showQrEngineUnavailable(elMatrixInfo, elHealthBadge, elQrContainer) {
  if (elMatrixInfo) {
    elMatrixInfo.textContent = "Err";
  }
  if (elHealthBadge) {
    elHealthBadge.className =
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium bg-red-50 text-red-700 border border-red-200 select-none";
    elHealthBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span><span>Engine not loaded</span>`;
  }
  if (elQrContainer) {
    elQrContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-6 text-neutral-500 gap-2 select-none">
        <svg class="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="text-xs font-medium text-neutral-800">QR Engine Unavailable</span>
        <span class="text-caption text-neutral-500 leading-tight">The embedded QR library failed to run. Please reload the file.</span>
      </div>
    `;
  }
}

function showEmptyQr(elMatrixInfo, elQrContainer) {
  if (elMatrixInfo) {
    elMatrixInfo.textContent = "—";
  }
  updateHealthBadge(0, true);
  if (elQrContainer) {
    elQrContainer.innerHTML = `<span class="text-xs font-medium text-neutral-500 select-none">Enter content to create your QR code</span>`;
  }
  debouncedSaveState();
}

function showOverflowQr(elMatrixInfo, elHealthBadge, elQrContainer) {
  if (elMatrixInfo) {
    elMatrixInfo.textContent = "Overflow";
  }
  if (elHealthBadge) {
    elHealthBadge.className =
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium bg-red-50 text-red-700 border border-red-200 select-none shadow-badge";
    elHealthBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span><span>Too much data</span>`;
  }
  if (elQrContainer) {
    elQrContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-6 text-neutral-500 gap-2 select-none">
        <svg class="w-6 h-6 stroke-neutral-500" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="text-xs font-medium text-neutral-700">Payload exceeds QR capacity</span>
        <span class="text-caption text-neutral-500 leading-tight">Shorten input text or decrease error correction level</span>
      </div>
    `;
  }
}

export const renderQR = debounce(() => {
  scheduleHistory();
  const elQrContainer = document.querySelector("#qr-output-container");
  const elPreviewWrapper = document.querySelector("#preview-wrapper");
  const elMatrixInfo = document.querySelector("#matrix-info");
  const elHealthBadge = document.querySelector("#health-badge");
  const qrcode = getQrEngine();

  if (typeof qrcode === "undefined") {
    showQrEngineUnavailable(elMatrixInfo, elHealthBadge, elQrContainer);
    return;
  }
  ensureUtf8Support();

  const payloadNow = getPayload();
  const styleKey = [
    state.moduleShape,
    state.logoBadgeShape,
    state.iconSize,
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
    startAnim(renderQR, (m) => {
      if (qzActive) {
        drawQuietZone(m);
      }
    });
    return;
  }
  cancelActiveAnim();
  setRenderMemo(null);

  const fieldErr = validateAll();
  incrementScanToken();
  const svg = buildSvg(false, updateHealthBadge);

  if (elPreviewWrapper) {
    elPreviewWrapper.classList.toggle(
      "transparent-checker",
      Boolean(state.isTransparent)
    );
  }
  updateCardShape(svg);

  if (svg === "EMPTY") {
    showEmptyQr(elMatrixInfo, elQrContainer);
    return;
  }

  if (!svg) {
    showOverflowQr(elMatrixInfo, elHealthBadge, elQrContainer);
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

  healthCtx.fieldErr = fieldErr;
  const match = svg.match(VIEWBOX_DIM_RE);
  healthCtx.dim = Number.parseFloat(match?.groups?.dim ?? "0");
  healthCtx.enc = encodingInfo(getPayload(), healthCtx.N);
  healthCtx.svg = svgStats(svg);
  setScanState({ status: fieldErr ? "idle" : "pending", results: null });
  renderHealth();
  if (!fieldErr) {
    scheduleScan(svg, getPayload());
  }
  debouncedSaveState();
}, 50);

export function initPreviewStage(options = {}) {
  const { signal } = options;
  setup3DTilt(options);
  initQrExport(options);
  initScanHealthListeners(options);

  const elToggleTransparent = document.querySelector("#toggle-transparent");
  if (elToggleTransparent) {
    elToggleTransparent.addEventListener(
      "change",
      (e) => {
        state.isTransparent = e.target.checked;
        renderQR();
        showToast(
          state.isTransparent
            ? "Transparent background enabled"
            : "Solid background enabled"
        );
      },
      { signal }
    );
  }
}
