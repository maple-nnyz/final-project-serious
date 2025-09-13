import json
import numpy as np
from pathlib import Path

def load_mappings(path: str | Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def answers_to_trait_vector(answers: dict, mappings: dict) -> tuple[list[str], np.ndarray]:
    """
    answers: รูปแบบจาก frontend เช่น:
        {
          "FC01": "3",
          "LI01": "4",              # Likert 1..5
          "SJT01": {"best": "2", "second": "4"},
          ...
        }
    mappings: quiz_mappings.json
    return: (traits_list, vector[np.float64] รูปยาวเท่าจำนวน traits)
    """
    traits = mappings["TRAITS"]                     # ลำดับคงที่ของมิติ
    trait_index = {t:i for i,t in enumerate(traits)}
    vec = np.zeros(len(traits), dtype=float)

    # ---------- Forced-choice ----------
    # FC_MAP: {"FC01": {"1":"data", "2":"debug", ...}, ...}
    for qid, opt_trait_map in mappings["FC_MAP"].items():
        if qid in answers and isinstance(answers[qid], str):
            chosen = answers[qid]
            tr = opt_trait_map.get(chosen)
            if tr is not None:
                vec[trait_index[tr]] += 1.0

    # ---------- Likert ----------
    # LI_MAP: {"LI01": ["proto", 1], ...}  ค่า 2 ตัวคือ (trait, polarity)
    # ให้แปลงสเกล 1..5 -> [-2,-1,0,1,2] แล้วคูณ polarity
    for qid, (tr, pol) in mappings["LI_MAP"].items():
        if qid in answers and isinstance(answers[qid], str):
            try:
                raw = int(answers[qid])  # 1..5
                score = (raw - 3)        # -2..+2
                vec[trait_index[tr]] += pol * score
            except Exception:
                pass

    # ---------- SJT ----------
    # SJT_MAP: {"SJT01":{"1":"security","2":"debug",...}}
    # SJT_WEIGHTS: {"best": 2, "second": 1}
    w_best = mappings["SJT_WEIGHTS"]["best"]
    w_second = mappings["SJT_WEIGHTS"]["second"]
    for qid, opt_trait_map in mappings["SJT_MAP"].items():
        a = answers.get(qid)
        if isinstance(a, dict):
            b = a.get("best")
            s = a.get("second")
            if b and b in opt_trait_map:
                vec[trait_index[opt_trait_map[b]]] += float(w_best)
            if s and s in opt_trait_map and s != b:
                vec[trait_index[opt_trait_map[s]]] += float(w_second)

    # ---------- normalize (เวกเตอร์หน่วย เพื่อใช้ cosine) ----------
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return traits, vec
