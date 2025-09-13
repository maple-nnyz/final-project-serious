import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import quiz from "../../data/quiz.json";

const sortEntries = (obj) =>
  Object.entries(obj).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

function useSequence() {
  return useMemo(() => {
    const fc = sortEntries(quiz.FC).map(([id, item]) => ({
      type: "FC",
      id,
      q: item.Q,
      options: ["1", "2", "3", "4"].map((k) => ({ key: k, label: item[k] })),
    }));

    const lk = sortEntries(quiz.LIKERT).map(([id, item]) => ({
      type: "LIKERT",
      id,
      q: item.Q,
      options: ["1", "2", "3", "4", "5"].map((k) => ({
        key: k,
        label: item[k],
      })),
    }));

    const sj = sortEntries(quiz.SJT).map(([id, item]) => ({
      type: "SJT",
      id,
      q: item.Q,
      options: ["1", "2", "3", "4"].map((k) => ({ key: k, label: item[k] })),
    }));

    return [...fc, ...lk, ...sj];
  }, []);
}

export default function Question() {
  const seq = useSequence();
  const total = seq.length;
  const navigate = useNavigate();

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sjtStage, setSjtStage] = useState(null);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = seq[idx];
  const isLast = idx === total - 1;
  const isSJT = current?.type === "SJT";
  const sjtBest = isSJT ? answers[current?.id]?.best : undefined;
  const sjtSecond = isSJT ? answers[current?.id]?.second : undefined;

  const isAnswered = (q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === "SJT") return !!(a.best && a.second);
    return true;
  };

  const indexById = useMemo(
    () => Object.fromEntries(seq.map((q, i) => [q.id, i])),
    [seq]
  );

  const answeredCount = useMemo(
    () => seq.reduce((acc, q) => (isAnswered(q) ? acc + 1 : acc), 0),
    [seq, answers]
  );

  const isAllAnswered = answeredCount === total;

  const unanswered = useMemo(
    () => seq.filter((q) => !isAnswered(q)),
    [seq, answers]
  );

  useEffect(() => {
    if (!current) return;
    if (current.type !== "SJT") {
      setSjtStage(null);
      return;
    }
    const a = answers[current.id];
    if (!a?.best) setSjtStage("best");
    else if (!a?.second) setSjtStage("second");
    else setSjtStage(null);
  }, [idx, current, answers]);

  const goNext = () => setIdx((p) => Math.min(p + 1, total - 1));
  const goPrev = () => setIdx((p) => Math.max(p - 1, 0));

  const handlePick = (choiceKey) => {
    if (!current) return;
    if (current.type === "FC" || current.type === "LIKERT") {
      setAnswers((prev) => ({ ...prev, [current.id]: choiceKey }));
      if (idx + 1 < total) goNext();
      return;
    }
    if (current.type === "SJT") {
      const curr = answers[current.id] ?? {};
      if (sjtStage === "best") {
        setAnswers((prev) => ({ ...prev, [current.id]: { best: choiceKey } }));
        setSjtStage("second");
        return;
      }
      if (sjtStage === "second") {
        if (curr.best === choiceKey) return;
        setAnswers((prev) => ({
          ...prev,
          [current.id]: { ...curr, second: choiceKey },
        }));
        if (idx + 1 < total) goNext();
        return;
      }
    }
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();

      // ⬇️ ไปหน้าผลลัพธ์ พร้อมส่ง traits, user_vector, top ไปด้วย
      navigate("/results", { state: data });
    } catch (e) {
      console.error(e);
      alert("ส่งคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ปุ่มสุดท้าย: ถ้าตอบครบ → ส่งเลย, ถ้ายังไม่ครบ → โชว์รายการที่ยังไม่ตอบ
  const handleFinishClickAtLast = () => {
    if (isAllAnswered) {
      handleFinish();
    } else {
      setShowUnanswered(true);
    }
  };

  const toHome = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 h-16 text-[#141414]">
        <div className="h-full px-6 flex items-center justify-between">
          <button onClick={toHome}>MySite</button>
        </div>
      </div>

      {/* ---------- MAIN QUIZ ---------- */}
      <div className="relative w-screen h-screen text-white overflow-hidden bg-white">
        <div className="absolute inset-0 grid place-items-center text-[#141414]">
          <div className="w-full max-w-[50%]">
            {/* Header */}
            <h1 className="text-3xl md:text-4xl font-bold text-center pb-6">แบบทดสอบ</h1>

            {/* Card */}
            <div className="h-[650px] mt-4 rounded-xl border border-[#141414]/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] p-5 flex flex-col min-h-[360px]">
              <span className="pb-4">ข้อ {idx + 1} / {total}</span>
              <div className="text-2xl md:text-3xl font-semibold leading-relaxed border-b border-[#141414]/50 pb-2">
                {current?.q}
              </div>

              {current?.type === "SJT" && (
                <div className="mt-2 text-sm opacity-80">
                  {sjtStage === "best" && "โปรดเลือกคำตอบที่เหมาะสมที่สุด (Best)"}
                  {sjtStage === "second" && (
                    <div className="flex items-center gap-2">
                      <span>โปรดเลือกคำตอบที่เหมาะสมรอง (Second)</span>
                      <SelectedBadge label={`Best: ข้อ ${answers[current.id]?.best}`} />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-3">
                {current?.options.map((opt) => {
                  const isDisabled =
                    isSJT && sjtStage === "second" && sjtBest === opt.key;
                  const isBest = isSJT && sjtBest === opt.key;
                  const isSecond = isSJT && sjtSecond === opt.key;
                  const isPickedNonSJT = !isSJT && answers[current.id] === opt.key;

                  let pickedClass = "border-[#141414]/15 shadow-[0_0_5px_rgba(0,0,0,0.4)] hover:bg-orange-500 hover:shadow-orange-500 hover:text-white transition";
                  if (isBest) pickedClass = "border-emerald-400 bg-emerald-500/15";
                  else if (isSecond) pickedClass = "border-sky-400 bg-sky-500/15";
                  else if (isPickedNonSJT) pickedClass = "font-bold border-orange-400 bg-orange-500/20";

                  return (
                    <button
                      key={opt.key}
                      disabled={isDisabled}
                      onClick={() => handlePick(opt.key)}
                      className={[
                        "w-full text-left text-xl rounded-lg border px-6 py-4 transition",
                        pickedClass,
                        isDisabled ? "opacity-40 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <span>{opt.label}</span>

                        {isBest && (
                          <span className="ml-auto inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 text-[11px]">
                            Best
                          </span>
                        )}
                        {isSecond && (
                          <span className="ml-auto inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/10 px-2 py-0.5 text-[11px]">
                            Second
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-auto pt-1 border-t border-white/10">
                <div className="text-sm opacity-70">
                  ตอบแล้ว {answeredCount}/{total}
                </div>
                <div className="h-2 bg-[#141414]/10 rounded mt-2">
                  <div
                    className="h-full bg-orange-500 rounded"
                    style={{ width: `${(answeredCount / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={idx === 0}
                  className="px-4 py-2 hover:text-orange-500 transition"
                >
                  ย้อนกลับ
                </button>

                {isLast ? (
                  <button
                    onClick={handleFinishClickAtLast}
                    className={[
                      "px-4 py-2 rounded-lg border transition",
                      isAllAnswered
                        ? "text-white bg-[#141414]/60 border border-[#141414]/20 shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-emerald-500/30 hover:border-emerald-500/30 hover:shadow-emerald-500 hover:text-emerald-900"
                        : "text-white bg-red-500/80 border border-[#141414]/20 shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-red-500 hover:border-red-500/30 hover:shadow-red-500",
                    ].join(" ")}
                  >
                    {isAllAnswered ? "ส่งคำตอบ" : "คำตอบไม่ครบ"}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="px-4 py-2 rounded-lg text-white bg-[#141414]/60 border border-[#141414]/20 shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-orange-500 hover:shadow-orange-500 transition"
                  >
                    ต่อไป
                  </button>
                )}
              </div>

              {/* Bottom sheet แจ้งข้อที่ยังไม่ได้ตอบ */}
              {showUnanswered && !isAllAnswered && (
                <div className="fixed z-50 bottom-6 left-1/2 -translate-x-1/2 w-[min(92vw,900px)]">
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 shadow-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">
                        ยังไม่ได้ตอบ <span className="font-bold">{unanswered.length}</span> ข้อ
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowUnanswered(false)}
                          className="text-sm px-3 py-1.5 rounded-lg hover:text-red-500"
                        >
                          ปิด
                        </button>
                        {!isAllAnswered && (
                          <button
                            onClick={() => {
                              const first = unanswered[0];
                              if (first) setIdx(indexById[first.id] ?? 0);
                              setShowUnanswered(false);
                            }}
                            className="text-sm px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-400/40 hover:bg-orange-500/30 hover:text-white transiton"
                          >
                            ไปข้อถัดไปที่ยังไม่ได้ตอบ
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid md:grid-cols-10 gap-2">
                      {unanswered.map((q) => {
                        const jumpTo = indexById[q.id] ?? 0;
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setIdx(jumpTo);
                              setShowUnanswered(false);
                            }}
                            className="text-sm px-3 py-1.5 rounded-lg hover:bg-white transition"
                          >
                            ข้อ {jumpTo + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}
    </>
  );
}

function SelectedBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 px-2.5 py-0.5 text-xs">
      {label}
    </span>
  );
}
