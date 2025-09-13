// lib/smoothScroll.js
export const NAV_HEIGHT = 64; // h-16

export function smoothScrollTo(
  targetId,
  containerId = "page",
  duration = 600,
  offset = NAV_HEIGHT
) {
  const target = document.getElementById(targetId);
  const container = containerId ? document.getElementById(containerId) : window;
  if (!target || !container) return;

  const containerTop =
    container === window ? window.pageYOffset : container.scrollTop;

  // ใช้ตำแหน่ง relative ต่อ container
  const rectTop = target.offsetTop;
  const end = rectTop - offset;

  // ใช้ native smooth ถ้าได้
  if ("scrollTo" in container) {
    container.scrollTo({ top: end, behavior: "smooth" });
    return;
  }

  // fallback แบบ animate
  const start = containerTop;
  const startTime = performance.now();
  const ease = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function step(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const y = start + (end - start) * ease(p);
    if (container === window) window.scrollTo(0, y);
    else container.scrollTop = y;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
