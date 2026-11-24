import { state, TYPE_ICONS } from "../../../entities/qr-code/index.js";
import { MAX_LOGO_BYTES } from "../../../shared/config/index.js";
import { checkImage, downscaleImage } from "../../../shared/lib/rasterizer.js";
import { yieldToMain } from "../../../shared/lib/scheduler.js";
import {
  bindSegmentedGroup,
  updatePillPosition,
} from "../../../shared/ui/segmented-control/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

const ALLOWED_IMAGE_TYPE_RE = /^image\/(?:png|jpeg|svg\+xml)$/u;
const IMAGE_MIME_RE = /^image\//u;

export function renderEmblemControls() {
  return `        <!-- SECTION 3: Mark Cutout -->
        <div class="studio-section border-b border-neutral-200 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-neutral-700">Center Emblem</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Dropzone Button -->
            <button type="button" id="dropzone-logo" class="btn-tactile flex-1 min-w-0 h-8 px-2 surface-btn-secondary hover:surface-btn-secondary rounded-lg flex items-center justify-between cursor-pointer" aria-label="Attach emblem image: PNG / JPG / SVG" title="Upload image (PNG/JPG/SVG)">
              <input type="file" id="input-logo-file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" aria-hidden="true" tabindex="-1">
              <span class="flex items-center gap-1 overflow-hidden min-w-0">
                <svg class="w-3.5 h-3.5 text-neutral-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span class="text-xs font-medium text-neutral-700 truncate" id="logo-status-text">PNG / JPG / SVG</span>
              </span>
            </button>

            <!-- Toggle Content Type Icon Button (activatable square button) -->
            <button type="button" id="btn-toggle-type-icon" class="btn-tactile h-8 w-8 shrink-0 rounded-lg flex items-center justify-center cursor-pointer" aria-label="Use content icon as emblem" title="Use content icon" aria-pressed="false">
              <svg id="emblem-type-icon-svg" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                ${TYPE_ICONS[state.contentType || "url"] || TYPE_ICONS.url}
              </svg>
            </button>

            <!-- Remove Custom Logo Button -->
            <button type="button" id="btn-remove-logo" class="btn-icon-tactile hidden h-8 w-8 shrink-0 items-center justify-center text-xs text-red-500 hover:text-red-700 font-medium" aria-label="Remove emblem" title="Remove emblem">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <!-- Emblem Cutout Badge Shape -->
            <div class="segmented-track h-8 shrink-0" id="group-badge-shape" role="radiogroup" aria-label="Badge Shape">
              <button type="button" class="segmented-item active flex items-center justify-center" data-badge-shape="square" title="Square cutout" aria-label="Square badge cutout" role="radio" aria-checked="true">
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              </button>
              <button type="button" class="segmented-item flex items-center justify-center" data-badge-shape="circle" title="Circle cutout" aria-label="Circle badge cutout" role="radio" aria-checked="false">
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>
              </button>
            </div>
          </div>
        </div>`;
}

export function syncEmblemControls() {
  const currentType = state.contentType || "url";
  const iconSvg = document.querySelector("#emblem-type-icon-svg");
  if (iconSvg) {
    iconSvg.innerHTML = TYPE_ICONS[currentType] || TYPE_ICONS.url;
  }

  const btnTypeIcon = document.querySelector("#btn-toggle-type-icon");
  const btnRemoveLogo = document.querySelector("#btn-remove-logo");
  const logoStatus = document.querySelector("#logo-status-text");

  if (state.customLogoUrl) {
    btnTypeIcon?.classList.add("hidden");
    btnRemoveLogo?.classList.remove("hidden");
    if (logoStatus) {
      logoStatus.textContent = "Emblem Attached";
    }
  } else {
    btnRemoveLogo?.classList.add("hidden");
    btnTypeIcon?.classList.remove("hidden");
    if (logoStatus) {
      logoStatus.textContent = "PNG / JPG / SVG";
    }
  }

  if (btnTypeIcon) {
    const isActive = Boolean(state.builtinIcon);
    btnTypeIcon.classList.toggle("active", isActive);
    btnTypeIcon.setAttribute("aria-pressed", isActive ? "true" : "false");
    const tip = isActive ? "Disable content icon" : "Use content icon";
    btnTypeIcon.dataset.tooltip = tip;
    btnTypeIcon.setAttribute("aria-label", tip);
  }
}

function bumpEccForEmblem(quiet = false) {
  if (state.eccLevel === "H" || state.eccLevel === "Q") {
    return false;
  }
  state.eccLevel = "H";
  for (const b of document.querySelectorAll("#group-ecc [data-ecc]")) {
    const on = b.dataset.ecc === "H";
    b.classList.toggle("active", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  }
  updatePillPosition(document.querySelector("#group-ecc"), true);
  if (!quiet) {
    showToast("Emblem needs strong error correction (ECC set to H)");
  }
  return true;
}

export function setLogoFile(file) {
  const fi = document.querySelector("#input-logo-file");
  if (!fi) {
    return;
  }
  const dt = new DataTransfer();
  dt.items.add(file);
  fi.files = dt.files;
  fi.dispatchEvent(new Event("change", { bubbles: true }));
}

export function initEmblemControls({ onRenderQR }, options = {}) {
  const { signal } = options;
  bindSegmentedGroup(
    "#group-badge-shape [data-badge-shape]",
    "badgeShape",
    (val) => {
      state.logoBadgeShape = val;
      onRenderQR();
    },
    null,
    { signal }
  );

  const btnToggleType = document.querySelector("#btn-toggle-type-icon");
  if (btnToggleType) {
    btnToggleType.addEventListener(
      "click",
      () => {
        state.builtinIcon = !state.builtinIcon;
        if (state.builtinIcon) {
          bumpEccForEmblem(false);
        }
        syncEmblemControls();
        onRenderQR();
      },
      { signal }
    );
  }

  const dropzone = document.querySelector("#dropzone-logo");
  const fileInput = document.querySelector("#input-logo-file");
  const btnRemoveLogo = document.querySelector("#btn-remove-logo");

  function handleFile(file) {
    if (!ALLOWED_IMAGE_TYPE_RE.test(file?.type)) {
      showToast("Please attach a PNG, JPG or SVG image");
      return;
    }
    if (!file.size) {
      showToast("This file is empty");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast("Image is too large (max 15 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showToast("Could not read this file");
    reader.onload = async (ev) => {
      let url;
      try {
        await yieldToMain();
        url =
          file.type === "image/svg+xml"
            ? await checkImage(ev.target.result)
            : await downscaleImage(ev.target.result, file.type);
      } catch {
        showToast("Could not read this image");
        return;
      }
      state.customLogoUrl = url;
      syncEmblemControls();
      const bumped = bumpEccForEmblem(true);
      onRenderQR();
      showToast(
        bumped ? "Emblem attached (ECC switched to H)" : "Emblem attached"
      );
    };
    reader.readAsDataURL(file);
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener(
      "click",
      () => {
        fileInput.click();
      },
      { signal }
    );

    fileInput.addEventListener(
      "change",
      (e) => {
        const file = e.target.files?.[0];
        if (file) {
          handleFile(file);
        }
        e.target.value = "";
      },
      { signal }
    );

    dropzone.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("dropzone-dragover");
      },
      { signal }
    );

    dropzone.addEventListener(
      "dragleave",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dropzone-dragover");
      },
      { signal }
    );

    dropzone.addEventListener(
      "drop",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dropzone-dragover");
        if (e.dataTransfer?.files?.length) {
          handleFile(e.dataTransfer.files[0]);
        }
      },
      { signal }
    );
  }

  if (btnRemoveLogo) {
    btnRemoveLogo.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        state.customLogoUrl = null;
        if (fileInput) {
          fileInput.value = "";
        }
        syncEmblemControls();
        onRenderQR();
        showToast("Emblem removed");
      },
      { signal }
    );
  }

  const stage = document.querySelector("#tilt-container");
  if (stage) {
    const hasFiles = (e) =>
      Boolean(e.dataTransfer && [...e.dataTransfer.types].includes("Files"));
    window.addEventListener(
      "dragover",
      (e) => {
        if (hasFiles(e)) {
          e.preventDefault();
        }
      },
      { signal }
    );
    window.addEventListener(
      "drop",
      (e) => {
        if (hasFiles(e)) {
          e.preventDefault();
        }
      },
      { signal }
    );
    for (const ev of ["dragenter", "dragover"]) {
      stage.addEventListener(
        ev,
        (e) => {
          if (!hasFiles(e)) {
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          stage.classList.add("drop-active");
        },
        { signal }
      );
    }
    stage.addEventListener(
      "dragleave",
      (e) => {
        if (!stage.contains(e.relatedTarget)) {
          stage.classList.remove("drop-active");
        }
      },
      { signal }
    );
    stage.addEventListener(
      "drop",
      (e) => {
        e.preventDefault();
        stage.classList.remove("drop-active");
        const file = [...(e.dataTransfer?.files || [])].find((f) =>
          IMAGE_MIME_RE.test(f.type)
        );
        if (file) {
          setLogoFile(file);
        } else {
          showToast("Drop an image (PNG, JPG or SVG)");
        }
      },
      { signal }
    );
  }

  syncEmblemControls();
}
