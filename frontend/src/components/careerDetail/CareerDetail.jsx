// src/components/careerDetail/CareerDetail.jsx
export default function CareerDetail({
  selected,
  modalVisible,
  closeDetail,
  setShowModal,
  setSelected,
  normalizeTools,
  badgeClass,
  TOOL_LEVELS,
}) {
  if (!selected) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[1000] grid place-items-center p-4 transition-opacity duration-300 " +
        (modalVisible ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0")
      }
      onClick={closeDetail}
      onTransitionEnd={(e) => {
        if (!modalVisible && e.target === e.currentTarget) {
          setShowModal(false);
          setSelected(null);
        }
      }}
    >
      <button
        onClick={closeDetail}
        className="absolute top-5 right-5 rounded-lg px-4 py-2 text-sm bg-white/30 hover:bg-red-500 hover:text-white transition"
      >
        ปิด
      </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-title"
        className={
          "relative w-full max-w-[60%] max-h-[120vh] overflow-y-auto rounded-2xl bg-white text-[#141414] p-10 transition-all duration-300" +
          (modalVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-1 scale-95")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="career-title" className="text-5xl font-semibold mb-4">
          {selected.name_th}
        </h2>
        {selected.overview && (
          <p className="mt-2 opacity-90 text-xl">{selected.overview}</p>
        )}

        {Array.isArray(selected.responsibilities) && (
          <>
            <h3 className="mt-5 font-semibold text-2xl">หน้าที่สำคัญ</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-lg">
              {selected.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-3 grid md:grid-cols-2 gap-10">
          {Array.isArray(selected.hard_skills) &&
            selected.hard_skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-2xl">Hard Skill</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-lg">
                  {selected.hard_skills.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

          {Array.isArray(selected.soft_skills) &&
            selected.soft_skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-2xl">Soft Skill</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-lg">
                  {selected.soft_skills.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        <section>
          <h3 className="mt-3 font-semibold text-2xl">Tools</h3>

          {normalizeTools(selected.tools).length === 0 ? (
            <p className="opacity-70 text-s">—</p>
          ) : (
            normalizeTools(selected.tools).map((group) => (
              <div key={group.key} className="mt-3">
                {group.key !== "all" && (
                  <div className="text-s uppercase tracking-wide opacity-70 mb-2">
                    {group.label}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {group.items.map((tool, i) => (
                    <span key={i} className={badgeClass(group.key)}>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
