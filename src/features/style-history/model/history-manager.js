import {
  STYLE_KEYS,
  STYLE_LABELS,
  state,
} from "../../../entities/qr-code/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

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

export function initStyleHistoryListeners(callbacks, options = {}) {
  const { signal } = options;

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
