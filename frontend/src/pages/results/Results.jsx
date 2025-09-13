// src/pages/Results.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import careers from "../../data/careerData.json";
import CareerDetail from "../../components/careerDetail/careerDetail";
import TraitRadar from "../../components/TraitRadar/TraitRadar";

/* --------- Thai labels (สำหรับสรุป Top 3 ใต้เรดาห์) --------- */
const TH_LABELS = {
  proto: "สร้างต้นแบบ",
  ops: "ปฏิบัติการระบบ",
  debug: "ดีบัก/แก้ปัญหา",
  data: "วิเคราะห์ข้อมูล",
  aesthetic: "ความสวยงาม/ดีไซน์",
  security: "ความปลอดภัย",
  collab: "ทำงานเป็นทีม",
  product: "มุมมองผลิตภัณฑ์",
  cloud_arch: "สถาปัตยกรรมคลาวด์",
  communication: "การสื่อสาร",
};

function topNTraits(traits, vector, n = 3) {
  const arr = traits.map((t, i) => ({
    key: t,
    th: TH_LABELS[t] || t,
    val: vector[i] ?? 0,
  }));
  arr.sort((a, b) => b.val - a.val);
  return arr.slice(0, n);
}

/* ---------------- helpers สำหรับ CareerDetail ---------------- */
const TOOL_LEVELS = ["all", "basic", "intermediate", "advanced"];
const GROUP_LABEL = {
  all: "All Tools",
  basic: "พื้นฐาน",
  intermediate: "ระดับกลาง",
  advanced: "ขั้นสูง",
};
const badgeClass = (groupKey = "all") =>
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs " +
  (groupKey === "advanced"
    ? "border-emerald-400/60 bg-emerald-500/10"
    : groupKey === "intermediate"
      ? "border-sky-400/60 bg-sky-500/10"
      : groupKey === "basic"
        ? "border-orange-400/60 bg-orange-500/10"
        : "border-white/20 bg-white/10");

function normalizeTools(tools) {
  if (!tools) return [];
  if (Array.isArray(tools))
    return [{ key: "all", label: GROUP_LABEL.all, items: tools }];
  const out = [];
  for (const k of TOOL_LEVELS) {
    const items = Array.isArray(tools[k]) ? tools[k] : [];
    if (items.length) out.push({ key: k, label: GROUP_LABEL[k] || k, items });
  }
  return out;
}

/* --------- จับคู่ชื่ออาชีพจากผลทำนาย -> ข้อมูลเต็ม --------- */
function findCareerDetail(roleName) {
  if (!roleName || !Array.isArray(careers)) return null;
  // ทำให้แมตช์ยืดหยุ่นขึ้น
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[\s\-_/]/g, "");
  const q = norm(roleName);
  return (
    careers.find((c) => norm(c.name_en) === q) ||
    careers.find((c) => norm(c.name_th) === q) ||
    careers.find(
      (c) => Array.isArray(c.alias) && c.alias.map(norm).includes(q)
    ) ||
    // เผื่อชื่อยาว/สั้นต่างกันเล็กน้อย
    careers.find(
      (c) =>
        norm(c.name_en).includes(q) ||
        norm(c.name_th).includes(q) ||
        (Array.isArray(c.alias) && c.alias.some((a) => norm(a).includes(q)))
    ) ||
    null
  );
}

/* ============================ PAGE ============================ */
export default function Results() {
  const { state } = useLocation(); // { traits, user_vector, top }
  const navigate = useNavigate();

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  if (!state) {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">ไม่มีข้อมูลผลลัพธ์</h2>
          <p className="opacity-80">กรุณาทำแบบทดสอบและส่งคำตอบอีกครั้ง</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  const { traits = [], user_vector = [], top = [] } = state;

  // สร้างการ์ดอาชีพจาก top (ผูก score/role/vector + fallback หากหาในไฟล์ไม่เจอ)
  const items = useMemo(() => {
    return (top || [])
      .map((t) => {
        const det = findCareerDetail(t.role);
        if (det) {
          return {
            ...det,
            score: t.score || 0,
            role: t.role,
            vector: t.vector || [],
          };
        }
        // Fallback card: ยังแสดงได้แม้ไม่มีใน careerData.json
        return {
          id: t.role,
          name_en: t.role,
          name_th: t.role,
          overview: " ",
          tags: [],
          score: t.score || 0,
          role: t.role,
          vector: t.vector || [],
        };
      })
      .filter(Boolean);
  }, [top]);

  const top3 = useMemo(
    () => topNTraits(traits, user_vector, 3),
    [traits, user_vector]
  );

  // ====== Radar compare (เปิด/ปิดได้ทีละอาชีพ) ======
  const [compareList, setCompareList] = useState(() =>
    (top || []).slice(0, 3).map((t) => ({
      label: t.role,
      vector: t.vector || [],
      visible: true,
    }))
  );

  // รีเซ็ตเมื่อ top เปลี่ยน
  useEffect(() => {
    setCompareList(
      (top || []).slice(0, 3).map((t) => ({
        label: t.role,
        vector: t.vector || [],
        visible: true,
      }))
    );
  }, [top]);

  const toggleCompare = (label) => {
    setCompareList((list) =>
      list.map((item) =>
        item.label === label ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const addOrToggleCompare = (label, vector) => {
    setCompareList((list) => {
      const idx = list.findIndex((i) => i.label === label);
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], visible: !updated[idx].visible };
        return updated;
      }
      return [...list, { label, vector: vector || [], visible: true }];
    });
  };

  const openDetail = (careerObj) => {
    setSelected(careerObj);
    setShowModal(true);
    requestAnimationFrame(() => setModalVisible(true)); // fade-in
  };
  const closeDetail = () => setModalVisible(false); // fade-out

  return (
    <>
    <div className="w-screen h-screen bg-white">
      <div className="grid place-items-center p-8 text-4xl">
        <h3>CAREER RECOMMEND</h3>
      </div>

      <div className="w-full max-w-[80%] h-[80vh]
                flex flex-col rounded-xl mx-auto text-[#141414] overflow-hidden">
        <div className="grid h-full md:grid-cols-2 gap-4 m-5 place-items-center">
          {/* ซ้าย: เรดาห์ + ชิปสลับเส้น + Top3 ความถนัด */}
          <div className="w-full h-full rounded-lg flex flex-col">
            <TraitRadar
              traits={traits}
              vector={user_vector}
              title="ความถนัด (Radar %)"
              compareList={compareList}
            />
          </div>

          {/* ขวา: บล็อคการ์ดอาชีพ (กดแล้วเปิด CareerDetail modal + สลับเส้นบนกราฟ) */}
          <div className="w-full h-full flex flex-col pt-6 px-6 pb-6 overflow-y-auto border-l">
            <div className="grid gap-4 overflow-y-auto ml-5 mr-5 p-2">
              <h4 className="text-xl font-semibold">อาชีพที่เหมาะสม</h4>

              {items.slice(0, 3).map((c) => (
                <article
                  key={c.id || c.name_en || c.name_th}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(c);
                    }
                  }}
                  className="group relative rounded-2xl p-5 shadow cursor-pointer
                   hover:bg-white/10 border border-transparent hover:border-orange-500
                   shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:shadow-orange-500/50 transition"
                >
                  <div className="flex items-start gap-3">
                    <h3 className="text-lg font-semibold">
                      {c.name_th || c.name_en}
                    </h3>
                    {"score" in c && (
                      <span
                        className="ml-auto inline-flex items-center rounded-full border border-orange-400/60 bg-orange-500/10
                                   px-2 py-0.5 text-[11px] text-orange-300"
                        title="คะแนนความเหมาะสม"
                      >
                        {(c.score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm opacity-80 line-clamp-3">
                    {c.overview}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(c.tags || []).map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10"
                      >
                        {t}
                      </span>
                    ))}

                    {/* ปุ่มควบคุมกราฟ */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addOrToggleCompare(c.role, c.vector); // ใช้ role จาก backend ให้ตรงกับ compareList
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30"
                      title="แสดง/ซ่อนอาชีพนี้บนกราฟ"
                    >
                      แสดง/ซ่อนบนกราฟ
                    </button>
                  </div>

                  <span className="pointer-events-none absolute bottom-4 right-5 text-sm opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform">
                    ดูรายละเอียด →
                  </span>
                </article>
              ))}
              <div>
                <h4 className="text-xl font-semibold mt-2 mb-2">
                  ความถนัดที่โดดเด่น
                </h4>
                <ol className="space-y-2">
                  {top3.map((t, i) => (
                    <li key={t.key} className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{t.th}</div>
                        <div className="h-2 bg-white/10 rounded mt-1">
                          <div
                            className="h-full bg-sky-500 rounded"
                            style={{
                              width: `${Math.min(100, t.val * 100).toFixed(1)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {(t.val * 100).toFixed(1)}%
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ปุ่มนำทางชิดซ้าย-ขวา */}
      <div className="w-full max-w-[80%] mx-auto mt-4 flex items-center justify-between gap-5">
        <button
          className="px-4 py-2 text-xl rounded-lg hover:text-orange-500"
          onClick={() => navigate(-1)}
        >
          ย้อนกลับ
        </button>
        <button
          className="px-6 py-3 text-lg rounded-lg text-white bg-[#141414]/60 border border-[#141414]/20 shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-orange-500 hover:shadow-orange-500 transition"
          onClick={() => navigate("/")}
        >
          กลับหน้าแรก
        </button>
      </div>
      </div>

      {/* Modal รายละเอียดอาชีพ */}
      {showModal && (
        <CareerDetail
          selected={selected}
          modalVisible={modalVisible}
          closeDetail={closeDetail}
          setShowModal={setShowModal}
          setSelected={setSelected}
          normalizeTools={normalizeTools}
          badgeClass={badgeClass}
          TOOL_LEVELS={TOOL_LEVELS}
        />
      )}
    </>
  );
}
