// components/Typewriter.jsx
import { useEffect, useRef, useState } from "react";

/** Typewriter เสถียร: กัน StrictMode + ไม่รีสตาร์ทเพราะ onDone เปลี่ยน */
export default function Typewriter({
  text,
  speed = 45,     // ms/ตัวอักษร
  startDelay = 0,  // ms ก่อนเริ่มพิมพ์
  className = "",
  cursor = true,
  onDone,
}) {
  const [out, setOut] = useState("");

  // 1) เก็บ onDone ไว้ใน ref เพื่อตัดออกจาก deps
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // 2) token กันซ้อน + refs สำหรับ timeout/interval
  const runIdRef = useRef(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // เริ่มรอบใหม่
    const myRun = ++runIdRef.current;
    setOut("");

    // เคลียร์ของเก่าถ้ามี
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    timeoutRef.current = setTimeout(() => {
      let i = 0;
      intervalRef.current = setInterval(() => {
        // ถ้ารอบนี้โดนทำให้ stale ให้หยุดทันที
        if (runIdRef.current !== myRun) {
          clearInterval(intervalRef.current);
          return;
        }
        // พิมพ์ทีละตัว
        setOut(text.slice(0, i + 1));
        i += 1;

        if (i >= text.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // เรียก onDone ปัจจุบันจาก ref (ไม่ทำให้ effect รีรัน)
          if (onDoneRef.current) onDoneRef.current();
        }
      }, speed);
    }, startDelay);

    // ทำให้รอบนี้ stale และเคลียร์ timer ตอน unmount/เปลี่ยน text
    return () => {
      runIdRef.current++;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // ❗ อย่าใส่ onDone ใน deps — ใช้ onDoneRef แทน
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      {out}
      {cursor && <span className="inline-block w-[0.6ch] animate-pulse">|</span>}
    </span>
  );
}
