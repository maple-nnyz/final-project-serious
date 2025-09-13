import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Career() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const toCareer = () => {
        setLoading(true);
        setTimeout(() => {
        navigate("/careersinfo"); // เปลี่ยนหน้า
        }, 300); // 0.8s ให้ overlay แสดงก่อน
    };

    return (
        <section
            id="career"
            data-theme="dark"
            className="relative w-full h-screen flex items-center justify-center snap-start bg-[#141414]"
          >
            <div className="absolute inset-0 -z-10" />
            <div className="grid w-full max-w-[80%] h-full md:grid-cols-2 gap-4 m-5 place-items-center">
                <div className="w-full px-6 m-12 grid place-items-center">
                <img src="/ict.jpg" alt="ICT Career Guide" className="h-auto w-[80vh]" />
                </div>
                <div className="w-full px-6 pl-20 pr-20 m-12 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold">รายการอาชีพ</h1>
                    <p className="text-xl md:text-2xl mt-4 mb-4 opacity-90">
                        อาชีพในสายงาน ICT 20 อาชีพ
                        แบ่ง 3 สาย GAME NETWORK DIGITAL
                    </p>
                    <button
                        onClick={toCareer}
                        className="rounded-2xl text-xl mt-8 px-10 py-5 text-base font-medium border border-[#F3F2EC] hover:bg-orange-500 hover:text-white transition"
                    >
                        เลือกดูอาชีพ
                    </button>
                </div>
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              </div>
            )}
          </section>
    )
}