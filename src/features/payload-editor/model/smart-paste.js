const UNESCAPE_SLASH_RE = /\\(?<char>.)/gu;
const WIFI_PREFIX_RE = /^WIFI:/iu;
const WIFI_PARAM_RE = /(?<key>[A-Z]):(?<val>(?:\\.|[^;\\])*);/gu;
const VCARD_PREFIX_RE = /^BEGIN:VCARD/iu;
const VCARD_LINES_RE = /\r?\n/u;
const VCARD_N_RE = /^N[:;]/iu;
const VCARD_FN_RE = /^FN[:;]/iu;
const VCARD_ORG_RE = /^ORG[:;]/iu;
const VCARD_TEL_RE = /^TEL/iu;
const VCARD_EMAIL_RE = /^EMAIL/iu;
const VCARD_URL_RE = /^URL[:;]/iu;
const MAILTO_PREFIX_RE = /^mailto:/iu;
const SMSTO_RE = /^smsto:(?<phone>[^:]*):(?<body>[\s\S]*)$/iu;
const SMS_RE = /^sms:(?<phone>[^?&;]*)(?:[?&;]body=(?<body>[\s\S]*))?$/iu;
const TEL_PREFIX_RE = /^tel:/iu;
const GEO_URI_RE = /^geo:(?<lat>-?[\d.]+),(?<lng>-?[\d.]+)/iu;
const MAPS_CHECK_RE = /maps/iu;
const MAPS_QUERY_RE =
  /[?&](?:q|ll)=(?<lat1>-?[\d.]+),(?<lng1>-?[\d.]+)|@(?<lat2>-?[\d.]+),(?<lng2>-?[\d.]+)/u;
const SBP_LINK_RE = /^https?:\/\/qr\.nspk\.ru/iu;
const RAW_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const RAW_PHONE_RE = /^\+?[\d\s().-]{7,20}$/u;
const URL_SCHEME_RE = /^https?:\/\//iu;
const URL_DOMAIN_RE = /^(?:www\.)?[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:\/\S*)?$/iu;
const WHITESPACE_RE = /\s/u;
const WHITESPACES_GLOBAL_RE = /\s+/gu;

function setField(id, value) {
  const el = document.querySelector(`#${id}`);
  if (!el) {
    return;
  }
  el.value = value ?? "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  if (el.tagName === "SELECT") {
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

const switchType = (t) => document.querySelector(`#tab-${t}`)?.click();
const safeDecode = (x) => {
  try {
    return decodeURIComponent(x);
  } catch {
    return x;
  }
};
const unesc = (x) => x.replace(UNESCAPE_SLASH_RE, "$<char>");

function getWifiType(t, hasPassword) {
  if (t === "SAE") {
    return "SAE";
  }
  if (t === "WEP") {
    return "WEP";
  }
  if (t === "NOPASS" || !hasPassword) {
    return "nopass";
  }
  return "WPA";
}

function tryParseWifi(s) {
  if (!WIFI_PREFIX_RE.test(s)) {
    return null;
  }
  const f = {};
  for (const match of s.slice(5).matchAll(WIFI_PARAM_RE)) {
    if (match.groups) {
      f[match.groups.key] = unesc(match.groups.val);
    }
  }
  const T = (f.T || "").toUpperCase();
  switchType("wifi");
  setField("wifi-ssid", f.S || "");
  setField("wifi-type", getWifiType(T, Boolean(f.P)));
  setField("wifi-password", f.P || "");
  const h = document.querySelector("#wifi-hidden");
  if (h) {
    h.checked = f.H === "true";
    h.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return "Wi-Fi";
}

function tryParseVCard(s) {
  if (!VCARD_PREFIX_RE.test(s)) {
    return null;
  }
  const lines = s.split(VCARD_LINES_RE);
  const g = (re) => {
    const l = lines.find((x) => re.test(x));
    return l ? l.slice(l.indexOf(":") + 1) : "";
  };
  const n = g(VCARD_N_RE).split(";").map(unesc);
  switchType("vcard");
  setField("vcard-ln", n[0] || "");
  setField("vcard-fn", n[1] || (n[0] ? "" : unesc(g(VCARD_FN_RE))));
  setField("vcard-org", unesc(g(VCARD_ORG_RE).split(";")[0]));
  setField("vcard-phone", unesc(g(VCARD_TEL_RE)));
  setField("vcard-email", unesc(g(VCARD_EMAIL_RE)));
  setField("vcard-url", g(VCARD_URL_RE));
  return "vCard";
}

function tryParseMailto(s) {
  if (!MAILTO_PREFIX_RE.test(s)) {
    return null;
  }
  const u = new URL(s);
  switchType("email");
  setField("email-to", safeDecode(u.pathname));
  setField("email-subject", u.searchParams.get("subject") || "");
  setField("email-body", u.searchParams.get("body") || "");
  return "Email";
}

function tryParseSms(s) {
  const match = s.match(SMSTO_RE) || s.match(SMS_RE);
  if (!match?.groups) {
    return null;
  }
  switchType("sms");
  setField("sms-phone", match.groups.phone);
  setField("sms-body", safeDecode(match.groups.body || ""));
  return "SMS";
}

function tryParseTel(s) {
  if (!TEL_PREFIX_RE.test(s)) {
    return null;
  }
  switchType("tel");
  setField("tel-phone", s.slice(4));
  return "Phone";
}

function tryParseGeo(s) {
  const geoMatch = s.match(GEO_URI_RE);
  if (geoMatch?.groups) {
    switchType("geo");
    setField("geo-lat", geoMatch.groups.lat);
    setField("geo-lng", geoMatch.groups.lng);
    setField("geo-format", "geo");
    return "Location";
  }
  if (MAPS_CHECK_RE.test(s)) {
    const mapsMatch = s.match(MAPS_QUERY_RE);
    if (mapsMatch?.groups) {
      switchType("geo");
      setField("geo-lat", mapsMatch.groups.lat1 || mapsMatch.groups.lat2);
      setField("geo-lng", mapsMatch.groups.lng1 || mapsMatch.groups.lng2);
      setField("geo-format", "maps");
      return "Location";
    }
  }
  return null;
}

function tryParseSbp(s) {
  if (!SBP_LINK_RE.test(s)) {
    return null;
  }
  switchType("sbp");
  setField("sbp-link", s);
  return "СБП";
}

function tryParseRawEmailOrPhone(s) {
  if (RAW_EMAIL_RE.test(s)) {
    switchType("email");
    setField("email-to", s);
    return "Email";
  }
  if (RAW_PHONE_RE.test(s)) {
    switchType("tel");
    setField("tel-phone", s);
    return "Phone";
  }
  return null;
}

function tryParseUrl(s) {
  if (
    !WHITESPACE_RE.test(s) &&
    (URL_SCHEME_RE.test(s) || URL_DOMAIN_RE.test(s))
  ) {
    switchType("url");
    setField("input-url", s);
    return "Link";
  }
  return null;
}

export function smartPaste(raw) {
  const s = raw.trim();
  if (!s) {
    return null;
  }

  const result =
    tryParseWifi(s) ||
    tryParseVCard(s) ||
    tryParseMailto(s) ||
    tryParseSms(s) ||
    tryParseTel(s) ||
    tryParseGeo(s) ||
    tryParseSbp(s) ||
    tryParseRawEmailOrPhone(s) ||
    tryParseUrl(s);

  if (result) {
    return result;
  }

  switchType("text");
  setField("input-text", s.replace(WHITESPACES_GLOBAL_RE, " "));
  return "Text";
}
