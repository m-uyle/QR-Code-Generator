import {
  buildSvg,
  PLAIN_STYLE,
  withState,
} from "../../../entities/qr-code/index.js";
import { getJsQr, JSQR_SOURCE } from "../../../shared/lib/jsqr-engine.js";
import { svgToCanvas } from "../../../shared/lib/rasterizer.js";

const VIEWBOX_DIM_RE = /viewBox="0 0 (?<dim>[0-9.]+)/u;

const SCAN_PHASES = [
  [0, 0],
  [0.37, 0.61],
  [0.71, 0.29],
];
export const SCAN_VARIANTS = [
  { name: "clean", ppms: [8, 5, 6.5, 10] },
  { name: "low-res", ppms: [2.6, 3, 3.4], need: 2 },
  { name: "blurred", ppms: [6], blur: true },
  { name: "tilted", ppms: [6], tilt: 7 },
];

function toGray(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const d = canvas
    .getContext("2d", { willReadFrequently: true })
    .getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 1) {
    const a = d[i + 3] / 255;
    g[j] =
      (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * a +
      255 * (1 - a);
  }
  return { g, w, h };
}

function rotateGray({ g, w, h }, deg) {
  const W = Math.round(w * 1.25);
  const H = Math.round(h * 1.25);
  const out = new Float32Array(W * H).fill(255);
  const c = Math.cos((-deg * Math.PI) / 180);
  const s = Math.sin((-deg * Math.PI) / 180);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const dx = x - W / 2;
      const dy = y - H / 2;
      const sx = c * dx - s * dy + w / 2;
      const sy = s * dx + c * dy + h / 2;
      if (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1) {
        continue;
      }
      const x0 = Math.trunc(sx);
      const y0 = Math.trunc(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const i = y0 * w + x0;
      out[y * W + x] =
        g[i] * (1 - fx) * (1 - fy) +
        g[i + 1] * fx * (1 - fy) +
        g[i + w] * (1 - fx) * fy +
        g[i + w + 1] * fx * fy;
    }
  }
  return { g: out, w: W, h: H };
}

function boxResample({ g, w, h }, factor, ox, oy) {
  const dw = Math.floor(w / factor);
  const dh = Math.floor(h / factor);
  const out = new Float32Array(dw * dh);
  const area = factor * factor;
  for (let y = 0; y < dh; y += 1) {
    const y0 = (y - oy) * factor;
    const y1 = y0 + factor;
    for (let x = 0; x < dw; x += 1) {
      const x0 = (x - ox) * factor;
      const x1 = x0 + factor;
      let acc = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy += 1) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx += 1) {
          const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);
          acc +=
            (sx < 0 || sy < 0 || sx >= w || sy >= h ? 255 : g[sy * w + sx]) *
            wx *
            wy;
        }
      }
      out[y * dw + x] = acc / area;
    }
  }
  return { g: out, w: dw, h: dh };
}

function blurAndFade({ g, w, h }) {
  let a = g;
  for (let pass = 0; pass < 2; pass += 1) {
    const t = new Float32Array(w * h);
    const o = new Float32Array(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        t[y * w + x] =
          (a[y * w + Math.max(0, x - 1)] +
            a[y * w + x] +
            a[y * w + Math.min(w - 1, x + 1)]) /
          3;
      }
    }
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        o[y * w + x] =
          (t[Math.max(0, y - 1) * w + x] +
            t[y * w + x] +
            t[Math.min(h - 1, y + 1) * w + x]) /
          3;
      }
    }
    a = o;
  }
  return {
    g: a.map((v) => Math.min(255, Math.max(0, ((v - 128) * 0.55 + 128) * 1.2))),
    w,
    h,
  };
}

function decodeCore({ g, w, h }, expected) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, j = 0; i < g.length; i += 1, j += 4) {
    rgba[j] = g[i];
    rgba[j + 1] = g[i];
    rgba[j + 2] = g[i];
    rgba[j + 3] = 255;
  }
  const qrEngine =
    globalThis.jsQR || (typeof getJsQr === "function" ? getJsQr() : null);
  const r = qrEngine
    ? qrEngine(rgba, w, h, { inversionAttempts: "dontInvert" })
    : null;
  return !!r && r.data.replace(/\r\n/gu, "\n") === expected;
}

async function decodeGray(img, expected) {
  const jsQR = getJsQr();
  if (jsQR && decodeCore(img, expected)) {
    return true;
  }
  if (!("BarcodeDetector" in window)) {
    return false;
  }
  try {
    const { g, w, h } = img;
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < g.length; i += 1, j += 4) {
      rgba[j] = g[i];
      rgba[j + 1] = g[i];
      rgba[j + 2] = g[i];
      rgba[j + 3] = 255;
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").putImageData(new ImageData(rgba, w, h), 0, 0);
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const r = await detector.detect(c);
    return !!r[0] && String(r[0].rawValue).replace(/\r\n/gu, "\n") === expected;
  } catch {
    return false;
  }
}

async function runVariant(
  src,
  dim,
  v,
  expected,
  decode = decodeGray,
  phases = SCAN_PHASES
) {
  const base = v.tilt ? rotateGray(src, v.tilt) : src;
  const srcPpm = src.w / dim;
  const sizes = [
    ...new Set(v.ppms.map((p) => Number(Math.min(p, srcPpm).toFixed(2)))),
  ];
  const need = Math.min(v.need || 1, sizes.length);
  let hits = 0;
  for (const ppm of sizes) {
    const factor = srcPpm / ppm;
    for (const [ox, oy] of phases) {
      let img = boxResample(base, factor, ox, oy);
      if (v.blur) {
        img = blurAndFade(img);
      }
      // biome-ignore lint/performance/noAwaitInLoops: sequential early exit scan passes
      if (await decode(img, expected)) {
        hits += 1;
        break;
      }
    }
    if (hits >= need) {
      return true;
    }
  }
  return false;
}

const WORKER_GLUE = `
const cancelled = new Set();
let refWait = null;
onmessage = async (e) => {
  const m = e.data;
  if (m.type === 'cancel') { cancelled.add(m.id); return; }
  if (m.type === 'ref') { if (refWait) refWait(m); return; }
  if (m.type !== 'scan') return;
  const styled = { g: new Float32Array(m.g), w: m.w, h: m.h };
  let ref = null;
  if (m.probe) {
    postMessage({ type: 'needRef', id: m.id });
    const r = await new Promise((res) => { refWait = res; });
    refWait = null;
    ref = { g: new Float32Array(r.g), w: r.w, h: r.h };
    const sp = ref.w / m.dim;
    const readable = [5, 8, 6.5].some((ppm) => decodeCore(boxResample(ref, sp / Math.min(ppm, sp), 0, 0), m.expected));
    if (!readable) {
      postMessage({ type: 'done', id: m.id, results: m.variants.map((v) => ({ name: v.name, ok: false, conclusive: false })) });
      return;
    }
  }
  const results = [];
  const t0 = Date.now();
  let giveUp = false;
  for (const v of m.variants) {
    await new Promise((r) => setTimeout(r));
    if (cancelled.has(m.id)) { cancelled.delete(m.id); postMessage({ type: 'cancelled', id: m.id }); return; }
    if (giveUp || Date.now() - t0 > 5000) {
      results.push({ name: v.name, ok: false, conclusive: false });
      postMessage({ type: 'step', id: m.id, results: results.slice() });
      continue;
    }
    const ok = await runVariant(styled, m.dim, v, m.expected, decodeCore, m.phases);
    let conclusive = true;
    if (!ok) {
      if (!ref) {
        postMessage({ type: 'needRef', id: m.id });
        const r = await new Promise((res) => { refWait = res; });
        refWait = null;
        ref = { g: new Float32Array(r.g), w: r.w, h: r.h };
      }
      conclusive = await runVariant(ref, m.dim, v, m.expected, decodeCore, m.phases);
      if (!conclusive && results.length === 0) giveUp = true;
    }
    results.push({ name: v.name, ok, conclusive });
    postMessage({ type: 'step', id: m.id, results: results.slice() });
  }
  postMessage({ type: 'done', id: m.id, results });
};`;

function buildWorkerSource() {
  const fns = [rotateGray, boxResample, blurAndFade, decodeCore, runVariant]
    .map((f) => f.toString())
    .join("\n");
  return `const SCAN_PHASES = ${JSON.stringify(SCAN_PHASES)};\n${fns}\n${WORKER_GLUE}`;
}

let scanWorker = null;
let scanWorkerOff = false;
let jobSeq = 0;
const scanJobs = new Map();

function failWorker(err) {
  scanWorkerOff = true;
  if (scanWorker) {
    scanWorker.terminate();
    scanWorker = null;
  }
  for (const j of scanJobs.values()) {
    j.error(err);
  }
  scanJobs.clear();
}

function getScanWorker() {
  if (scanWorkerOff) {
    return null;
  }
  if (scanWorker) {
    return scanWorker;
  }
  try {
    const lib = document.querySelector("#jsqr-src")?.textContent || JSQR_SOURCE;
    const url = URL.createObjectURL(
      new Blob([`${lib}\n${buildWorkerSource()}`], { type: "text/javascript" })
    );
    const w = new Worker(url);
    URL.revokeObjectURL(url);
    w.onmessage = (e) => {
      const m = e.data;
      const job = scanJobs.get(m.id);
      if (!job) {
        return;
      }
      if (m.type === "step") {
        job.step(m.results);
      } else if (m.type === "needRef") {
        job.needRef();
      } else if (m.type === "done") {
        job.done(m.results);
      } else if (m.type === "cancelled") {
        job.cancelled();
      }
    };
    w.onerror = (err) => failWorker(err);
    scanWorker = w;
    return w;
  } catch {
    scanWorkerOff = true;
    return null;
  }
}

function scanInWorker(
  worker,
  styled,
  dim,
  expected,
  moduleCount,
  isCurrent,
  onStep,
  makeRef
) {
  return new Promise((resolve, reject) => {
    jobSeq += 1;
    const id = jobSeq;
    const timer = setTimeout(() => {
      scanJobs.delete(id);
      if (scanWorker) {
        scanWorker.terminate();
        scanWorker = null;
      }
      reject(new Error("scan worker timeout"));
    }, 15_000);
    const end = (fn) => (v) => {
      clearTimeout(timer);
      scanJobs.delete(id);
      fn(v);
    };
    scanJobs.set(id, {
      step: (results) => {
        if (!isCurrent()) {
          worker.postMessage({ type: "cancel", id });
        } else if (onStep) {
          onStep(results);
        }
      },
      needRef: async () => {
        try {
          const ref = await makeRef();
          const buf = ref.g.buffer.slice(0);
          worker.postMessage({ type: "ref", id, g: buf, w: ref.w, h: ref.h }, [
            buf,
          ]);
        } catch (err) {
          end(reject)(err);
        }
      },
      done: end(resolve),
      cancelled: end(() => resolve(null)),
      error: end(reject),
    });
    const copy = styled.g.slice();
    const phases = moduleCount >= 90 ? SCAN_PHASES.slice(0, 2) : SCAN_PHASES;
    worker.postMessage(
      {
        type: "scan",
        id,
        dim,
        expected,
        variants: SCAN_VARIANTS,
        probe: moduleCount >= 90,
        phases,
        g: copy.buffer,
        w: styled.w,
        h: styled.h,
      },
      [copy.buffer]
    );
  });
}

async function checkProbeReadable(makeRef, dim, expected) {
  const ref = await makeRef();
  const sp = ref.w / dim;
  const readable = [5, 8, 6.5].some((ppm) =>
    decodeCore(boxResample(ref, sp / Math.min(ppm, sp), 0, 0), expected)
  );
  return { readable, ref };
}

async function evaluateScanVariant(
  v,
  styled,
  dim,
  expected,
  phases,
  currentRef,
  makeRef,
  resultsLength
) {
  const ok = await runVariant(styled, dim, v, expected, decodeGray, phases);
  let conclusive = true;
  let updatedRef = currentRef;
  let giveUp = false;
  if (!ok) {
    if (!updatedRef) {
      updatedRef = await makeRef();
    }
    conclusive = await runVariant(
      updatedRef,
      dim,
      v,
      expected,
      decodeGray,
      phases
    );
    if (!conclusive && resultsLength === 0) {
      giveUp = true;
    }
  }
  return { ok, conclusive, ref: updatedRef, giveUp };
}

async function scanInMainThread(
  styled,
  dim,
  expected,
  moduleCount,
  isCurrent,
  onStep,
  makeRef,
  phases
) {
  let ref = null;
  if (moduleCount >= 90) {
    const probe = await checkProbeReadable(makeRef, dim, expected);
    if (!probe.readable) {
      return SCAN_VARIANTS.map((v) => ({
        name: v.name,
        ok: false,
        conclusive: false,
      }));
    }
    ({ ref } = probe);
  }
  const results = [];
  let giveUp = false;
  for (const v of SCAN_VARIANTS) {
    // biome-ignore lint/performance/noAwaitInLoops: frame yield
    await new Promise((r) => setTimeout(r));
    if (!isCurrent()) {
      return null;
    }
    if (giveUp) {
      results.push({ name: v.name, ok: false, conclusive: false });
      if (onStep) {
        onStep(results.slice());
      }
      continue;
    }
    const evalResult = await evaluateScanVariant(
      v,
      styled,
      dim,
      expected,
      phases,
      ref,
      makeRef,
      results.length
    );
    ({ ref } = evalResult);
    if (evalResult.giveUp) {
      giveUp = true;
    }
    results.push({
      name: v.name,
      ok: evalResult.ok,
      conclusive: evalResult.conclusive,
    });
    if (onStep) {
      onStep(results.slice());
    }
  }
  return results;
}

export async function scanCheck(svg, expected, moduleCount, isCurrent, onStep) {
  const match = svg.match(VIEWBOX_DIM_RE);
  const dim = Number.parseFloat(match?.groups?.dim ?? "0");
  const size = Math.min(
    moduleCount >= 90 ? 850 : 1100,
    Math.max(480, dim * 12)
  );
  const grab = async (s) => toGray(await svgToCanvas(s, size));
  const styled = await grab(svg);
  const makeRef = () => grab(withState(PLAIN_STYLE, () => buildSvg(true)));
  const worker = getScanWorker();
  if (worker) {
    try {
      return await scanInWorker(
        worker,
        styled,
        dim,
        expected,
        moduleCount,
        isCurrent,
        onStep,
        makeRef
      );
    } catch (err) {
      if (!isCurrent()) {
        return null;
      }
      if (err instanceof Error && err.message === "scan worker timeout") {
        return SCAN_VARIANTS.map((v) => ({
          name: v.name,
          ok: false,
          conclusive: false,
        }));
      }
      scanWorkerOff = true;
    }
  }
  const phases = moduleCount >= 90 ? SCAN_PHASES.slice(0, 2) : SCAN_PHASES;
  return scanInMainThread(
    styled,
    dim,
    expected,
    moduleCount,
    isCurrent,
    onStep,
    makeRef,
    phases
  );
}
