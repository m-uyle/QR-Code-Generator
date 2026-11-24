import { buildSvg, fileBase } from "../../../entities/qr-code/index.js";
import { PNG_DPI, PNG_EXPORT_PX } from "../../../shared/config/index.js";
import { setPngDpi } from "../../../shared/lib/png-dpi.js";
import { sizedSvg, svgToCanvas } from "../../../shared/lib/rasterizer.js";
import { yieldToMain } from "../../../shared/lib/scheduler.js";
import { morphButtonToSuccess } from "../../../shared/ui/morph-button/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";

const VIEWBOX_DIM_RE = /viewBox="0 0 (?<dim>[0-9.]+)/u;

export function updatePngLabel(svg) {
  const match = svg.match(VIEWBOX_DIM_RE);
  const dim = Number.parseFloat(match?.groups?.dim ?? "0");
  if (!dim) {
    return;
  }
  const px = Math.max(dim, Math.round(PNG_EXPORT_PX / dim) * dim);
  const btn = document.querySelector("#btn-download-png");
  if (btn) {
    btn.title = `Download PNG: ${px} × ${px} px (${px / dim} px per module)`;
  }
}

async function writeImageBlobToClipboard(blob) {
  if (!(navigator.clipboard && window.ClipboardItem)) {
    return false;
  }
  try {
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    try {
      const item = new ClipboardItem({
        "image/png": Promise.resolve(blob),
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch {
      return false;
    }
  }
}

export function initQrExport(options = {}) {
  const { signal } = options;
  const btnDownloadSvg = document.querySelector("#btn-download-svg");
  if (btnDownloadSvg) {
    btnDownloadSvg.addEventListener(
      "click",
      () => {
        const svgCode = buildSvg();
        if (!svgCode || svgCode === "EMPTY") {
          showToast("No content to download");
          return;
        }
        const blob = new Blob([sizedSvg(svgCode, 1024)], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileBase()}.svg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        showToast("Downloaded SVG vector");
      },
      { signal }
    );
  }

  const btnDownloadPng = document.querySelector("#btn-download-png");
  if (btnDownloadPng) {
    btnDownloadPng.addEventListener(
      "click",
      async () => {
        try {
          await yieldToMain();
          const svgCode = buildSvg();
          if (!svgCode || svgCode === "EMPTY") {
            showToast("No content to download");
            return;
          }
          const canvas = await svgToCanvas(svgCode, PNG_EXPORT_PX);
          canvas.toBlob(async (blob) => {
            if (!blob) {
              return;
            }
            const dpiBlob = await setPngDpi(blob, PNG_DPI);
            const url = URL.createObjectURL(dpiBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileBase()}-${canvas.width}px.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            showToast(`Downloaded PNG ${canvas.width} x ${canvas.height} px`);
          }, "image/png");
        } catch {
          showToast("Rasterization error");
        }
      },
      { signal }
    );
  }

  const btnCopySvg = document.querySelector("#btn-copy-svg");
  if (btnCopySvg) {
    btnCopySvg.addEventListener(
      "click",
      async () => {
        const svgCode = buildSvg();
        if (!svgCode || svgCode === "EMPTY") {
          showToast("No content to copy");
          return;
        }
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(sizedSvg(svgCode, 1024));
            morphButtonToSuccess(btnCopySvg, "Copy SVG");
            showToast("SVG copied to clipboard");
          } else {
            const ta = document.createElement("textarea");
            ta.value = sizedSvg(svgCode, 1024);
            ta.className = "sr-clipboard-fallback";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            morphButtonToSuccess(btnCopySvg, "Copy SVG");
            showToast("SVG copied to clipboard");
          }
        } catch {
          showToast("Copying failed");
        }
      },
      { signal }
    );
  }

  const btnCopyImg = document.querySelector("#btn-copy-image");
  if (btnCopyImg) {
    btnCopyImg.addEventListener(
      "click",
      async () => {
        try {
          await yieldToMain();
          const svgCode = buildSvg();
          if (!svgCode || svgCode === "EMPTY") {
            showToast("No content to copy");
            return;
          }
          const canvas = await svgToCanvas(svgCode, 1024);
          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          if (!blob) {
            showToast("Raster generation failed");
            return;
          }

          const copied = await writeImageBlobToClipboard(blob);
          if (copied) {
            morphButtonToSuccess(btnCopyImg, "Copy Image");
            showToast("Image copied to clipboard");
            return;
          }
          showToast("Image clipboard unsupported: please download PNG");
        } catch {
          showToast("Clipboard restricted: please download PNG");
        }
      },
      { signal }
    );
  }
}
