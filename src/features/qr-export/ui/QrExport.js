export function renderQrExportActions() {
  return `        <!-- Export Actions Group -->
        <div class="w-preview flex flex-col gap-2 shrink-0">
          <!-- Direct File Downloads -->
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="btn-download-svg" class="btn-tactile h-9 rounded-lg surface-btn-secondary hover:surface-btn-secondary border border-neutral-200 text-neutral-700 font-medium text-xs flex items-center justify-center gap-1.5" title="Download scalable SVG vector file">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>SVG Vector</span>
            </button>
            <button type="button" id="btn-download-png" class="btn-tactile h-9 rounded-lg surface-btn-secondary hover:surface-btn-secondary border border-neutral-200 text-neutral-700 font-medium text-xs flex items-center justify-center gap-1.5" title="Download PNG (2048 px base size, whole pixels per module)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span id="png-size-label">PNG 2048 px</span>
            </button>
          </div>

          <!-- Clipboard Handlers -->
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="btn-copy-svg" class="btn-tactile h-9 rounded-lg surface-panel hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-btn" title="Copy raw SVG markup to clipboard">
              <span class="btn-icon-slot flex items-center justify-center">
                <svg class="w-3.5 h-3.5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </span>
              <span class="btn-label-slot transition-all duration-200">Copy SVG</span>
            </button>
            <button type="button" id="btn-copy-image" class="btn-tactile h-9 rounded-lg surface-panel hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-btn" title="Copy raster image directly into OS clipboard">
              <span class="btn-icon-slot flex items-center justify-center">
                <svg class="w-3.5 h-3.5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
              <span class="btn-label-slot transition-all duration-200">Copy Image</span>
            </button>
          </div>
        </div>`;
}
