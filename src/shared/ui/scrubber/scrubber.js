export function paintScrubEl(s, p01, text) {
  s.style.setProperty("--p01", p01.toFixed(4));
  const val = s.querySelector(".scrub-value");
  if (!val.querySelector("input")) {
    const b = val.querySelector("b");
    if (b) {
      b.textContent = String(text);
    }
  }
  const lab = s.querySelector(".scrub-label");
  const fillRight = 3 + (s.clientWidth - 6) * p01;
  const hx = fillRight - 7;
  const under = (el) =>
    Boolean(
      el && hx > el.offsetLeft - 6 && hx < el.offsetLeft + el.offsetWidth + 6
    );
  s.classList.toggle(
    "no-handle",
    fillRight - 3 < 12 || under(lab) || under(val)
  );
}

export function makeScrubber(el, o = {}) {
  const controller = new AbortController();
  const signal = o.signal || controller.signal;

  const fromPointer = (e) => {
    const r = el.getBoundingClientRect();
    const v = Math.min(
      o.max,
      Math.max(0, ((e.clientX - r.left) / r.width) * o.max)
    );
    if (o.step) {
      return Math.min(o.max, Math.max(0, Math.round(v / o.step) * o.step));
    }
    if (o.int) {
      return Math.round(v);
    }
    if (!o.magnet) {
      return v;
    }
    const n = Math.round(v);
    const d = v - n;
    return n + 2 * d * Math.abs(d);
  };
  const label = el.querySelector(".scrub-label");
  const onLabel = (e) => {
    if (!label) {
      return false;
    }
    const r = label.getBoundingClientRect();
    return (
      e.clientX >= r.left - 4 &&
      e.clientX <= r.right + 4 &&
      e.clientY >= r.top - 4 &&
      e.clientY <= r.bottom + 4
    );
  };
  let dragging = false;
  let startValue = 0;
  let pendingX = null;
  let activePointerId = null;

  const finish = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (activePointerId !== null) {
      try {
        if (el.hasPointerCapture?.(activePointerId)) {
          el.releasePointerCapture(activePointerId);
        }
      } catch {
        // Safe DOMException guard for interrupted touch gestures
      }
      activePointerId = null;
    }
    if (o.onHoldChange) {
      o.onHoldChange(false);
    }
    el.classList.remove("dragging");
    document.body.classList.remove("is-scrubbing");
    if (o.onFinish) {
      o.onFinish();
    }
  };

  el.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0 || e.target.closest("input")) {
        return;
      }
      e.preventDefault();
      el.focus({ preventScroll: true });
      activePointerId = e.pointerId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      dragging = true;
      if (o.onHoldChange) {
        o.onHoldChange(true);
      }
      startValue = o.get();
      el.classList.add("dragging");
      document.body.classList.add("is-scrubbing");
      if (onLabel(e)) {
        pendingX = e.clientX;
      } else {
        pendingX = null;
        o.set(fromPointer(e), true);
      }
    },
    { signal }
  );

  el.addEventListener(
    "pointermove",
    (e) => {
      if (!dragging) {
        return;
      }
      if (pendingX !== null) {
        if (Math.abs(e.clientX - pendingX) < 4) {
          return;
        }
        pendingX = null;
      }
      o.set(fromPointer(e), true);
    },
    { signal }
  );

  el.addEventListener("pointerup", finish, { signal });
  el.addEventListener("pointercancel", finish, { signal });

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || !dragging) {
        return;
      }
      e.preventDefault();
      o.set(startValue, false);
      finish();
    },
    { capture: true, signal }
  );

  el.addEventListener(
    "keydown",
    (e) => {
      if (e.target.closest("input")) {
        return;
      }
      const step = e.shiftKey ? o.big : o.step || 1;
      const cur = Math.round(o.get());
      const d = {
        ArrowRight: step,
        ArrowUp: step,
        ArrowLeft: -step,
        ArrowDown: -step,
        PageUp: o.big,
        PageDown: -o.big,
      }[e.key];
      if (d !== undefined) {
        e.preventDefault();
        o.set(cur + d, false);
      } else if (e.key === "Home") {
        e.preventDefault();
        o.set(0, false);
      } else if (e.key === "End") {
        e.preventDefault();
        o.set(o.max, false);
      }
    },
    { signal }
  );

  let wheelAcc = 0;
  let wheelTimer = 0;
  el.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) {
        return;
      }
      e.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelAcc = 0;
      }, 250);
      wheelAcc += (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 33 : 1);
      const n = Math.trunc(wheelAcc / 60);
      if (!n) {
        return;
      }
      wheelAcc -= n * 60;
      o.set(Math.round(o.get()) - n * (e.shiftKey ? o.big : 1), false);
    },
    { passive: false, signal }
  );

  el.addEventListener(
    "dblclick",
    (e) => {
      if (e.target.closest("input")) {
        return;
      }
      if (onLabel(e)) {
        o.set(o.def, false);
        return;
      }
      const val = el.querySelector(".scrub-value");
      const inp = Object.assign(document.createElement("input"), {
        type: "number",
        min: 0,
        max: o.max,
        step: 1,
        className: "scrub-input",
        value: Math.round(o.get()),
      });
      val.replaceChildren(inp);
      inp.focus();
      inp.select();
      let finished = false;
      const done = (commit) => {
        if (finished) {
          return;
        }
        finished = true;
        const n = Number.parseFloat(inp.value);
        inp.remove();
        val.replaceChildren(
          document.createElement("b"),
          Object.assign(document.createElement("small"), {
            textContent: val.dataset.unit || "",
          })
        );
        if (commit && !Number.isNaN(n)) {
          o.set(n, false);
        }
        if (o.onRepaint) {
          o.onRepaint();
        }
      };
      inp.addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Enter") {
          ev.preventDefault();
          done(true);
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          done(false);
        }
      });
      inp.addEventListener("blur", () => done(true));
    },
    { signal }
  );

  return {
    destroy: () => {
      clearTimeout(wheelTimer);
      controller.abort();
    },
  };
}
