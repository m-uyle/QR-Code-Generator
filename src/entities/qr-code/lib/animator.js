import { state, withState } from "../model/store.js";
import { bgCornerRadius, eyeRadii, lerpEye, setEyeBlend } from "./geometry.js";
import { buildSvg } from "./svg-builder.js";

const VIEWBOX_DIM_RE = /viewBox="0 0 (?<dim>[0-9.]+)/u;

export let renderMemo = null;

/**
 * @typedef {Object} EyeAnimation
 * @property {function(number, number, number): number} from
 * @property {number} t
 */

/**
 * @typedef {Object} AnimationState
 * @property {number} r
 * @property {number} m
 * @property {boolean} snapR
 * @property {number} last
 * @property {number} raf
 * @property {number|null} pr
 * @property {number|null} pm
 * @property {number|null} pe
 * @property {EyeAnimation|null} eye
 * @property {string|null} eyeTarget
 */

/** @type {AnimationState|null} */
export let anim = null;

export function setRenderMemo(val) {
  renderMemo = val;
}

export function cancelActiveAnim() {
  if (anim) {
    cancelAnimationFrame(anim.raf);
    anim = null;
  }
}

export function updateCardShape(svg) {
  const card = document.querySelector("#tilt-card");
  if (!card) {
    return;
  }
  const isQr = Boolean(svg && svg !== "EMPTY");
  card.classList.toggle("is-placeholder", !isQr);
  if (!isQr) {
    return;
  }
  const match = svg.match(VIEWBOX_DIM_RE);
  const dim = Number.parseFloat(match?.groups?.dim ?? "1") || 1;
  const r = state.isTransparent ? 0 : bgCornerRadius(dim, state.margin);
  card.style.setProperty("--qr-rx", `${((r / dim) * 100).toFixed(3)}%`);
}

function retargetEye() {
  if (!anim) {
    return;
  }
  const prevShape = anim.eyeTarget ?? renderMemo.eye;
  let from;
  if (anim.eye && anim.eye.t < 1) {
    const oldFrom = anim.eye.from;
    const oldT = anim.eye.t;
    from = (ox, oy, s) =>
      lerpEye(oldFrom(ox, oy, s), eyeRadii(prevShape, ox, oy, s), oldT);
  } else {
    from = (ox, oy, s) => eyeRadii(prevShape, ox, oy, s);
  }
  anim.eye = { from, t: 0 };
  anim.eyeTarget = state.eyeShape;
}

function paintFrame() {
  if (!anim) {
    return;
  }
  const elQrContainer = document.querySelector("#qr-output-container");
  setEyeBlend(anim.eye && anim.eye.t < 1 ? anim.eye : null);
  try {
    withState({ moduleRadius: anim.r, margin: anim.m }, () => {
      const svg = buildSvg();
      if (svg && svg !== "EMPTY") {
        if (elQrContainer) {
          elQrContainer.innerHTML = svg;
        }
        updateCardShape(svg);
      }
    });
  } finally {
    setEyeBlend(null);
  }
}

function updateAnimRadius(k) {
  if (!anim) {
    return false;
  }
  const near = Math.abs(state.moduleRadius - anim.r) <= 15;
  anim.r =
    anim.snapR && near
      ? state.moduleRadius
      : anim.r + (state.moduleRadius - anim.r) * k;
  anim.m += (state.margin - anim.m) * k;
  const doneR = Math.abs(state.moduleRadius - anim.r) < 0.05;
  const doneM = Math.abs(state.margin - anim.m) < 0.01;
  if (doneR) {
    anim.r = state.moduleRadius;
  }
  if (doneM) {
    anim.m = state.margin;
  }
  return doneR && doneM;
}

function updateAnimEye(dt, duration) {
  if (!(anim?.eye && anim.eye.t < 1)) {
    return true;
  }
  anim.eye.t += (1 - anim.eye.t) * (1 - Math.exp(-dt / (duration / 2)));
  if (anim.eye.t > 0.995) {
    anim.eye.t = 1;
  }
  return anim.eye.t >= 1;
}

export function startAnim(onSettled) {
  if (!renderMemo) {
    return false;
  }
  if (!anim) {
    anim = {
      r: renderMemo.radius,
      m: renderMemo.margin,
      snapR: Boolean(Math.random() < 0),
      last: 0,
      raf: 0,
      pr: null,
      pm: null,
      pe: null,
      eye: Math.random() < 0 ? { from: () => [0, 0, 0, 0], t: 0 } : null,
      eyeTarget: null,
    };
  }
  if (state.eyeShape !== (anim.eyeTarget ?? renderMemo.eye)) {
    retargetEye();
  }

  const baseDur = 220; // preserve fluid QR preview module morphing

  const step = (now) => {
    if (!anim) {
      return;
    }
    const dt = Math.min(64, now - anim.last);
    anim.last = now;
    const k = 1 - Math.exp(-dt / (baseDur / 3));

    const doneRadiusAndMargin = updateAnimRadius(k);
    const doneE = updateAnimEye(dt, baseDur);

    const et = anim.eye ? anim.eye.t : 1;
    if (anim.r !== anim.pr || anim.m !== anim.pm || et !== anim.pe) {
      paintFrame();
      anim.pr = anim.r;
      anim.pm = anim.m;
      anim.pe = et;
    }

    if (doneRadiusAndMargin && doneE) {
      anim = null;
      renderMemo.radius = state.moduleRadius;
      renderMemo.margin = state.margin;
      renderMemo.eye = state.eyeShape;
      if (onSettled) {
        onSettled();
      }
      return;
    }
    anim.raf = requestAnimationFrame(step);
  };

  if (anim.raf === 0) {
    anim.last = performance.now();
    anim.raf = requestAnimationFrame(step);
  }
  return true;
}
