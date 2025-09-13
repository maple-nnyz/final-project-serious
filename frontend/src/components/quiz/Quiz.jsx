import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toQuestion = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/question"); // เปลี่ยนหน้า
    }, 300); // 0.8s ให้ overlay แสดงก่อน
  };

  return (
    <section
      id="quiz"
      data-threme="white"
      className="relative w-full h-screen flex items-center justify-center snap-start bg-white text-[#141414]"
    >
      <div className="absolute inset-0 -z-10" />
      <div className="grid w-full max-w-[80%] h-full md:grid-cols-2 gap-4 m-5 place-items-center">
        <div className="w-full px-6 pl-20 pr-20 m-12 text-left">
          <h1 className="text-5xl md:text-6xl font-bold">ค้นหาอาชีพ</h1>
          <p className="text-xl md:text-2xl mt-4 mb-4 opacity-90">
            แบบทดสอบ 40 ข้อ
          </p>
          <div className="mockup-code w-full text-2xl bg-[#141414]">
            <pre data-prefix="1">คำถามแบบ 4 ตัวเลือก</pre>
            <pre data-prefix="2">คำถามแบบวัดความเห็น 5 ระดับ</pre>
            <pre data-prefix="3">คำถามแบบสถานการณ์ตัดสินใจ</pre>
            <button className="w-full mt-5">
            <pre onClick={toQuestion} className="p-2 text-[#141414] bg-warning hover:bg-orange-500 hover:text-white transition">
                เริ่มทำแบบทดสอบ
            </pre>
            </button>
          </div>
        </div>
        <div className="w-full px-6 m-12 grid place-items-center">
          <img
            src="/ict.jpg"
            alt="ICT Career Guide"
            className="h-auto w-[80vh]"
          />
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}
    </section>
  );
}
