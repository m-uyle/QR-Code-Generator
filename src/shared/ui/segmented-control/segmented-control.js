const pillObserver = new ResizeObserver((entries) => {
  for (const e of entries) {
    updatePillPosition(e.target, false);
  }
});

export function initSlidingPillTracks() {
  for (const track of document.querySelectorAll(".segmented-track")) {
    let indicator = track.querySelector(".segmented-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "segmented-indicator";
      track.prepend(indicator);
    }
    updatePillPosition(track, false);
    pillObserver.observe(track);
  }
}

export function destroySlidingPillTracks() {
  pillObserver.disconnect();
}

export function updatePillPosition(track, animate = true) {
  if (!track) {
    return;
  }
  const activeBtn = track.querySelector(".segmented-item.active");
  const indicator = track.querySelector(".segmented-indicator");
  if (!indicator) {
    return;
  }

  if (!activeBtn) {
    indicator.classList.add("is-hidden");
    return;
  }

  const w = activeBtn.offsetWidth;
  if (w === 0) {
    requestAnimationFrame(() => updatePillPosition(track, animate));
    return;
  }

  const x = activeBtn.offsetLeft;
  indicator.classList.toggle("no-transition", !animate);
  indicator.style.setProperty("--pill-x", `${x}px`);
  indicator.style.setProperty("--pill-w", `${w}px`);
  indicator.classList.remove("is-hidden");
}

export function updateAllPills(animate = false) {
  for (const track of document.querySelectorAll(".segmented-track")) {
    updatePillPosition(track, animate);
  }
}

export function bindSegmentedKeyboardNavigation(options = {}) {
  const { signal } = options;
  for (const track of document.querySelectorAll(".segmented-track")) {
    track.addEventListener(
      "keydown",
      (e) => {
        const items = [...track.querySelectorAll(".segmented-item")];
        const i = items.indexOf(document.activeElement);
        if (i < 0) {
          return;
        }

        if (e.key === "Home") {
          e.preventDefault();
          const [first] = items;
          first?.focus();
          first?.click();
          return;
        }

        if (e.key === "End") {
          e.preventDefault();
          const last = items.at(-1);
          last?.focus();
          last?.click();
          return;
        }

        const step = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
        }[e.key];
        if (!step) {
          return;
        }
        e.preventDefault();
        const next = items[(i + step + items.length) % items.length];
        next.focus();
        next.click();
      },
      { signal }
    );
  }
}

export function bindSegmentedGroup(
  selector,
  dataAttr,
  onSelect,
  afterSelect,
  options = {}
) {
  const { signal } = options;
  for (const btn of document.querySelectorAll(selector)) {
    btn.addEventListener(
      "click",
      () => {
        const track = btn.closest(".segmented-track");
        if (track) {
          for (const b of track.querySelectorAll(".segmented-item")) {
            b.classList.remove("active");
            b.setAttribute("aria-checked", "false");
          }
        }
        btn.classList.add("active");
        btn.setAttribute("aria-checked", "true");
        if (track) {
          updatePillPosition(track, true);
        }
        if (typeof onSelect === "function") {
          onSelect(btn.dataset[dataAttr]);
        }
        if (typeof afterSelect === "function") {
          afterSelect(btn.dataset[dataAttr]);
        }
      },
      { signal }
    );
  }
}
