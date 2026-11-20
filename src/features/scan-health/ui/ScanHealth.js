export function renderScanHealthBadge() {
  return `        <!-- Readability Status Badge + details popover -->
        <div id="health-wrap" class="health-wrap">
          <button type="button" id="health-badge" aria-expanded="false" aria-controls="scan-pop" aria-haspopup="dialog" aria-label="Scan health status" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium surface-btn-secondary text-neutral-600 border border-neutral-200 select-none cursor-pointer">
            <span class="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
            <span id="health-text">Waiting for content</span>
          </button>
          <div id="scan-pop" class="scan-pop" role="region" aria-label="Scan Quality Details" aria-live="polite"></div>
        </div>`;
}

export function renderQuietZoneTooltip() {
  return `<div id="qz-tip" class="qz-tip" role="tooltip"></div>`;
}
