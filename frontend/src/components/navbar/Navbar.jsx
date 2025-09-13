// src/components/navbar/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { smoothScrollTo } from "../../lib/smoothScroll";
import useActiveSection from "../../lib/useActiveSection"; // ส่อง section ที่อยู่ใน viewport

export default function Navbar() {
  const sectionIds = ["home", "quiz", "career", "about"];
  const activeId = useActiveSection(sectionIds); // ถ้าไม่มีคอนเทนเนอร์สโครลเฉพาะ ให้ใช้แบบนี้ (viewport)

  // ธีมของแต่ละหน้า: light = พื้นหลังสว่าง -> ตัวหนังสือดำ, dark = พื้นหลังเข้ม -> ตัวหนังสือขาว
  const themeMap = {
    home: "light",
    quiz: "light",
    career: "dark",
    about: "dark",
  };
  const theme = themeMap[activeId] ?? "dark";
  const isLight = theme === "light";

  const go = (e, id) => {
    e.preventDefault();
    smoothScrollTo(id); // ถ้าไม่ได้มีคอนเทนเนอร์ id="page" อย่าส่ง root เข้าไป
  };

  // ----- แถบขีดวิ่งใต้เมนู -----
  const linksRef = useRef(null);
  const [bar, setBar] = useState({ left: 0, width: 0 });

  const updateBar = () => {
    const wrap = linksRef.current;
    if (!wrap) return;
    const activeEl = wrap.querySelector(`[data-id="${activeId}"]`);
    if (!activeEl) return;
    const wrapRect = wrap.getBoundingClientRect();
    const rect = activeEl.getBoundingClientRect();
    setBar({ left: rect.left - wrapRect.left, width: rect.width });
  };

  useEffect(() => { updateBar(); }, [activeId]);
  useEffect(() => {
    const onResize = () => updateBar();
    window.addEventListener("resize", onResize);
    const t = setTimeout(updateBar, 0);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);

  // ทำให้ข้อความลิงก์ “สืบทอดสีจาก wrapper” แล้วค่อยเปลี่ยนเฉพาะตอน active เป็นส้ม
  const linkBase = "pb-1 transition-colors text-current";
  const hoverClass = isLight ? "hover:text-black/70" : "hover:text-white/80";
  const brandClass = isLight ? "text-black" : "text-white";
  const wrapperTone = isLight ? "text-black" : "text-white"; // สีพื้นฐานของทุกลิงก์ (ยกเว้น active)

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        {/* โลโก้/แบรนด์ */}
        <a
          href="#home"
          onClick={(e) => go(e, "home")}
          className={`${brandClass} font-semibold`}
        >
          MySite
        </a>

        {/* เมนู */}
        <div ref={linksRef} className={`relative flex gap-8 items-end ${wrapperTone}`}>
          {sectionIds.map((id) => {
            const isActive = activeId === id;
            return (
              <a
                key={id}
                data-id={id}
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                aria-current={isActive ? "page" : undefined}
                className={`${linkBase} ${hoverClass} ${isActive ? "!text-orange-500" : ""}`}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            );
          })}

          {/* แถบขีดวิ่งสีส้ม */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-[2px] bg-orange-500 rounded-full transition-all duration-300 ease-out will-change-transform"
            style={{ transform: `translateX(${bar.left}px)`, width: `${bar.width}px` }}
          />
        </div>
      </div>
    </nav>
  );
}
