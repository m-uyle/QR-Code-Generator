import {
  defaultState,
  loadState,
  replaceState,
  STYLE_KEYS,
  STYLE_LABELS,
  saveState,
  state,
} from "../../../entities/qr-code/index.js";
import { STORAGE_KEY } from "../../../shared/config/index.js";
import { showToast, showUndoToast } from "../../../shared/ui/toast/index.js";

const history = { stack: [], idx: -1, timer: 0 };
let isApplyingHistory = false;
const styleSnap = () =>
  Object.fromEntries(STYLE_KEYS.map((k) => [k, state[k]]));
const sameSnap = (a, b) => STYLE_KEYS.every((k) => a[k] === b[k]);

export function historyInit() {
  history.stack = [styleSnap()];
  history.idx = 0;
}

export function scheduleHistory() {
  if (isApplyingHistory) {
    return;
  }
  clearTimeout(history.timer);
  history.timer = setTimeout(commitHistory, 350);
}

function commitHistory() {
  const snap = styleSnap();
  if (!history.stack.length) {
    history.stack = [snap];
    history.idx = 0;
    return;
  }
  if (sameSnap(history.stack[history.idx], snap)) {
    return;
  }
  history.stack.length = history.idx + 1;
  history.stack.push(snap);
  if (history.stack.length > 100) {
    history.stack.shift();
  }
  history.idx = history.stack.length - 1;
}

function historyStep(
  dir,
  { onSyncAllUIControls, onUpdateContainerWidth, onRenderQR }
) {
  clearTimeout(history.timer);
  commitHistory();
  const next = history.idx + dir;
  if (next < 0 || next >= history.stack.length) {
    showToast(dir < 0 ? "Nothing to undo" : "Nothing to redo");
    return;
  }
  const from = history.stack[history.idx];
  const to = history.stack[next];
  const changed = STYLE_KEYS.filter((k) => from[k] !== to[k]).map(
    (k) => STYLE_LABELS[k]
  );
  history.idx = next;
  isApplyingHistory = true;
  Object.assign(state, to);
  if (onSyncAllUIControls) {
    onSyncAllUIControls();
  }
  if (onUpdateContainerWidth) {
    onUpdateContainerWidth();
  }
  onRenderQR();
  setTimeout(() => {
    isApplyingHistory = false;
  }, 200);
  showToast(
    `${dir < 0 ? "Undid" : "Redid"}: ${changed.slice(0, 2).join(", ")}`
  );
}

function captureSnapshot() {
  saveState();
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Ignore storage availability errors
  }
  return {
    raw,
    logo: state.customLogoUrl,
    pass: document.querySelector("#wifi-password")?.value || "",
  };
}

function restoreSnapshot(
  s,
  { onSyncAllUIControls, onUpdateContainerWidth, onRenderQR }
) {
  replaceState({ ...defaultState });
  if (s.raw) {
    try {
      localStorage.setItem(STORAGE_KEY, s.raw);
    } catch {
      // Ignore storage availability errors
    }
    loadState(onSyncAllUIControls);
  }
  const passEl = document.querySelector("#wifi-password");
  if (passEl) {
    passEl.value = s.pass || "";
  }
  state.customLogoUrl = s.logo || null;
  if (onSyncAllUIControls) {
    onSyncAllUIControls();
  }
  if (onUpdateContainerWidth) {
    onUpdateContainerWidth();
  }
  onRenderQR();
  showToast("Settings restored");
}

const RESET_INPUT_IDS = [
  "input-url",
  "tel-phone",
  "email-to",
  "email-subject",
  "email-body",
  "sms-phone",
  "sms-body",
  "wifi-ssid",
  "wifi-password",
  "input-text",
  "vcard-fn",
  "vcard-ln",
  "vcard-org",
  "vcard-url",
  "vcard-phone",
  "vcard-email",
  "geo-lat",
  "geo-lng",
  "sbp-link",
  "sbp-amount",
  "sbp-desc",
];

function resetToDefaults(callbacks) {
  const { onSyncAllUIControls, onUpdateContainerWidth, onRenderQR } = callbacks;
  const snap = captureSnapshot();
  localStorage.removeItem(STORAGE_KEY);
  replaceState({ ...defaultState });

  for (const id of RESET_INPUT_IDS) {
    const el = document.querySelector(`#${id}`);
    if (el) {
      el.value = "";
    }
  }

  const wifiHidden = document.querySelector("#wifi-hidden");
  if (wifiHidden) {
    wifiHidden.checked = false;
  }

  const wifiType = document.querySelector("#wifi-type");
  if (wifiType) {
    wifiType.value = "WPA";
  }
  const wifiPass = document.querySelector("#wifi-password");
  if (wifiPass) {
    wifiPass.classList.remove("hidden");
  }

  const geoFormat = document.querySelector("#geo-format");
  if (geoFormat) {
    geoFormat.value = "maps";
  }

  const fileInput = document.querySelector("#input-logo-file");
  if (fileInput) {
    fileInput.value = "";
  }

  if (onSyncAllUIControls) {
    onSyncAllUIControls();
  }
  if (onUpdateContainerWidth) {
    onUpdateContainerWidth();
  }
  onRenderQR();
  showUndoToast("Settings cleared", () => restoreSnapshot(snap, callbacks));
}

export function initStyleHistoryListeners(callbacks, options = {}) {
  const { signal } = options;
  const btnReset = document.querySelector("#btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => resetToDefaults(callbacks), {
      signal,
    });
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) {
        return;
      }
      if (e.target?.closest?.("input, textarea, select, [contenteditable]")) {
        return;
      }
      const z = e.code === "KeyZ";
      const y = e.code === "KeyY";
      if (!(z || y)) {
        return;
      }
      e.preventDefault();
      historyStep(y || e.shiftKey ? 1 : -1, callbacks);
    },
    { signal }
  );
}
