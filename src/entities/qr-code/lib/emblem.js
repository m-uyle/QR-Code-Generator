import { QR_VECTOR_TOKENS } from "../../../shared/config/index.js";
import { TYPE_ICONS } from "../model/constants.js";
import { state } from "../model/store.js";

const ON_EVENT_ATTR_RE = /^on/iu;
const HREF_ATTR_RE = /href$/iu;
const SAFE_HREF_VALUE_RE = /^(?:#|data:image\/)/iu;
const ID_ATTR_RE = /\bid="(?<id>[^"]+)"/gu;
const URL_HASH_RE = /url\(#(?<url>[^)]+)\)/gu;
const HREF_HASH_RE = /href="#(?<href>[^"]+)"/gu;
const DATA_SVG_RE = /^data:image\/svg\+xml/iu;
const QUOTE_RE = /"/gu;
const STRIP_SVG_ATTRS = ["width", "height", "x", "y", "style", "class"];

function emblemModules(N) {
  const odd = (x) => 2 * Math.round((x - 1) / 2) + 1;
  const maxK = N - 16;
  return Math.min(maxK, Math.max(odd(N * 0.24), odd(N * 0.19) + 2));
}

export function emblemCutout(N, shape) {
  const k = emblemModules(N);
  const circle = shape === "circle";
  const R = k / 2;
  const cx = N / 2;
  const cy = N / 2;
  const mid = (N - 1) / 2;

  return {
    k,
    circle,
    has(r, c) {
      if (circle) {
        // Module (r, c) occupies [c, c + 1] x [r, r + 1].
        // Only mark cell as cleared if its ENTIRE bounding box is strictly within the circle.
        // Boundary cells remain in the matrix grid so they connect to outer modules,
        // and are then cleanly cut along the exact circle arc by the vector clip-path.
        const maxDx = Math.max(Math.abs(c - cx), Math.abs(c + 1 - cx));
        const maxDy = Math.max(Math.abs(r - cy), Math.abs(r + 1 - cy));
        return maxDx * maxDx + maxDy * maxDy <= R * R;
      }
      const dx = Math.max(Math.abs(c - mid) - 0.5, 0);
      const dy = Math.max(Math.abs(r - mid) - 0.5, 0);
      return Math.max(dx, dy) < R;
    },
  };
}

export function getEmblemUrl() {
  if (state.customLogoUrl) {
    return state.customLogoUrl;
  }
  const icon = state.builtinIcon && TYPE_ICONS[state.contentType];
  if (!icon) {
    return null;
  }
  const ink = QR_VECTOR_TOKENS.moduleFill;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="translate(3.5 3.5) scale(.708)" color="${ink}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${icon}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function inlineSvgEmblem(dataUrl, x, y, size) {
  try {
    const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) =>
      c.charCodeAt(0)
    );
    const doc = new DOMParser().parseFromString(
      new TextDecoder().decode(bytes),
      "image/svg+xml"
    );
    const root = doc.documentElement;
    if (doc.querySelector("parsererror") || root.localName !== "svg") {
      return null;
    }
    for (const n of root.querySelectorAll(
      "script,foreignObject,iframe,object,embed,audio,video"
    )) {
      n.remove();
    }
    for (const el of root.querySelectorAll("*")) {
      for (const a of Array.from(el.attributes)) {
        if (
          ON_EVENT_ATTR_RE.test(a.name) ||
          (HREF_ATTR_RE.test(a.name) &&
            !SAFE_HREF_VALUE_RE.test(a.value.trim()))
        ) {
          el.removeAttribute(a.name);
        }
      }
    }
    let vb = root.getAttribute("viewBox");
    if (!vb) {
      const w = Number.parseFloat(root.getAttribute("width"));
      const h = Number.parseFloat(root.getAttribute("height"));
      if (!(w > 0 && h > 0)) {
        return null;
      }
      vb = `0 0 ${w} ${h}`;
    }
    for (const a of STRIP_SVG_ATTRS) {
      root.removeAttribute(a);
    }
    root.setAttribute("viewBox", vb);
    root.setAttribute("x", x);
    root.setAttribute("y", y);
    root.setAttribute("width", size);
    root.setAttribute("height", size);
    root.setAttribute("preserveAspectRatio", "xMidYMid meet");
    return new XMLSerializer()
      .serializeToString(root)
      .replace(ID_ATTR_RE, 'id="qrlogo-$<id>"')
      .replace(URL_HASH_RE, "url(#qrlogo-$<url>)")
      .replace(HREF_HASH_RE, 'href="#qrlogo-$<href>"');
  } catch {
    return null;
  }
}

export function emblemInner(x, y, size) {
  const url = state.customLogoUrl;
  if (!url) {
    const icon = state.builtinIcon && TYPE_ICONS[state.contentType];
    if (!icon) {
      return "";
    }
    const ink = QR_VECTOR_TOKENS.moduleFill;
    return `<g transform="translate(${x} ${y}) scale(${+(size / 24).toFixed(4)})"><g transform="translate(3.5 3.5) scale(.708)" color="${ink}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${icon}</g></g>`;
  }
  if (DATA_SVG_RE.test(url)) {
    const v = inlineSvgEmblem(url, x, y, size);
    if (v) {
      return v;
    }
  }
  const safe = url.replace(QUOTE_RE, "&quot;");
  return `<image href="${safe}" xlink:href="${safe}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />`;
}
