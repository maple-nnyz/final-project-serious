import { useEffect, useMemo, useRef, useState } from "react";
import Typewriter from "../typerwriter/Typerwriter";

export default function HomeHero({
  holdMs = 7200, // เวลาค้างหลัง "พิมพ์ description เสร็จ"
  fadeMs = 220, // เวลาเฟดก่อนสลับคำ
}) {
  const variants = useMemo(
    () => [
      {
        title: "Welcome to ICT Career",
        desc: "ระบบแนะนำอาชีพสำหรับนักศึกษา ICT วิเคราะห์ความถนัด-ความสนใจจากแบบทดสอบ 40 ข้อ แล้วบอกคุณว่าเหมาะกับสายงานใดมากที่สุด",
      },
      {
        title: "ค้นหาอาชีพที่ “ใช่” สำหรับคุณ",
        desc: "ตอบแบบสอบถามอ้อม ๆ ไม่กี่นาที ระบบจะแปลงคำตอบเป็นโปรไฟล์ทักษะและจับคู่กับสายงาน Game / Network / Digital ที่เหมาะกับคุณ",
      },
      {
        title: "ICT Career Recommendation System",
        desc: "แพลตฟอร์มแนะแนวอาชีพโดยใช้เวกเตอร์คุณลักษณะและความคล้ายคลึงกับผู้เชี่ยวชาญ เพื่อเสนอ Top 3 อาชีพที่เหมาะสม",
      },
      {
        title: "ยังไม่แน่ใจจะไปสายไหนดี?",
        desc: "ทำแบบทดสอบสั้น ๆ แล้วดูว่าโปรไฟล์ของคุณใกล้กับอาชีพไหนมากที่สุด พร้อมคำแนะนำทักษะที่ควรพัฒนา",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const [titleDone, setTitleDone] = useState(false);
  const [descDone, setDescDone] = useState(false);
  const [fading, setFading] = useState(false);

  // ป้องกัน “สลับทันทีหลังพิมพ์เสร็จ”: รอ holdMs ก่อน แล้วค่อย fade -> เปลี่ยน
  const holdTimer = useRef(null);
  const fadeTimer = useRef(null);

  // reset flags เมื่อเปลี่ยน idx (แต่ไม่ remount ทั้ง section เพื่อไม่ให้ Typewriter รีสตาร์ทโดย StrictMode)
  useEffect(() => {
    setTitleDone(false);
    setDescDone(false);
    setFading(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
  }, [idx]);

  useEffect(() => {
    if (!descDone) return;
    // ค้างไว้
    holdTimer.current = setTimeout(() => {
      setFading(true);
      // แล้วค่อยเปลี่ยนคำ
      fadeTimer.current = setTimeout(() => {
        setIdx((i) => (i + 1) % variants.length);
      }, fadeMs);
    }, holdMs);

    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [descDone, holdMs, fadeMs, variants.length]);

  const v = variants[idx];

  return (
    <section
      id="home"
      data-theme="light"
      className="relative w-full h-screen flex items-center justify-center snap-start bg-white text-[#141414]"
      aria-live="polite"
    >
      <div className="w-full px-6 text-center">
        {/* ===== ข้อความ (เฟดเฉพาะบล็อกนี้) ===== */}
        <div
          className={`transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
        >
          {/* Title */}
          <Typewriter
            text={v.title}
            speed={40}
            className="block text-5xl md:text-6xl font-bold tracking-tight"
            onDone={() => setTitleDone(true)}
          />

          {/* Desc: ยึดบน ไม่ดันบรรทัดแรกขึ้น */}
          <div className="mt-4 mx-auto max-w-3xl min-h-[6.5rem] grid items-start justify-items-center">
            {titleDone ? (
              <Typewriter
                text={v.desc}
                speed={18}
                startDelay={150}
                className="block text-xl md:text-2xl leading-relaxed opacity-90 text-center"
                onDone={() => setDescDone(true)}
              />
            ) : (
              <span className="invisible text-xl md:text-2xl leading-relaxed">
                placeholder
              </span>
            )}
          </div>
        </div>

        {/* ===== ปุ่ม (อยู่นอกบล็อกที่เฟด → โชว์ตลอด) ===== */}
        <div className="mx-auto min-h-[3.5rem] flex items-center justify-center">
          <div className="flex items-center justify-center gap-3">
            <a
              href="#quiz"
              className="rounded-xl px-6 py-3 text-white bg-[#141414]/80 border border-[#141414]/20 shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-orange-500 hover:shadow-orange-500 transition"
            >
              แบบทดสอบ
            </a>
            <a
              href="#career"
              className="rounded-xl px-6 py-3 text-base font-medium border border-[#141414] hover:bg-[#141414]/5 transition"
            >
              รายการอาชีพ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
