import {
  QR_VECTOR_TOKENS,
  SVG_FLUID_ATTRS,
} from "../../../shared/config/index.js";
import {
  ensureUtf8Support,
  getQrEngine,
} from "../../../shared/lib/qrcode-engine.js";
import { getAutoEcc, getAutoMargin } from "../model/auto-params.js";
import { getPayload, pickMode } from "../model/payload.js";
import { state } from "../model/store.js";
import { emblemCutout, emblemInner, getEmblemUrl } from "./emblem.js";
import {
  bgCornerRadius,
  buildDissolvedPolygonPath,
  getBadgePath,
  getEyeSubpaths,
  isFinderOrSeparator,
  pCircle,
} from "./geometry.js";

function generateQrMatrix(payload, eccLevel) {
  const qrcode = getQrEngine();
  if (typeof qrcode === "undefined") {
    return null;
  }
  try {
    const qr = qrcode(0, eccLevel);
    qr.addData(payload, pickMode(payload));
    qr.make();
    return qr;
  } catch {
    return null;
  }
}

function getEffectiveModuleRadius(moduleShape, radiusRatio) {
  if (moduleShape === "soft") {
    return Math.max(0.12, radiusRatio);
  }
  if (radiusRatio > 0) {
    return radiusRatio * 0.5;
  }
  return 0;
}

function buildModulesCompoundPath(qr, N, margin, radiusRatio, isCleared) {
  let compoundPath = "";

  // Finder patterns (Corner Eyes)
  compoundPath += getEyeSubpaths(0, 0, margin, state.eyeShape);
  compoundPath += getEyeSubpaths(N - 7, 0, margin, state.eyeShape);
  compoundPath += getEyeSubpaths(0, N - 7, margin, state.eyeShape);

  if (state.moduleShape === "square" || state.moduleShape === "soft") {
    const effectiveRadius = getEffectiveModuleRadius(
      state.moduleShape,
      radiusRatio
    );
    compoundPath += buildDissolvedPolygonPath(
      qr,
      N,
      margin,
      effectiveRadius,
      isCleared
    );
  } else {
    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        if (isFinderOrSeparator(r, c, N) || isCleared(r, c)) {
          continue;
        }
        if (qr.isDark(r, c)) {
          const x = c + margin;
          const y = r + margin;
          compoundPath += pCircle(x + 0.5, y + 0.5, 0.42);
        }
      }
    }
  }

  return compoundPath;
}

function buildEmblemMarkup(hasLogo, cut, cx, cy, qrDim) {
  if (!(hasLogo && cut)) {
    return { defs: "", emblem: "", matrixClipAttr: "" };
  }
  const innerSize = Number(
    Math.max(1, cut.k - (cut.circle ? 0.6 : 0.9)).toFixed(2)
  );
  const logoClipPath = getBadgePath(
    cx,
    cy,
    innerSize,
    state.logoBadgeShape,
    state.moduleRadius
  );
  const innerX = Number((cx - innerSize / 2).toFixed(3));
  const innerY = Number((cy - innerSize / 2).toFixed(3));

  const cutoutPath = cut.circle
    ? pCircle(cx, cy, cut.k / 2)
    : getBadgePath(cx, cy, cut.k, state.logoBadgeShape, state.moduleRadius);

  const defs = `
    <defs>
      <clipPath id="qr-cutout-clip" clipPathUnits="userSpaceOnUse">
        <path clip-rule="evenodd" d="M -10 -10 H ${qrDim + 20} V ${qrDim + 20} H -10 Z ${cutoutPath}" />
      </clipPath>
      <clipPath id="badge-logo-clip" clipPathUnits="userSpaceOnUse">
        <path d="${logoClipPath}" />
      </clipPath>
    </defs>
  `;
  const emblem = `<g id="qr-logo" clip-path="url(#badge-logo-clip)">${emblemInner(innerX, innerY, innerSize)}</g>`;
  return {
    defs,
    emblem,
    matrixClipAttr: ' clip-path="url(#qr-cutout-clip)"',
  };
}

export function buildSvg() {
  ensureUtf8Support();
  const payload = getPayload();
  if (!payload) {
    return "EMPTY";
  }

  const hasLogo = Boolean(getEmblemUrl());
  state.eccLevel = getAutoEcc(payload, hasLogo);

  const qr = generateQrMatrix(payload, state.eccLevel);
  if (!qr) {
    return "";
  }

  const N = qr.getModuleCount();
  state.margin = getAutoMargin(N, payload.length);
  const margin = Math.max(0, Number(state.margin) || 0);
  const qrDim = N + margin * 2;

  const cx = margin + N / 2.0;
  const cy = margin + N / 2.0;

  const radiusRatio = (state.moduleRadius / 100) * 0.4;
  const cut = hasLogo ? emblemCutout(N, state.logoBadgeShape) : null;
  const isCleared = cut ? cut.has : () => false;

  const compoundPath = buildModulesCompoundPath(
    qr,
    N,
    margin,
    radiusRatio,
    isCleared
  );

  const { defs, emblem, matrixClipAttr } = buildEmblemMarkup(
    hasLogo,
    cut,
    cx,
    cy,
    qrDim
  );

  const bgR = bgCornerRadius(qrDim, margin);
  const bgRect = state.isTransparent
    ? ""
    : `<rect id="qr-bg" width="${qrDim}" height="${qrDim}"${bgR > 0 ? ` rx="${bgR}" ry="${bgR}"` : ""} fill="${QR_VECTOR_TOKENS.paperFill}" />`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${qrDim} ${qrDim}"${SVG_FLUID_ATTRS}>
      ${defs}
      <g id="qr-code">
        ${bgRect}
        <path id="qr-matrix"${matrixClipAttr} d="${compoundPath}" fill="${QR_VECTOR_TOKENS.moduleFill}" fill-rule="evenodd" />
        ${emblem}
      </g>
    </svg>
  `;
}
