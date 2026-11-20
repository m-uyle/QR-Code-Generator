import {
  getPayload,
  loadState,
  state,
} from "../../../entities/qr-code/index.js";
import {
  initEmblemControls,
  setLogoFile,
  updateSizeIcons,
} from "../../../features/emblem-controls/index.js";
import { initGeometryControls } from "../../../features/geometry-controls/index.js";
import {
  initPayloadEditor,
  updateAccordionHeight,
} from "../../../features/payload-editor/index.js";
import {
  drawQuietZone,
  markStale,
  paintMarginScrub,
  qzActive,
  renderQuietZoneTooltip,
} from "../../../features/scan-health/index.js";
import {
  historyInit,
  initStyleHistoryListeners,
} from "../../../features/style-history/index.js";
import { debounce } from "../../../shared/lib/debounce.js";
import { ensureUtf8Support } from "../../../shared/lib/qrcode-engine.js";
import {
  bindSegmentedKeyboardNavigation,
  destroySlidingPillTracks,
  initSlidingPillTracks,
  updateAllPills,
} from "../../../shared/ui/segmented-control/index.js";
import { renderToastContainer } from "../../../shared/ui/toast/index.js";
import {
  renderGeneratorControlsWidget,
  syncAllUIControls,
} from "../../../widgets/generator-controls/index.js";
import {
  initPreviewStage,
  renderPreviewStageWidget,
  renderQR,
} from "../../../widgets/preview-stage/index.js";

function renderQrStudioPage() {
  return `
    ${renderToastContainer()}
    <main id="studio-window" class="w-studio surface-panel border border-neutral-200 rounded-2xl shadow-studio overflow-hidden flex flex-col">
      <div class="grid grid-cols-2 divide-x divide-neutral-200 items-stretch">
        ${renderGeneratorControlsWidget()}
        ${renderPreviewStageWidget()}
      </div>
    </main>
    ${renderQuietZoneTooltip()}
  `;
}

function updateContainerWidth() {
  const multiFieldTypes = ["email", "sms", "wifi", "vcard", "geo", "sbp"];
  const isMulti = multiFieldTypes.includes(state.contentType);
  const win = document.querySelector("#studio-window");
  if (!win) {
    return;
  }
  win.classList.toggle("is-expanded", isMulti);
}

let pageAbortController = null;

export function initQrStudioPage() {
  if (pageAbortController) {
    pageAbortController.abort();
  }
  pageAbortController = new AbortController();
  const options = { signal: pageAbortController.signal };

  if (!document.querySelector("#studio-window")) {
    document.body.insertAdjacentHTML("afterbegin", renderQrStudioPage());
  }

  ensureUtf8Support();
  loadState(syncAllUIControls);

  for (const b of document.querySelectorAll(
    "button[title]:not([aria-label])"
  )) {
    b.setAttribute("aria-label", b.title);
  }

  initSlidingPillTracks();
  bindSegmentedKeyboardNavigation(options);

  const callbacks = {
    onSyncAllUIControls: syncAllUIControls,
    onUpdateContainerWidth: updateContainerWidth,
    onRenderQR: renderQR,
    onSetLogoFile: setLogoFile,
    onMarkStale: markStale,
    onDrawQuietZone: (m) => {
      if (qzActive) {
        drawQuietZone(m);
      }
    },
    onPaintMargin: paintMarginScrub,
  };

  initPayloadEditor(callbacks, options);
  initGeometryControls(callbacks, options);
  initEmblemControls(callbacks, options);
  initPreviewStage(options);
  initStyleHistoryListeners(callbacks, options);

  window.addEventListener(
    "resize",
    debounce(() => {
      updateAllPills(false);
      updateAccordionHeight();
    }, 100),
    { signal: pageAbortController.signal }
  );

  window.addEventListener(
    "beforeunload",
    (e) => {
      const payload = getPayload().trim();
      if (payload && payload !== "https://") {
        e.preventDefault();
        e.returnValue = "";
      }
    },
    { signal: pageAbortController.signal }
  );

  window.addEventListener("pagehide", destroyQrStudioPage, options);

  historyInit();
  updateSizeIcons();
  updateContainerWidth();
  updateAccordionHeight();
  renderQR();
  setTimeout(() => updateAllPills(false), 50);
}

function destroyQrStudioPage() {
  if (pageAbortController) {
    pageAbortController.abort();
    pageAbortController = null;
  }
  destroySlidingPillTracks();
}
