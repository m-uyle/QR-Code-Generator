export const STORAGE_KEY = "qr_studio_state_v4";
export const PNG_EXPORT_PX = 2048;
export const PNG_DPI = 300;
export const MAX_LOGO_BYTES = 15 * 1024 * 1024;
export const SVG_FLUID_ATTRS =
  ' width="100%" height="100%" class="w-full h-full block"';

export const QR_VECTOR_TOKENS = {
  paperFill: "#FFFFFF",
  moduleFill: "#000000",
};

export function getMotionTokens() {
  const cs = getComputedStyle(document.documentElement);
  const ms = (name, d) => {
    const v = cs.getPropertyValue(name).trim();
    if (v.endsWith("ms")) {
      return Number.parseFloat(v);
    }
    if (v.endsWith("s")) {
      return Number.parseFloat(v) * 1000;
    }
    return d;
  };
  return {
    fast: ms("--dur-fast", 140),
    base: ms("--dur-base", 220),
    slow: ms("--dur-slow", 360),
  };
}

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
