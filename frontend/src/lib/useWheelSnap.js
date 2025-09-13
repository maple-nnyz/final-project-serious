// lib/useWheelSnap.js
import { useEffect, useRef } from "react";
import { smoothScrollTo, NAV_HEIGHT } from "./smoothScroll";

export default function useWheelSnap(
  sectionIds,
  duration = 600,
  threshold = 60,
  containerId = "page"
) {
  const animating = useRef(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const onWheel = (e) => {
      if (animating.current) return;
      if (Math.abs(e.deltaY) < threshold) return;

      const scrollY = container.scrollTop + NAV_HEIGHT + 1;
      const tops = sectionIds.map((id) => {
        const el = document.getElementById(id);
        return el ? el.offsetTop : 0;
      });

      let idx = 0;
      for (let i = 0; i < tops.length; i++) if (scrollY >= tops[i]) idx = i;

      const dir = e.deltaY > 0 ? 1 : -1;
      const next = Math.min(Math.max(idx + dir, 0), sectionIds.length - 1);

      if (next !== idx) {
        e.preventDefault();
        animating.current = true;
        smoothScrollTo(sectionIds[next], containerId, duration, NAV_HEIGHT);
        setTimeout(() => {
          animating.current = false;
        }, duration + 100);
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [sectionIds, duration, threshold, containerId]);
}
