export const STORAGE_KEY = "qr_studio_state_v4";
export const PNG_EXPORT_PX = 2048;
export const PNG_DPI = 300;
export const MAX_LOGO_BYTES = 15 * 1024 * 1024;
export const SVG_FLUID_ATTRS =
  ' width="100%" height="100%" class="w-full h-full block" role="img" aria-label="Generated QR Code"';

export const QR_VECTOR_TOKENS = {
  paperFill: "#FFFFFF",
  moduleFill: "#000000",
};

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
