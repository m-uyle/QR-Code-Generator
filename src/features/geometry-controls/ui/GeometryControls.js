import {
  anim,
  defaultState,
  renderMemo,
  setScrubHold,
  startAnim,
  state,
} from "../../../entities/qr-code/index.js";
import { reducedMotion } from "../../../shared/config/index.js";
import {
  makeScrubber,
  paintScrubEl,
} from "../../../shared/ui/scrubber/index.js";
import { bindSegmentedGroup } from "../../../shared/ui/segmented-control/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

let cbRenderQR = () => undefined;
let cbMarkStale;
let cbDrawQuietZone;
let cbPaintMargin;

export function renderGeometryControls() {
  return `        <!-- SECTION 2: Geometry & Parameters -->
        <div class="pt-3 border-t border-neutral-200 flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-neutral-700">Geometry</span>
          </div>

          <!-- Module & Eye Geometry -->
          <div class="grid grid-cols-2 gap-2.5">
            <!-- Module Style -->
            <div class="flex flex-col gap-1">
              <span class="text-caption font-medium text-neutral-600">Module Style</span>
              <div class="segmented-track grid-cols-3 h-8" id="group-shape" role="radiogroup" aria-label="Module Style">
                <button type="button" class="segmented-item active" data-shape="square" role="radio" aria-checked="true">Square</button>
                <button type="button" class="segmented-item" data-shape="dots" role="radio" aria-checked="false">Dots</button>
                <button type="button" class="segmented-item" data-shape="rounded" role="radio" aria-checked="false">Round</button>
              </div>
            </div>

            <!-- Eye Style -->
            <div class="flex flex-col gap-1">
              <span class="text-caption font-medium text-neutral-600">Eye Frame</span>
              <div class="segmented-track grid-cols-3 h-8" id="group-eye-shape" role="radiogroup" aria-label="Eye Frame Style">
                <button type="button" class="segmented-item active" data-eye="square" role="radio" aria-checked="true">Square</button>
                <button type="button" class="segmented-item" data-eye="circle" role="radio" aria-checked="false">Circle</button>
                <button type="button" class="segmented-item" data-eye="rounded" role="radio" aria-checked="false">Round</button>
              </div>
            </div>
          </div>

          <!-- Sliders: Smoothness & Margin -->
          <div class="grid grid-cols-2 gap-2.5">
            <!-- Module Smoothness / Corner Radius -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-caption font-medium text-neutral-600">Roundness</span>
                <span class="text-micro text-neutral-500 font-mono" id="smoothness-val">0%</span>
              </div>
              <div class="scrub-track h-8 select-none touch-none" id="smooth-scrub" role="slider" aria-label="Module roundness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
                <div class="scrub-fill"></div>
                <div class="scrub-handle"></div>
                <div class="scrub-notch"></div>
                <span class="scrub-value font-mono">0</span>
              </div>
            </div>

            <!-- Margin (Quiet Zone) -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-caption font-medium text-neutral-600">Quiet Zone</span>
                <span class="text-micro text-neutral-500 font-mono" id="margin-val">2 mod</span>
              </div>
              <div class="scrub-track h-8 select-none touch-none" id="group-margin" role="slider" aria-label="Quiet zone margin in modules" aria-valuemin="0" aria-valuemax="12" aria-valuenow="2" tabindex="0">
                <div class="scrub-fill"></div>
                <div class="scrub-handle"></div>
                <div class="scrub-notch"></div>
                <span class="scrub-value font-mono">2</span>
              </div>
            </div>
          </div>

          <!-- Error Correction Level -->
          <div class="flex flex-col gap-1">
            <span class="text-caption font-medium text-neutral-600">Error Correction</span>
            <div class="segmented-track grid-cols-4 h-8" id="group-ecc" role="radiogroup" aria-label="Error Correction Level">
              <button type="button" class="segmented-item" data-ecc="L" role="radio" aria-checked="false" title="Level L (7% recovery)">L · 7%</button>
              <button type="button" class="segmented-item active" data-ecc="M" role="radio" aria-checked="true" title="Level M (15% recovery)">M · 15%</button>
              <button type="button" class="segmented-item" data-ecc="Q" role="radio" aria-checked="false" title="Level Q (25% recovery)">Q · 25%</button>
              <button type="button" class="segmented-item" data-ecc="H" role="radio" aria-checked="false" title="Level H (30% recovery)">H · 30%</button>
            </div>
          </div>
        </div>
`;
}

function paintScrub() {
  const sm = document.querySelector("#smooth-scrub");
  if (sm) {
    sm.setAttribute("aria-valuenow", state.moduleRadius);
    sm.setAttribute("aria-valuetext", `${state.moduleRadius}%`);
    paintScrubEl(sm, state.moduleRadius / 100, state.moduleRadius);
  }
}

function paintScrubbers() {
  paintScrub();
  if (typeof cbPaintMargin === "function") {
    cbPaintMargin();
  } else {
    const mg = document.querySelector("#group-margin");
    if (mg) {
      mg.setAttribute("aria-valuenow", state.margin);
      mg.setAttribute("aria-valuetext", `${state.margin} modules`);
      paintScrubEl(mg, state.margin / 12, state.margin);
    }
  }
}

export function syncSmoothSlider() {
  state.margin = Math.min(12, Math.max(0, Math.round(state.margin) || 0));
  paintScrubbers();
}

export function initGeometryControls(callbacks = {}, options = {}) {
  if (callbacks.onRenderQR) {
    cbRenderQR = callbacks.onRenderQR;
  }
  if (callbacks.onMarkStale) {
    cbMarkStale = callbacks.onMarkStale;
  }
  if (callbacks.onDrawQuietZone) {
    cbDrawQuietZone = callbacks.onDrawQuietZone;
  }
  if (callbacks.onPaintMargin) {
    cbPaintMargin = callbacks.onPaintMargin;
  }

  bindSegmentedGroup(
    "#group-shape [data-shape]",
    "shape",
    (val) => {
      state.moduleShape = val;
      cbRenderQR();
    },
    options
  );
  bindSegmentedGroup(
    "#group-eye-shape [data-eye]",
    "eye",
    (val) => {
      state.eyeShape = val;
      cbRenderQR();
    },
    options
  );
  bindSegmentedGroup(
    "#group-ecc [data-ecc]",
    "ecc",
    (val) => {
      state.eccLevel = val;
      if (
        state.customLogoUrl &&
        (state.eccLevel === "L" || state.eccLevel === "M")
      ) {
        showToast("Emblem requires Q or H recovery");
      }
      cbRenderQR();
    },
    options
  );

  const setSmooth = (value, live) => {
    const stepped = Math.round(value / 5) * 5;
    state.moduleRadius = Math.min(100, Math.max(0, stepped));
    paintScrub();
    if (typeof cbMarkStale === "function") {
      cbMarkStale();
    }
    if (reducedMotion() || !renderMemo) {
      cbRenderQR();
      return;
    }
    if (anim) {
      anim.snapR = Boolean(live);
    }
    startAnim(cbRenderQR, (m) => {
      if (typeof cbDrawQuietZone === "function") {
        cbDrawQuietZone(m);
      }
    });
    if (anim) {
      anim.snapR = Boolean(live);
    }
  };

  const setMargin = (value) => {
    state.margin = Math.min(12, Math.max(0, Math.round(value)));
    if (typeof cbPaintMargin === "function") {
      cbPaintMargin();
    }
    if (typeof cbMarkStale === "function") {
      cbMarkStale();
    }
    if (reducedMotion() || !renderMemo) {
      cbRenderQR();
      return;
    }
    startAnim(cbRenderQR, (m) => {
      if (typeof cbDrawQuietZone === "function") {
        cbDrawQuietZone(m);
      }
    });
  };

  const sm = document.querySelector("#smooth-scrub");
  const mg = document.querySelector("#group-margin");
  if (sm && mg) {
    sm.querySelector(".scrub-value").dataset.unit = "%";
    mg.querySelector(".scrub-value").dataset.unit = "mod";
    const onHoldChange = (h) => setScrubHold(h);
    const onFinish = () => {
      if (anim) {
        startAnim(cbRenderQR, (m) => {
          if (typeof cbDrawQuietZone === "function") {
            cbDrawQuietZone(m);
          }
        });
      } else {
        cbRenderQR();
      }
    };
    makeScrubber(sm, {
      signal: options.signal,
      max: 100,
      step: 5,
      int: true,
      magnet: false,
      big: 10,
      def: defaultState.moduleRadius,
      get: () => state.moduleRadius,
      set: setSmooth,
      onHoldChange,
      onFinish,
      onRepaint: paintScrubbers,
    });
    makeScrubber(mg, {
      signal: options.signal,
      max: 12,
      int: true,
      big: 4,
      def: defaultState.margin,
      get: () => state.margin,
      set: (v) => setMargin(v),
      onHoldChange,
      onFinish,
      onRepaint: paintScrubbers,
    });
    paintScrubbers();
    const ro = new ResizeObserver(() => paintScrubbers());
    ro.observe(sm);
    ro.observe(mg);
    if (options.signal) {
      options.signal.addEventListener("abort", () => ro.disconnect(), {
        once: true,
      });
    }
  }
}
