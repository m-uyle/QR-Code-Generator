import { PNG_EXPORT_PX, SVG_FLUID_ATTRS } from "../config/index.js";

const VIEWBOX_DIM_RE = /viewBox="0 0 (?<dim>[0-9.]+)/u;

export function sizedSvg(svg, px) {
  return svg.replace(SVG_FLUID_ATTRS, ` width="${px}" height="${px}"`);
}

export function svgToCanvas(svgString, size = PNG_EXPORT_PX) {
  return new Promise((resolve, reject) => {
    const dimMatch = svgString.match(VIEWBOX_DIM_RE);
    const dim = Number.parseFloat(dimMatch?.groups?.dim ?? "1") || 1;
    const finalSize = Math.min(
      4096,
      Math.max(dim, Math.round(size / dim) * dim)
    );
    const preparedSvg = sizedSvg(svgString, finalSize);

    const img = new Image();
    const blob = new Blob([preparedSvg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = finalSize;
      canvas.height = finalSize;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, finalSize, finalSize);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, finalSize, finalSize);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve(canvas);
    };

    img.onerror = (e) => {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      reject(e);
    };

    img.src = url;
  });
}

export function downscaleImage(dataUrl, mime, max = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      if (s === 1 && dataUrl.length < 300_000) {
        return resolve(dataUrl);
      }
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(
        c.toDataURL(mime === "image/jpeg" ? "image/jpeg" : "image/png", 0.9)
      );
    };
    img.onerror = () => reject(new Error("unreadable image"));
    img.src = dataUrl;
  });
}

export function checkImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(dataUrl);
    img.onerror = () => reject(new Error("unreadable image"));
    img.src = dataUrl;
  });
}
