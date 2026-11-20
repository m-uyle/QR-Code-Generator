import { state } from "./store.js";

const BACKSLASH_RE = /\\/gu;
const SEMICOLON_RE = /;/gu;
const COLON_RE = /:/gu;
const COMMA_RE = /,/gu;
const DOUBLE_QUOTE_RE = /"/gu;
const VCARD_NEWLINE_RE = /\r\n|\r|\n/gu;
const NUMERIC_RE = /^\d+$/u;
const ALPHANUMERIC_RE = /^[0-9A-Z $%*+\-./:]+$/u;
const PROTO_SCHEME_RE =
  /^(?:[a-z][a-z0-9+.-]*:\/\/|(?:(?:mailto|tel|sms|smsto|geo|wifi|bitcoin):))/iu;
const TEL_CLEAN_RE = /[^\d+*#]/gu;
const VCARD_WEB_PROTO_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//iu;
const HTTP_PREFIX_RE = /^https?:\/\//iu;
const WWW_PREFIX_RE = /^www\./u;
const NON_ALPHANUM_UNICODE_RE = /[^\p{L}\p{N}]+/gu;
const LEADING_TRAILING_DASH_RE = /^-+|-+$/gu;

function escapeWiFi(text) {
  return (text || "")
    .replace(BACKSLASH_RE, "\\\\")
    .replace(SEMICOLON_RE, "\\;")
    .replace(COLON_RE, "\\:")
    .replace(COMMA_RE, "\\,")
    .replace(DOUBLE_QUOTE_RE, '\\"');
}

function escapeVCard(text) {
  return (text || "")
    .replace(BACKSLASH_RE, "\\\\")
    .replace(SEMICOLON_RE, "\\;")
    .replace(COMMA_RE, "\\,")
    .replace(VCARD_NEWLINE_RE, " ");
}

export function pickMode(s) {
  if (NUMERIC_RE.test(s)) {
    return "Numeric";
  }
  if (ALPHANUMERIC_RE.test(s)) {
    return "Alphanumeric";
  }
  return "Byte";
}

const getVal = (id) => (document.querySelector(`#${id}`)?.value || "").trim();

function getUrlPayload() {
  let url = getVal("input-url");
  if (!url) {
    return "";
  }
  if (!PROTO_SCHEME_RE.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

function getTelPayload() {
  const rawPhone = getVal("tel-phone");
  if (!rawPhone) {
    return "";
  }
  const phone = rawPhone.replace(TEL_CLEAN_RE, "");
  return phone ? `tel:${phone}` : "";
}

function getEmailPayload() {
  const to = getVal("email-to");
  const subj = getVal("email-subject");
  const body = getVal("email-body");
  if (!(to || subj || body)) {
    return "";
  }
  const params = [];
  if (subj) {
    params.push(`subject=${encodeURIComponent(subj)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }
  const query = params.length ? `?${params.join("&")}` : "";
  return `mailto:${to}${query}`;
}

function getSmsPayload() {
  const rawPhone = getVal("sms-phone");
  const phone = rawPhone.replace(TEL_CLEAN_RE, "");
  const body = getVal("sms-body");
  if (!(phone || body)) {
    return "";
  }
  if (!phone) {
    return "";
  }
  return body
    ? `sms:${phone}?body=${encodeURIComponent(body)}`
    : `sms:${phone}`;
}

function getWifiPayload() {
  const ssid = escapeWiFi(getVal("wifi-ssid"));
  const pass = escapeWiFi(
    document.querySelector("#wifi-password")?.value || ""
  );
  const type = document.querySelector("#wifi-type")?.value || "WPA";
  const isHidden = Boolean(document.querySelector("#wifi-hidden")?.checked);
  if (!ssid) {
    return "";
  }
  const passPart = type === "nopass" ? "" : `P:${pass};`;
  const hiddenPart = isHidden ? "H:true;" : "";
  return `WIFI:S:${ssid};T:${type};${passPart}${hiddenPart};`;
}

function getTextPayload() {
  return getVal("input-text");
}

function getVcardPayload() {
  const fn = escapeVCard(getVal("vcard-fn"));
  const ln = escapeVCard(getVal("vcard-ln"));
  const org = escapeVCard(getVal("vcard-org"));
  let web = getVal("vcard-url");
  if (web && !VCARD_WEB_PROTO_RE.test(web)) {
    web = `https://${web}`;
  }
  const phone = escapeVCard(getVal("vcard-phone"));
  const email = escapeVCard(getVal("vcard-email"));

  if (!(fn || ln || org || web || phone || email)) {
    return "";
  }

  const nameParts = [fn, ln].filter(Boolean).join(" ");
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  lines.push(`N:${ln};${fn};;;`);
  lines.push(`FN:${nameParts || org || phone || email || web}`);
  if (org) {
    lines.push(`ORG:${org}`);
  }
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${phone}`);
  }
  if (email) {
    lines.push(`EMAIL;TYPE=INTERNET:${email}`);
  }
  if (web) {
    lines.push(`URL:${web}`);
  }
  lines.push("END:VCARD");

  return lines.join("\r\n");
}

function getGeoPayload() {
  const lat = Number.parseFloat(getVal("geo-lat").replace(",", "."));
  const lng = Number.parseFloat(getVal("geo-lng").replace(",", "."));
  if (
    !(Number.isFinite(lat) && Number.isFinite(lng)) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return "";
  }
  const coords = `${lat},${lng}`;
  return document.querySelector("#geo-format")?.value === "maps"
    ? `https://www.google.com/maps?q=${coords}`
    : `geo:${coords}`;
}

function getSbpPayload() {
  const rawLink = getVal("sbp-link");
  if (!rawLink) {
    return "";
  }
  const rawAmount = getVal("sbp-amount");
  const desc = getVal("sbp-desc");

  try {
    if (HTTP_PREFIX_RE.test(rawLink)) {
      const u = new URL(rawLink);
      if (rawAmount) {
        const cleanAmount = rawAmount.replace(",", ".");
        const parsedAmount = Number.parseFloat(cleanAmount);
        if (!Number.isNaN(parsedAmount) && parsedAmount > 0) {
          u.searchParams.set("sum", String(Math.round(parsedAmount * 100)));
          u.searchParams.set("cur", "RUB");
        }
      }
      if (desc) {
        u.searchParams.set("desc", desc);
      }
      return u.toString();
    }
  } catch {
    // Ignore URL parse error
  }

  return rawLink;
}

const PAYLOAD_BUILDERS = {
  url: getUrlPayload,
  tel: getTelPayload,
  email: getEmailPayload,
  sms: getSmsPayload,
  wifi: getWifiPayload,
  text: getTextPayload,
  vcard: getVcardPayload,
  geo: getGeoPayload,
  sbp: getSbpPayload,
};

export function getPayload() {
  const builder = PAYLOAD_BUILDERS[state.contentType];
  return builder ? builder() : "";
}

export function fileBase() {
  const t = state.contentType;
  let hint = "";
  try {
    hint =
      {
        url: () => new URL(getPayload()).hostname.replace(WWW_PREFIX_RE, ""),
        tel: () => getVal("tel-phone"),
        wifi: () => getVal("wifi-ssid"),
        email: () => getVal("email-to"),
        sms: () => getVal("sms-phone"),
        text: () => getVal("input-text").slice(0, 24),
        vcard: () =>
          [getVal("vcard-fn"), getVal("vcard-ln")].join(" ").trim() ||
          getVal("vcard-org"),
        geo: () => `${getVal("geo-lat")} ${getVal("geo-lng")}`,
        sbp: () => getVal("sbp-amount"),
      }[t]() || "";
  } catch {
    // Ignore URL parse error in hint
  }
  const slug = hint
    .normalize("NFKC")
    .replace(NON_ALPHANUM_UNICODE_RE, "-")
    .replace(LEADING_TRAILING_DASH_RE, "")
    .slice(0, 32);
  return slug ? `qr-${t}-${slug}` : `qr-${t}`;
}
