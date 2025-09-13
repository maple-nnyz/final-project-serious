import { useEffect, useState } from "react";

export default function useActiveSection(sectionIds, containerId = "page") {
  const [activeId, setActiveId] = useState(sectionIds[0]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: container,       // 👈 สำคัญ: ให้ observer มอง container จริง
        threshold: 0.5,        // เห็นเกิน 50% ของ section ถึงจะ active
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, containerId]);

  return activeId;
}
