const PHONE_CHARS_RE = /^[\d\s()+\-.*#]+$/u;
const NON_DIGIT_RE = /\D/gu;
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/u;
const URL_PROTO_RE = /^[a-z][a-z0-9+.-]*:\/\//iu;
const HTTP_PROTO_RE = /^https?:$/u;
const WHITESPACE_RE = /\s/u;
const NUM_FLOAT_RE = /^-?\d+(?:[.,]\d+)?$/u;
const SBP_LINK_RE = /^https?:\/\/\S+$/iu;
const SBP_AMOUNT_RE = /^\d+(?:[.,]\d{1,2})?$/u;
const WIFI_SEC_RE = /^(?:WPA|SAE)$/u;

const phoneOk = (v) =>
  PHONE_CHARS_RE.test(v) &&
  v.replace(NON_DIGIT_RE, "").length >= 5 &&
  v.replace(NON_DIGIT_RE, "").length <= 15;
const emailOk = (v) => EMAIL_RE.test(v);
const urlOk = (v) => {
  try {
    const u = new URL(URL_PROTO_RE.test(v) ? v : `https://${v}`);
    return (
      HTTP_PROTO_RE.test(u.protocol) &&
      !WHITESPACE_RE.test(v) &&
      (u.hostname.includes(".") || u.hostname === "localhost")
    );
  } catch {
    return false;
  }
};
const numIn = (v, max) =>
  NUM_FLOAT_RE.test(v) &&
  Math.abs(Number.parseFloat(v.replace(",", "."))) <= max;

const VALIDATORS = {
  "input-url": (v) => urlOk(v) || "Enter a valid web address",
  "vcard-url": (v) => urlOk(v) || "Enter a valid web address",
  "tel-phone": (v) => phoneOk(v) || "Phone number looks invalid",
  "sms-phone": (v) => phoneOk(v) || "Phone number looks invalid",
  "vcard-phone": (v) => phoneOk(v) || "Phone number looks invalid",
  "email-to": (v) =>
    v.split(",").every((a) => emailOk(a.trim())) || "Invalid email address",
  "vcard-email": (v) => emailOk(v) || "Invalid email address",
  "geo-lat": (v) => numIn(v, 90) || "Latitude must be between -90 and 90",
  "geo-lng": (v) => numIn(v, 180) || "Longitude must be between -180 and 180",
  "sbp-link": (v) =>
    SBP_LINK_RE.test(v) || "Expected a link like https://qr.nspk.ru/...",
  "sbp-amount": (v) =>
    (SBP_AMOUNT_RE.test(v) && Number.parseFloat(v.replace(",", ".")) > 0) ||
    "Amount, e.g. 150.50",
  "wifi-password": (v) =>
    !WIFI_SEC_RE.test(document.querySelector("#wifi-type")?.value ?? "") ||
    (v.length >= 8 && v.length <= 63) ||
    "WPA/WPA3 passwords are 8-63 characters",
};

export function validateAll() {
  let firstErr = "";
  for (const [id, fn] of Object.entries(VALIDATORS)) {
    const el = document.querySelector(`#${id}`);
    if (!el) {
      continue;
    }
    const v = id === "wifi-password" ? el.value : el.value.trim();
    const r = v ? fn(v) : true;
    if (r === true) {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("title");
      continue;
    }
    el.setAttribute("aria-invalid", "true");
    el.title = r;
    if (!firstErr && el.closest(".type-field:not(.hidden)")) {
      firstErr = r;
    }
  }
  return firstErr;
}
