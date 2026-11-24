import { STORAGE_KEY } from "../../../shared/config/index.js";
import { debounce } from "../../../shared/lib/debounce.js";
import { defaultState, STATE_ENUMS } from "./constants.js";

export let state = { ...defaultState };

export function withState(overrides, fn) {
  const saved = state;
  state = { ...state, ...overrides };
  try {
    return fn();
  } finally {
    state = saved;
  }
}

export function applyStylePreset(styleMode) {
  state.codeStyle = styleMode === "rounded" ? "rounded" : "classic";
  if (state.codeStyle === "rounded") {
    state.moduleShape = "soft";
    state.moduleRadius = 65;
    if (state.eyeChoice === "default") {
      state.eyeShape = "rounded";
    }
  } else {
    state.moduleShape = "square";
    state.moduleRadius = 0;
    if (state.eyeChoice === "default") {
      state.eyeShape = "square";
    }
  }
}

export function applyEyeChoice(choice) {
  state.eyeChoice = choice;
  if (choice === "default") {
    state.eyeShape = state.codeStyle === "rounded" ? "rounded" : "square";
  } else {
    state.eyeShape = choice;
  }
}

function sanitizeState() {
  if (!STATE_ENUMS.codeStyle.includes(state.codeStyle)) {
    state.codeStyle =
      state.moduleShape === "soft" || state.moduleRadius > 30
        ? "rounded"
        : "classic";
  }
  if (!STATE_ENUMS.eyeChoice.includes(state.eyeChoice)) {
    if (state.eyeShape === "circle") {
      state.eyeChoice = "circle";
    } else if (state.eyeShape === "leaf") {
      state.eyeChoice = "leaf";
    } else {
      state.eyeChoice = "default";
    }
  }
  applyStylePreset(state.codeStyle);
  applyEyeChoice(state.eyeChoice);

  for (const [k, list] of Object.entries(STATE_ENUMS)) {
    if (!list.includes(state[k])) {
      state[k] = defaultState[k];
    }
  }
  const r = Number(state.moduleRadius);
  state.moduleRadius = Number.isFinite(r)
    ? Math.min(100, Math.max(0, r))
    : defaultState.moduleRadius;
  const m = Math.round(Number(state.margin));
  state.margin = Number.isFinite(m)
    ? Math.min(12, Math.max(0, m))
    : defaultState.margin;
  state.isTransparent = Boolean(state.isTransparent);
  state.builtinIcon = Boolean(state.builtinIcon);
}

const PAYLOAD_FIELD_MAP = [
  ["url", "input-url"],
  ["telPhone", "tel-phone"],
  ["emailTo", "email-to"],
  ["emailSubject", "email-subject"],
  ["emailBody", "email-body"],
  ["smsPhone", "sms-phone"],
  ["smsBody", "sms-body"],
  ["wifiSsid", "wifi-ssid"],
  ["wifiType", "wifi-type", "WPA"],
  ["text", "input-text"],
  ["vcardFn", "vcard-fn"],
  ["vcardLn", "vcard-ln"],
  ["vcardOrg", "vcard-org"],
  ["vcardUrl", "vcard-url"],
  ["vcardPhone", "vcard-phone"],
  ["vcardEmail", "vcard-email"],
  ["geoLat", "geo-lat"],
  ["geoLng", "geo-lng"],
  ["geoFormat", "geo-format", "maps"],
];

function getPayloadValuesFromDom() {
  const values = {};
  for (const [key, id, defaultVal] of PAYLOAD_FIELD_MAP) {
    values[key] = document.querySelector(`#${id}`)?.value || defaultVal || "";
  }
  values.wifiHidden = Boolean(document.querySelector("#wifi-hidden")?.checked);
  return values;
}

function saveState() {
  try {
    const payloadValues = getPayloadValuesFromDom();
    const { customLogoUrl: _customLogoUrl, ...persistedState } = state;
    const toStore = {
      ...persistedState,
      payloadValues,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Ignore localStorage write quota/permission errors
  }
}

export const debouncedSaveState = debounce(() => {
  saveState();
}, 250);

function applyPayloadValuesToDom(pv) {
  for (const [key, id] of PAYLOAD_FIELD_MAP) {
    const v = pv[key];
    const el = document.querySelector(`#${id}`);
    if (el && (typeof v === "string" || typeof v === "number")) {
      el.value = String(v);
    }
  }
  const elWifiHidden = document.querySelector("#wifi-hidden");
  if (elWifiHidden && pv.wifiHidden !== undefined) {
    elWifiHidden.checked = Boolean(pv.wifiHidden);
  }
}

export function loadState(onSyncUI) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);

    for (const k of Object.keys(defaultState)) {
      if (k !== "customLogoUrl" && parsed[k] !== undefined) {
        state[k] = parsed[k];
      }
    }
    sanitizeState();

    if (parsed.payloadValues) {
      applyPayloadValuesToDom(parsed.payloadValues);
    }

    if (onSyncUI) {
      onSyncUI();
    }
  } catch {
    // Ignore localStorage restore error
  }
}
