export function setup3DTilt(options = {}) {
  const { signal } = options;
  const container = document.querySelector("#tilt-container");
  const card = document.querySelector("#tilt-card");
  if (!(container && card)) {
    return () => undefined;
  }

  const maxTilt = 6.5;
  let targetX = 0;
  let targetY = 0;
  let targetScale = 1;
  let targetZ = 0;
  let currentX = 0;
  let currentY = 0;
  let currentScale = 1;
  let currentZ = 0;
  let isHovered = false;
  let isPressed = false;
  let rafId = null;

  function update() {
    const ease = 0.09;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    currentScale += (targetScale - currentScale) * ease;
    currentZ += (targetZ - currentZ) * ease;

    const diff =
      Math.abs(targetX - currentX) +
      Math.abs(targetY - currentY) +
      Math.abs(targetScale - currentScale) +
      Math.abs(targetZ - currentZ);

    if (diff > 0.001) {
      card.style.setProperty("--tilt-rx", `${currentX.toFixed(3)}deg`);
      card.style.setProperty("--tilt-ry", `${currentY.toFixed(3)}deg`);
      card.style.setProperty("--tilt-tz", `${currentZ.toFixed(2)}px`);
      card.style.setProperty("--tilt-scale", currentScale.toFixed(4));

      const shadowX = (-currentY * 0.85).toFixed(1);
      const pressOffsetY = isPressed ? 10 : 20;
      const shadowY = (currentX * 0.95 + pressOffsetY).toFixed(1);
      const blurRadius = isPressed ? 22 : 38;
      const shadowAlpha = isPressed ? 0.09 : 0.12 + (currentScale - 1) * 2.2;
      const shadowA = Math.max(0.06, shadowAlpha).toFixed(3);

      card.style.setProperty("--tilt-sx", `${shadowX}px`);
      card.style.setProperty("--tilt-sy", `${shadowY}px`);
      card.style.setProperty(
        "--tilt-blur",
        `${(blurRadius + Math.abs(currentX) * 0.8).toFixed(1)}px`
      );
      card.style.setProperty(
        "--tilt-sa",
        `rgba(0, 0, 0, ${(shadowA * 0.45).toFixed(3)})`
      );
      card.style.setProperty(
        "--tilt-sb",
        `rgba(0, 0, 0, ${(shadowA * 0.7).toFixed(3)})`
      );

      const glanceY = (50 - currentX * 3.5).toFixed(1);
      const glanceX = (50 + currentY * 3.5).toFixed(1);
      card.style.setProperty("--glance-x", `${glanceX}%`);
      card.style.setProperty("--glance-y", `${glanceY}%`);

      const glanceAlpha = Math.max(
        0,
        Math.min(
          0.18,
          (Math.abs(currentX) + Math.abs(currentY)) * 0.012 +
            (isHovered ? 0.05 : 0)
        )
      ).toFixed(3);
      card.style.setProperty("--glance-a", glanceAlpha);

      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  }

  const handleMove = (e) => {
    isHovered = true;
    targetScale = isPressed ? 0.982 : 1.012;
    targetZ = isPressed ? -10 : 0;
    const rect = container.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    targetX = ((relY - centerY) / centerY) * -maxTilt;
    targetY = ((relX - centerX) / centerX) * maxTilt;

    startLoop();
  };

  const handleLeave = () => {
    isHovered = false;
    isPressed = false;
    targetX = 0;
    targetY = 0;
    targetScale = 1;
    targetZ = 0;
    startLoop();
  };

  container.addEventListener(
    "mouseenter",
    () => {
      isHovered = true;
      targetScale = isPressed ? 0.982 : 1.012;
      targetZ = isPressed ? -10 : 0;
      startLoop();
    },
    { signal }
  );
  container.addEventListener("mousemove", handleMove, { signal });
  container.addEventListener("mouseleave", handleLeave, { signal });

  card.addEventListener(
    "mousedown",
    (e) => {
      if (e.button !== 0) {
        return;
      }
      isPressed = true;
      targetScale = 0.982;
      targetZ = -10;
      startLoop();
    },
    { signal }
  );

  const releasePress = () => {
    if (isPressed) {
      isPressed = false;
      targetScale = isHovered ? 1.012 : 1;
      targetZ = 0;
      startLoop();
    }
  };

  window.addEventListener("mouseup", releasePress, { signal });

  const destroy = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener("mouseup", releasePress);
  };

  signal?.addEventListener("abort", destroy, { once: true });
  return destroy;
}
