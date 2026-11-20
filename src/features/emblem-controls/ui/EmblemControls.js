import { state } from "../../../entities/qr-code/index.js";
import { MAX_LOGO_BYTES } from "../../../shared/config/index.js";
import { checkImage, downscaleImage } from "../../../shared/lib/rasterizer.js";
import {
  bindSegmentedGroup,
  updatePillPosition,
} from "../../../shared/ui/segmented-control/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

const ALLOWED_IMAGE_TYPE_RE = /^image\/(?:png|jpeg|svg\+xml)$/u;
const IMAGE_MIME_RE = /^image\//u;

export function renderEmblemControls() {
  return `        <!-- SECTION 3: Mark Cutout -->
        <div class="pt-3 border-t border-neutral-200 flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-neutral-700">Center Emblem</span>
            <label class="flex items-center gap-2 cursor-pointer select-none group" title="Use a built-in icon that matches the content type">
              <div class="relative inline-flex items-center">
                <input type="checkbox" id="toggle-builtin-icon" class="sr-only peer" aria-label="Use built-in type icon as emblem">
                <div class="w-7 h-4 bg-neutral-200 peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400 rounded-full peer peer-checked:after:translate-x-3 after:empty-content after:absolute after:offset-knob after:surface-panel after:rounded-full after:h-3 after:w-3 after:transition-all after:shadow-sm peer-checked:bg-neutral-900 transition-colors"></div>
              </div>
              <span class="text-caption font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">Type icon</span>
            </label>
          </div>

          <div class="grid grid-cols-12 gap-2 items-center">
            <!-- Dropzone Button -->
            <div class="col-span-6 flex items-center gap-1.5">
              <button type="button" id="dropzone-logo" class="btn-tactile flex-1 h-8 px-2.5 surface-control-field hover:surface-control-field border border-transparent hover:border-neutral-300 rounded-lg flex items-center justify-between cursor-pointer transition-colors" aria-label="Attach Emblem Image">
                <input type="file" id="input-logo-file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" aria-hidden="true" tabindex="-1">
                <span class="flex items-center gap-1.5 overflow-hidden">
                  <svg class="w-3.5 h-3.5 text-neutral-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span class="text-xs font-medium text-neutral-700 truncate" id="logo-status-text">PNG / JPG / SVG</span>
                </span>
              </button>
              <button type="button" id="btn-remove-logo" class="btn-icon-tactile hidden h-8 w-8 items-center justify-center text-xs text-red-500 hover:text-red-700 font-medium" aria-label="Remove emblem" title="Remove attached emblem">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <!-- Emblem Cutout Badge Shape -->
            <div class="col-span-3">
              <div class="segmented-track grid-cols-2 h-8" id="group-badge-shape" role="radiogroup" aria-label="Badge Shape">
                <button type="button" class="segmented-item active" data-badge-shape="square" title="Square badge cutout" role="radio" aria-checked="true">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </button>
                <button type="button" class="segmented-item" data-badge-shape="circle" title="Circle badge cutout" role="radio" aria-checked="false">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
                </button>
              </div>
            </div>

            <!-- Emblem Scale -->
            <div class="col-span-3">
              <div class="segmented-track grid-cols-3 h-8" id="group-icon-size" role="radiogroup" aria-label="Emblem Scale Size">
                <button type="button" class="segmented-item" data-size="small" title="Small emblem (19%)" role="radio" aria-checked="false" aria-label="Small emblem size">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="7" height="7" rx="1.2" fill="currentColor"/></svg>
                </button>
                <button type="button" class="segmented-item active" data-size="medium" title="Medium emblem (24%)" role="radio" aria-checked="true" aria-label="Medium emblem size">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.8" fill="currentColor"/></svg>
                </button>
                <button type="button" class="segmented-item" data-size="large" title="Large emblem (28%)" role="radio" aria-checked="false" aria-label="Large emblem size">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="currentColor"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>`;
}

export function updateSizeIcons() {
  const isCircle = state.logoBadgeShape === "circle";
  const sizeIcons = {
    small: isCircle
      ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>'
      : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="7" height="7" rx="1.2" fill="currentColor"/></svg>',
    medium: isCircle
      ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>'
      : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.8" fill="currentColor"/></svg>',
    large: isCircle
      ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="currentColor"/></svg>'
      : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="currentColor"/></svg>',
  };

  for (const btn of document.querySelectorAll("#group-icon-size [data-size]")) {
    const { size } = btn.dataset;
    if (size && sizeIcons[size]) {
      btn.innerHTML = sizeIcons[size];
    }
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
      updateSizeIcons();
      onRenderQR();
    },
    null,
    { signal }
  );
  bindSegmentedGroup(
    "#group-icon-size [data-size]",
    "size",
    (val) => {
      state.iconSize = val;
      onRenderQR();
    },
    null,
    { signal }
  );

  const toggleBuiltin = document.querySelector("#toggle-builtin-icon");
  if (toggleBuiltin) {
    toggleBuiltin.addEventListener(
      "change",
      (e) => {
        state.builtinIcon = e.target.checked;
        if (state.builtinIcon) {
          bumpEccForEmblem();
        }
        onRenderQR();
      },
      { signal }
    );
  }

  const dropzone = document.querySelector("#dropzone-logo");
  const fileInput = document.querySelector("#input-logo-file");
  const btnRemoveLogo = document.querySelector("#btn-remove-logo");
  const logoStatus = document.querySelector("#logo-status-text");

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
        url =
          file.type === "image/svg+xml"
            ? await checkImage(ev.target.result)
            : await downscaleImage(ev.target.result, file.type);
      } catch {
        showToast("Could not read this image");
        return;
      }
      state.customLogoUrl = url;
      if (logoStatus) {
        logoStatus.textContent = file.name;
      }
      if (btnRemoveLogo) {
        btnRemoveLogo.classList.remove("hidden");
      }
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
        if (logoStatus) {
          logoStatus.textContent = "PNG / JPG / SVG";
        }
        btnRemoveLogo.classList.add("hidden");
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
}
