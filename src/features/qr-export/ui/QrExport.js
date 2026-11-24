export function renderQrExportActions() {
  return `        <!-- Export Actions Group -->
        <div class="qr-export-box w-full flex flex-col gap-2 shrink-0">
          <!-- Row 1: PNG (Unified Split Button: Download + Copy) -->
          <div class="export-split-btn">
            <button type="button" id="btn-download-png" class="export-btn-download" title="Download PNG">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>PNG</span>
            </button>
            <button type="button" id="btn-copy-image" class="export-btn-copy" title="Copy PNG" aria-label="Copy PNG to clipboard">
              <span class="btn-icon-slot flex items-center justify-center">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
            </button>
          </div>

          <!-- Row 2: SVG (Unified Split Button: Download + Copy) -->
          <div class="export-split-btn">
            <button type="button" id="btn-download-svg" class="export-btn-download" title="Download SVG">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>SVG</span>
            </button>
            <button type="button" id="btn-copy-svg" class="export-btn-copy" title="Copy SVG" aria-label="Copy SVG code to clipboard">
              <span class="btn-icon-slot flex items-center justify-center">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>`;
}
