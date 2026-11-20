import { STORAGE_KEY } from "../../../shared/config/index.js";
import { debounce } from "../../../shared/lib/debounce.js";
import { defaultState, STATE_ENUMS } from "./constants.js";

export let state = { ...defaultState };

export function replaceState(nextState) {
  state = { ...nextState };
}

export function withState(overrides, fn) {
  const saved = state;
  state = { ...state, ...overrides };
  try {
    return fn();
  } finally {
    state = saved;
  }
}

function sanitizeState() {
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
  ["sbpLink", "sbp-link"],
  ["sbpAmount", "sbp-amount"],
  ["sbpDesc", "sbp-desc"],
];

function getPayloadValuesFromDom() {
  const values = {};
  for (const [key, id, defaultVal] of PAYLOAD_FIELD_MAP) {
    values[key] = document.querySelector(`#${id}`)?.value || defaultVal || "";
  }
  values.wifiHidden = Boolean(document.querySelector("#wifi-hidden")?.checked);
  return values;
}

export function saveState() {
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
