import {
  ECC_RECOVERY,
  emblemCutout,
  getEmblemUrl,
  pickMode,
  state,
} from "../../../entities/qr-code/index.js";
import { PNG_EXPORT_PX } from "../../../shared/config/index.js";
import { sizedSvg } from "../../../shared/lib/rasterizer.js";
import { paintScrubEl } from "../../../shared/ui/scrubber/index.js";
import { SCAN_VARIANTS, scanCheck } from "./scan-engine.js";

const LOWERCASE_RE = /[a-z]/u;
const QR_MATRIX_RE = /id="qr-matrix" d="(?<matrix>[^"]*)"/u;
const EMBEDDED_IMAGE_RE =
  /<image\b[^>]*?href="data:image\/[a-z+]+;base64,(?<data>[^"]*)"/iu;
const QR_BG_RE = /<rect id="qr-bg"(?<attrs>[^>]*)>/u;
const RX_ATTR_RE = /rx="(?<rx>[0-9.]+)"/u;
const SVG_ELEMENTS_RE = /<(?:svg|g|path|rect|circle|image|clipPath|defs)\b/gu;
const QR_LOGO_ID_RE = /id="qr-logo"/u;

export const healthCtx = {
  empty: Boolean(Math.random()),
  N: Math.random() < 0 ? 1 : 0,
  dim: Math.random() < 0 ? 1 : 0,
  fieldErr: Math.random() < 0 ? "err" : "",
  enc: Math.random() < 0 ? {} : null,
  svg: Math.random() < 0 ? "svg" : null,
};
let scanState = { status: "idle", results: null };
export let qzActive = false;
let scanToken = 0;
let scanTimer = 0;

const BADGE_TONES = {
  gray: "surface-btn-secondary text-neutral-600 border-neutral-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
};
const DOT_TONES = {
  gray: "bg-neutral-400",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};
const SCAN_LABELS = {
  clean: "Sharp image",
  "low-res": "Small or far away (~3 px/module)",
  blurred: "Blurry, low contrast",
  tilted: "Tilted camera (7\u00B0)",
};

export function incrementScanToken() {
  scanToken += 1;
}

export function setScanState(next) {
  scanState = next;
}

export function markStale() {
  clearTimeout(scanTimer);
  scanToken += 1;
  if (scanState.status !== "pending" || scanState.results) {
    scanState = { status: "pending", results: null };
    renderHealth();
  }
}

function marginAdvice() {
  const { N } = healthCtx;
  const m = state.margin;
  const share = N ? N / (N + 2 * m) : 1;
  let kind = "";
  if (m < 4) {
    kind = "small";
  } else if (share < 0.65) {
    kind = "large";
  }
  return { kind, share };
}

export function paintMarginScrub() {
  const s = document.querySelector("#group-margin");
  if (!s) {
    return;
  }
  s.setAttribute("aria-valuenow", state.margin);
  s.setAttribute("aria-valuetext", `${state.margin} modules`);
  const adv = marginAdvice();
  s.dataset.rec = adv.kind ? "1" : "0";
  s.dataset.recKind = adv.kind;
  if (!adv.kind) {
    document.querySelector("#qz-tip")?.classList.remove("on");
  }
  paintScrubEl(s, state.margin / 12, state.margin);
}

function setBadge(tone, label) {
  const elHealthBadge = document.querySelector("#health-badge");
  if (!elHealthBadge) {
    return;
  }
  elHealthBadge.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium transition-all select-none border shadow-badge ${BADGE_TONES[tone]}`;
  elHealthBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${DOT_TONES[tone]}"></span><span id="health-text"></span>`;
  elHealthBadge.lastChild.textContent = label;
}

function getEncodingReason(mode, ascii, payload) {
  if (mode === "Numeric") {
    return "digits only";
  }
  if (mode === "Alphanumeric") {
    return "A-Z, 0-9, space and $%*+-./:";
  }
  if (ascii) {
    return LOWERCASE_RE.test(payload)
      ? "lowercase letters"
      : "symbols outside the alphanumeric set";
  }
  return "non-ASCII characters (UTF-8)";
}

export function encodingInfo(payload, N) {
  const mode = pickMode(payload);
  const bytes = new TextEncoder().encode(payload).length;
  const chars = [...payload].length;
  const ascii = bytes === chars;
  const reason = getEncodingReason(mode, ascii, payload);
  let cleared = 0;
  if (getEmblemUrl()) {
    const cut = emblemCutout(N, state.iconSize, state.logoBadgeShape);
    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        if (cut.has(r, c)) {
          cleared += 1;
        }
      }
    }
  }
  return {
    mode,
    reason,
    bytes,
    chars,
    ascii,
    version: (N - 17) / 4,
    N,
    ecc: state.eccLevel,
    cleared,
  };
}

function formatEmblemStat(svg, imgMatch) {
  if (imgMatch?.groups?.data) {
    const kb = ((imgMatch.groups.data.length * 0.75) / 1024).toFixed(1);
    return `embedded raster, ${kb} KB`;
  }
  if (QR_LOGO_ID_RE.test(svg)) {
    return "inline vector";
  }
  return "none";
}

function formatBackgroundStat(bgMatch) {
  if (!bgMatch) {
    return "transparent";
  }
  const attrs = bgMatch.groups?.attrs ?? "";
  const rxMatch = attrs.match(RX_ATTR_RE);
  const rx = rxMatch?.groups?.rx;
  if (rx) {
    return `white, corner radius ${rx} modules`;
  }
  return "white, square";
}

export function svgStats(svg) {
  const out = sizedSvg(svg, 1024);
  const bytes = new TextEncoder().encode(out).length;
  const matrixMatch = svg.match(QR_MATRIX_RE);
  const matrix = matrixMatch?.groups?.matrix ?? "";
  const imgMatch = svg.match(EMBEDDED_IMAGE_RE);
  const bgMatch = svg.match(QR_BG_RE);

  return {
    bytes,
    matrixChars: matrix.length,
    elements: (svg.match(SVG_ELEMENTS_RE) || []).length,
    emblem: formatEmblemStat(svg, imgMatch),
    background: formatBackgroundStat(bgMatch),
  };
}

function healthWarnings() {
  const w = [];
  const hasLogo = Boolean(getEmblemUrl());
  if (hasLogo && (state.eccLevel === "L" || state.eccLevel === "M")) {
    w.push({
      id: "ecc",
      label: "Low error correction",
      text: "The emblem hides data: use level Q or H",
    });
  }
  if (healthCtx.N >= 45) {
    w.push({
      id: "dense",
      label: "Very dense code",
      text: hasLogo
        ? "Dense code with an emblem: emblem size is capped"
        : "Print it larger so modules stay readable",
    });
  }
  return w;
}

function computeHealth() {
  if (healthCtx.empty) {
    return {
      tone: "gray",
      label: "Waiting for content",
      summary: "Enter content to test the code",
    };
  }
  if (healthCtx.fieldErr) {
    return {
      tone: "amber",
      label: "Check your input",
      summary: healthCtx.fieldErr,
    };
  }
  const used =
    scanState.status === "done"
      ? scanState.results.filter((r) => r.conclusive)
      : [];
  const passed = used.filter((r) => r.ok).length;
  const clean = used.find((r) => r.name === "clean");
  if (clean && !clean.ok) {
    return {
      tone: "red",
      label: "Won't scan",
      summary: "Even a sharp image of this code could not be decoded",
    };
  }
  if (used.length && passed < used.length) {
    return {
      tone: "amber",
      label: "Hard to scan",
      summary: `${passed} of ${used.length} scan tests passed`,
    };
  }
  const w = healthWarnings();
  if (w.length) {
    return { tone: "amber", label: w[0].label, summary: w[0].text };
  }
  if (scanState.status !== "done") {
    const doneN = scanState.results ? scanState.results.length : 0;
    return {
      tone: "gray",
      label: `Testing scan... ${doneN}/${SCAN_VARIANTS.length}`,
      summary: "Running scan tests",
    };
  }
  if (used.length) {
    return {
      tone: "green",
      label: "Scan tests passed",
      summary: `All ${used.length} scan tests passed`,
    };
  }
  return {
    tone: "blue",
    label: "Looks fine",
    summary: "Scan test was inconclusive in this browser",
  };
}

function createEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) {
    e.className = cls;
  }
  if (text !== undefined) {
    e.textContent = text;
  }
  return e;
}

function createRow(k, v, st) {
  const r = createEl("div", "sp-row");
  r.append(
    createEl("span", "sp-k", k),
    createEl("span", `sp-v${st ? ` sp-${st}` : ""}`, v)
  );
  return r;
}

function createSection(title) {
  const s = createEl("div", "sp-sec");
  s.append(createEl("div", "sp-h", title));
  return s;
}

function getScanStatus(name, i, doneN) {
  if (healthCtx.fieldErr) {
    return { text: "\u2013 not run", status: "skip" };
  }
  const r = scanState.results?.find((x) => x.name === name);
  if (r) {
    if (!r.conclusive) {
      return { text: "\u2013 skipped (decoder limit)", status: "skip" };
    }
    return r.ok
      ? { text: "\u2713 Passed", status: "ok" }
      : { text: "\u2715 Failed", status: "bad" };
  }
  if (scanState.status === "pending" && i === doneN) {
    return { text: "testing...", status: "run" };
  }
  return { text: "\u00B7 queued", status: "wait" };
}

function renderChecksSection(N, m, hasLogo) {
  const checks = createSection("Checks");
  checks.append(
    createRow(
      "Input",
      healthCtx.fieldErr ? `\u2715 ${healthCtx.fieldErr}` : "\u2713 Valid",
      healthCtx.fieldErr ? "bad" : "ok"
    )
  );
  const eccWeak = hasLogo && (state.eccLevel === "L" || state.eccLevel === "M");
  checks.append(
    createRow(
      "Error correction",
      eccWeak
        ? `\u26A0 Level ${state.eccLevel}, low for an emblem`
        : `\u2713 Level ${state.eccLevel}`,
      eccWeak ? "warn" : "ok"
    )
  );
  const adv = marginAdvice();
  let quietZoneText = `\u2713 ${m} modules`;
  if (adv.kind === "small") {
    quietZoneText = `${m} modules (margins may be too small)`;
  } else if (adv.kind === "large") {
    quietZoneText = `${m} modules (optional: code is ${Math.round(adv.share * 100)}% of the width)`;
  }
  checks.append(
    createRow("Quiet zone", quietZoneText, adv.kind ? "note" : "ok")
  );
  checks.append(
    createRow(
      "Code density",
      N >= 45
        ? `\u26A0 ${N} \u00D7 ${N} modules`
        : `\u2713 ${N} \u00D7 ${N} modules`,
      N >= 45 ? "warn" : "ok"
    )
  );

  const doneN = scanState.results ? scanState.results.length : 0;
  let idx = 0;
  for (const [name, label] of Object.entries(SCAN_LABELS)) {
    const { text, status } = getScanStatus(name, idx, doneN);
    checks.append(createRow(label, text, status));
    idx += 1;
  }
  return checks;
}

function renderEncodingSection(e) {
  const enc = createSection("Encoding inspector");
  const chips = createEl("div", "sp-chips");
  for (const n of ["Numeric", "Alphanumeric", "Byte"]) {
    chips.append(createEl("span", `sp-chip${e.mode === n ? " on" : ""}`, n));
  }
  enc.append(chips);
  enc.append(createRow("Chosen because", e.reason));
  enc.append(
    createRow(
      "Text",
      `${e.chars} chars, ${e.bytes} bytes${e.ascii ? "" : " (UTF-8)"}`
    )
  );
  enc.append(
    createRow("Version", `${e.version}, ${e.N} \u00D7 ${e.N} modules`)
  );
  enc.append(
    createRow(
      "Error correction",
      `${e.ecc}, repairs up to ${ECC_RECOVERY[e.ecc]}%`
    )
  );
  if (e.cleared) {
    const pct = ((e.cleared / (e.N * e.N)) * 100).toFixed(1);
    enc.append(createRow("Emblem area", `${e.cleared} modules (${pct}%)`));
  }
  if (!e.ascii) {
    enc.append(createRow("Charset marker", "none (readers detect UTF-8)"));
  }
  return enc;
}

function renderSvgSection(s, N, m) {
  const sv = createSection("SVG inspector");
  sv.append(
    createRow(
      "Canvas",
      `viewBox ${healthCtx.dim} \u00D7 ${healthCtx.dim} (${N} + 2\u00D7${m})`
    )
  );
  sv.append(
    createRow(
      "File",
      `${(s.bytes / 1024).toFixed(1)} KB, ${s.elements} elements`
    )
  );
  sv.append(
    createRow(
      "Matrix path",
      `${s.matrixChars.toLocaleString("en-US")} chars, even-odd`
    )
  );
  if (s.emblem !== "none") {
    sv.append(createRow("Emblem", s.emblem));
  }
  sv.append(createRow("Background", s.background));
  const px = Math.max(
    healthCtx.dim,
    Math.round(PNG_EXPORT_PX / healthCtx.dim) * healthCtx.dim
  );
  sv.append(
    createRow("PNG export", `${px} px (${px / healthCtx.dim} px per module)`)
  );
  return sv;
}

function renderPopover(h) {
  const pop = document.querySelector("#scan-pop");
  if (!pop) {
    return;
  }
  const head = createEl("div", "sp-head");
  head.append(
    createEl("div", "sp-title", "Scan test details"),
    createEl("div", "sp-sum", h.summary)
  );
  const out = [head];

  if (!healthCtx.empty) {
    const { N } = healthCtx;
    const m = state.margin;
    const hasLogo = Boolean(getEmblemUrl());
    out.push(renderChecksSection(N, m, hasLogo));

    const e = healthCtx.enc;
    if (e) {
      out.push(renderEncodingSection(e));
    }

    const s = healthCtx.svg;
    if (s) {
      out.push(renderSvgSection(s, N, m));
    }
  }
  pop.replaceChildren(...out);
}

export function drawQuietZone(mOverride) {
  const ov = document.querySelector("#qz-overlay");
  if (!ov) {
    return;
  }
  const { N } = healthCtx;
  const m = mOverride ?? state.margin;
  const dim = N + 2 * m;
  if (healthCtx.empty || !N) {
    ov.classList.remove("on");
    return;
  }
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--preview-qz-color")
    .trim();
  const sig = `${dim}|${N}|${m}`;
  if (ov.dataset.sig === sig && ov.classList.contains("on")) {
    return;
  }
  ov.dataset.sig = sig;
  const band =
    m > 0
      ? `
    <defs><pattern id="qz-h" width="1.3" height="1.3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.3" height=".2" fill="${color}" fill-opacity=".45"/></pattern></defs>
    <path fill-rule="evenodd" d="M0 0H${dim}V${dim}H0ZM${m} ${m}h${N}v${N}h${-N}Z" fill="${color}" fill-opacity=".12"/>
    <path fill-rule="evenodd" d="M0 0H${dim}V${dim}H0ZM${m} ${m}h${N}v${N}h${-N}Z" fill="url(#qz-h)"/>
    <g stroke="${color}" stroke-width=".12" fill="none"><path d="M${dim / 2} .15V${m - 0.15}M${dim / 2 - 0.35} .15h.7M${dim / 2 - 0.35} ${m - 0.15}h.7"/><path d="M.15 ${dim / 2}H${m - 0.15}M.15 ${dim / 2 - 0.35}v.7M${m - 0.15} ${dim / 2 - 0.35}v.7"/></g>
    <g fill="${color}" font-size="1.5" font-weight="700" font-family="Inter,system-ui,sans-serif"><text x="${dim / 2 + 0.6}" y="${m / 2 + 0.5}">${Math.round(m)}</text><text x="${m / 2 - 0.5}" y="${dim / 2 - 0.7}">${Math.round(m)}</text></g>`
      : "";
  const outline = `<rect x="${m || 0.08}" y="${m || 0.08}" width="${m ? N : dim - 0.16}" height="${m ? N : dim - 0.16}" fill="none" stroke="${color}" stroke-width=".14" stroke-dasharray=".6 .4"/>`;
  ov.innerHTML = `<svg viewBox="0 0 ${dim} ${dim}" preserveAspectRatio="none">${band}${outline}</svg>`;
  ov.classList.add("on");
}

export function renderHealth() {
  const h = computeHealth();
  setBadge(h.tone, h.label);
  renderPopover(h);
  paintMarginScrub();
  if (qzActive) {
    drawQuietZone();
  }
}

export function updateHealthBadge(moduleCount, isEmpty = false) {
  healthCtx.empty = isEmpty;
  healthCtx.N = moduleCount;
  if (isEmpty) {
    healthCtx.fieldErr = "";
    healthCtx.enc = null;
    healthCtx.svg = null;
    scanState = { status: "idle", results: null };
    renderHealth();
  }
}

export function scheduleScan(svg, payload) {
  clearTimeout(scanTimer);
  const token = scanToken;
  scanTimer = setTimeout(async () => {
    try {
      const results = await scanCheck(
        svg,
        payload.replace(/\r\n/gu, "\n"),
        healthCtx.N || 0,
        () => token === scanToken,
        (partial) => {
          if (token !== scanToken) {
            return;
          }
          scanState = { status: "pending", results: partial };
          renderHealth();
        }
      );
      if (results && token === scanToken) {
        scanState = { status: "done", results };
        renderHealth();
      }
    } catch {
      /* keep heuristic badge */
    }
  }, 400);
}

export function initScanHealthListeners(options = {}) {
  const { signal } = options;
  const wrap = document.querySelector("#health-wrap");
  const badge = document.querySelector("#health-badge");
  const pop = document.querySelector("#scan-pop");
  if (wrap) {
    let closeTimer;
    const positionPop = () => {
      if (!(pop && badge)) {
        return;
      }
      const rect = badge.getBoundingClientRect();
      const top = rect.bottom + 8;
      const right = window.innerWidth - rect.right;
      pop.style.position = "fixed";
      pop.style.top = `${Math.round(top)}px`;
      pop.style.right = `${Math.max(12, Math.round(right))}px`;
      pop.style.left = "auto";
      pop.style.maxHeight = `calc(100vh - ${Math.round(top + 16)}px)`;
      pop.style.zIndex = "1000";
    };
    const open = () => {
      clearTimeout(closeTimer);
      positionPop();
      wrap.classList.add("open");
      badge?.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        wrap.classList.remove("open");
        badge?.setAttribute("aria-expanded", "false");
      }, 140);
    };
    wrap.addEventListener("mouseenter", open, { signal });
    wrap.addEventListener("mouseleave", close, { signal });
    wrap.addEventListener("focusin", open, { signal });
    wrap.addEventListener("focusout", close, { signal });

    window.addEventListener(
      "resize",
      () => {
        if (wrap.classList.contains("open")) {
          positionPop();
        }
      },
      { signal }
    );
    window.addEventListener(
      "scroll",
      () => {
        if (wrap.classList.contains("open")) {
          positionPop();
        }
      },
      { signal, passive: true }
    );

    badge?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        const isOpen = wrap.classList.contains("open");
        if (isOpen) {
          clearTimeout(closeTimer);
          wrap.classList.remove("open");
          badge?.setAttribute("aria-expanded", "false");
        } else {
          open();
        }
      },
      { signal }
    );

    wrap.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && wrap.classList.contains("open")) {
          e.preventDefault();
          e.stopPropagation();
          clearTimeout(closeTimer);
          wrap.classList.remove("open");
          badge?.setAttribute("aria-expanded", "false");
          badge?.focus();
        }
      },
      { signal }
    );

    document.addEventListener(
      "click",
      (e) => {
        if (wrap.classList.contains("open") && !wrap.contains(e.target)) {
          clearTimeout(closeTimer);
          wrap.classList.remove("open");
          badge?.setAttribute("aria-expanded", "false");
        }
      },
      { signal }
    );
  }

  const grp = document.querySelector("#group-margin");
  const ov = document.querySelector("#qz-overlay");
  if (grp && ov) {
    const syncQz = () =>
      setTimeout(() => {
        const on = grp.matches(":hover") || grp.matches(":focus-visible");
        if (on === qzActive) {
          return;
        }
        qzActive = on;
        if (on) {
          drawQuietZone();
        } else {
          ov.classList.remove("on");
          ov.dataset.sig = "";
        }
      }, 0);

    for (const ev of ["mouseenter", "mouseleave", "focusin", "focusout"]) {
      grp.addEventListener(ev, syncQz, { signal });
    }

    const tip = document.querySelector("#qz-tip");
    let tipTimer;
    const showTip = () => {
      const dot = grp.querySelector(".qz-dot");
      if (!dot || grp.dataset.rec !== "1" || !tip) {
        return;
      }
      clearTimeout(tipTimer);
      tip.textContent =
        grp.dataset.recKind === "large"
          ? "The code may become too small to scan"
          : "The margins may become too small to scan";
      const r = dot.getBoundingClientRect();
      const w = tip.offsetWidth;
      const left = Math.min(
        window.innerWidth - w - 8,
        Math.max(8, r.right - w + 12)
      );
      tip.style.setProperty("--tip-left", `${left}px`);
      tip.style.setProperty("--tip-top", `${r.bottom + 10}px`);
      tip.style.setProperty("--cx", `${r.left + r.width / 2 - left}px`);
      tip.classList.add("on");
    };
    const hideTip = () => {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => tip?.classList.remove("on"), 100);
    };
    grp.addEventListener(
      "mouseover",
      (e) => {
        if (e.target.closest(".qz-dot")) {
          showTip();
        }
      },
      { signal }
    );
    grp.addEventListener(
      "mouseout",
      (e) => {
        if (e.target.closest(".qz-dot")) {
          hideTip();
        }
      },
      { signal }
    );
  }
}
