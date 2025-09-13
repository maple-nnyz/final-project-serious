import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import careers from "../../data/careerData.json";
import CareerDetail from "../../components/careerDetail/careerDetail";

const TAGS = ["ALL", "GAME", "NETWORK", "DIGITAL"];
const toTagKey = (id) => id.toLowerCase();

export default function CareersInfo() {
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("ALL");

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ---------- Modal states ----------
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  const toQuestion = () => {
        setLoading(true);
        setTimeout(() => {
        navigate("/question");
        }, 300);
    };

  const openDetail = (c) => {
    setSelected(c);
    setShowModal(true);
    requestAnimationFrame(() => {
      setModalVisible(true);
    });
  };
  const closeDetail = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    if (showModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // ปิดด้วย ESC
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => e.key === "Escape" && closeDetail();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  // ---------- Filter ----------
  const items = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let list = careers;

    if (activeTag !== "ALL") {
      const k = toTagKey(activeTag);
      list = list.filter((c) => Array.isArray(c.tags) && c.tags.includes(k));
    }
    if (kw) {
      list = list.filter(
        (c) =>
          (c.name_th || "").toLowerCase().includes(kw) ||
          (c.overview || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [q, activeTag]);

  // ---------- Underline bar ----------
  const tabsWrapRef = useRef(null);
  const barRef = useRef(null);
  const labelRefs = useRef({});

  const updateBar = () => {
    const wrap = tabsWrapRef.current;
    const bar = barRef.current;
    const lab = labelRefs.current[activeTag];
    if (!wrap || !bar || !lab) return;
    const wrapBox = wrap.getBoundingClientRect();
    const labBox = lab.getBoundingClientRect();
    const left = labBox.left - wrapBox.left;
    bar.style.width = `${labBox.width}px`;
    bar.style.transform = `translateX(${left}px)`;
    bar.style.opacity = "1";
  };

  useLayoutEffect(() => {
    updateBar();
  }, [activeTag]);
  useEffect(() => {
    const onResize = () => updateBar();
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) document.fonts.ready.then(updateBar);
    const t = setTimeout(updateBar, 0);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  function badgeClass(levelKey) {
    const base = "text-lg px-2 py-1 rounded-lg border whitespace-nowrap";
    return TOOL_LEVELS[levelKey]
      ? `${base} ${TOOL_LEVELS[levelKey].badge}`
      : `${base} bg-white/10 border-white/10`;
  }

  const TOOL_LEVELS = {
    basic: {
      label: "พื้นฐาน",
      badge: "bg-emerald-900/20 border-emerald-500/30",
    },
    intermediate: {
      label: "ระดับกลาง",
      badge: "bg-sky-900/20 border-sky-500/30",
    },
    advanced: {
      label: "ขั้นสูง",
      badge: "bg-fuchsia-900/20 border-fuchsia-500/30",
    },
  };

  // แปลง selected.tools ให้เป็นกลุ่มเสมอ (รองรับ array และ object)
  function normalizeTools(t) {
    if (!t) return [];
    if (Array.isArray(t))
      return [{ key: "all", label: "เครื่องมือ", items: t }];
    if (typeof t === "object") {
      return Object.keys(TOOL_LEVELS)
        .map((k) => ({
          key: k,
          label: TOOL_LEVELS[k].label,
          items: Array.isArray(t[k]) ? t[k] : [],
        }))
        .filter((g) => g.items.length > 0);
    }
    return [];
  }

  function badgeClass(levelKey) {
    const base = "text-lg px-2 py-1 rounded-lg border whitespace-nowrap";
    return TOOL_LEVELS[levelKey]
      ? `${base} ${TOOL_LEVELS[levelKey].badge}`
      : `${base} bg-white/10 border-white/10`;
  }

  return (
    <>
      <div className="w-screen h-screen bg-white">
        <div className="max-w-5xl mx-auto p-6 space-y-3">
          {/* Search */}
          <div className="max-w-5xl flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาอาชีพ…"
              className="w-full rounded-xl border border-[#141414]/20 px-4 py-2 shadow-[0_0_5px_rgba(0,0,0,0.4)] outline-none focus:ring placeholder-[#141414]/50 focus:placeholder-transparent"
            />
          </div>
        </div>

        {/* Career cards */}
        <div className="w-full max-w-[80%] h-[80vh] pl-5 pr-5 pb-6 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col rounded-xl mx-auto text-[#141414]">
          {/* Tabs + moving underline */}
          <div
            ref={tabsWrapRef}
            onScroll={updateBar}
            className="relative flex justify-center items-end gap-8 overflow-x-auto overflow-y-visible px-6 pt-4 pb-2 scrollbar-none border-b border-[#141414]/10"
            role="tablist"
            aria-label="Career tags"
          >
            {TAGS.map((id) => {
              const active = activeTag === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTag(id)}
                  className={`text-base md:text-md transition-colors ${
                    active
                      ? "text-orange-500"
                      : "text-[#141414]/80 hover:text-[#141414]"
                  }`}
                >
                  <span
                    ref={(el) => (labelRefs.current[id] = el)}
                    className="inline-block px-0.5"
                  >
                    {id}
                  </span>
                </button>
              );
            })}

            {/* moving underline */}
            <span
              ref={barRef}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-orange-500 transition-[transform,width,opacity] duration-300 ease-out"
              style={{ width: 0, transform: "translateX(0px)", opacity: 0 }}
            />
          </div>

          {/* grid ของการ์ด */}
          <div className="flex-1 grid md:grid-cols-2 gap-4 overflow-y-auto p-3 mt-3">
            {items.map((c) => (
              <article
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => openDetail(c)}
                className="group relative rounded-2xl p-5 shadow cursor-pointer
                   hover:bg-white/10 border border-transparent hover:border-orange-500
                   shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:shadow-orange-500/50 transition"
              >
                <h3 className="text-lg font-semibold">{c.name_th}</h3>
                <p className="mt-2 text-sm opacity-80 line-clamp-3">
                  {c.overview}
                </p>

                {/* responsibilities */}
                {Array.isArray(c.responsibilities) && (
                  <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
                    {c.responsibilities.slice(0, 3).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}

                {/* tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(c.tags || []).map((t, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTag(t.toUpperCase());
                      }}
                      className="text-xs px-2 py-1 rounded-lg bg-[#141414]/10 border border-[#141414]/10 hover:bg-[#141414]/20"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <span className="pointer-events-none absolute bottom-4 right-5 text-sm opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5">
                  ดูรายละเอียด →
                </span>
              </article>
            ))}
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
            className="px-8 py-4 text-xl rounded-lg text-white bg-[#141414]/60 border border-[#141414]/20 shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-orange-500 hover:shadow-orange-500 transition"
            onClick={toQuestion}
          >
            ค้นหาอาชีพ
          </button>
        </div>

        {/* Modal with fade/scale animation */}
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

        {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              </div>
        )}
      </div>
    </>
  );
}
