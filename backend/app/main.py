from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity

from .utils.vectorize import load_mappings, answers_to_trait_vector

# -------- CONFIG --------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MAPPINGS_PATH = DATA_DIR / "quiz_mappings.json"
EXPERT_XLSX = DATA_DIR / "ict_career_expert_responses.xlsx"

# frontend origins ที่อนุญาต (ปรับตามจริง)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# -------- APP --------
app = FastAPI(title="ICT Career Recommender API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- LOAD MAPPINGS --------
MAPPINGS = load_mappings(MAPPINGS_PATH)

# -------- LOAD EXPERTS --------
"""
รองรับ 2 ฟอร์แมตหลักใน Excel:

A) แบบเก็บ trait โดยตรง (คอลัมน์: role, proto, ops, debug, data, aesthetic, security, collab, product, cloud_arch, communication)
B) แบบเก็บคำตอบดิบ (คอลัมน์: role, FC01..FC28, LI01..LI10, SJT01_best, SJT01_second, SJT02_best, SJT02_second)
   - ในกรณี B จะถูกแปลงเป็นเวกเตอร์ traits ด้วยฟังก์ชันเดียวกับผู้ใช้
"""

def load_experts(xlsx_path: Path, mappings: dict) -> Tuple[pd.DataFrame, np.ndarray, list[str]]:
    df = pd.read_excel(xlsx_path)

    # ตั้งชื่อคอลัมน์ให้สอดคล้อง (ตัดช่องว่าง)
    df.columns = [str(c).strip() for c in df.columns]

    traits = mappings["TRAITS"]

    has_trait_cols = all(t in df.columns for t in traits)

    if has_trait_cols:
        # ใช้เวกเตอร์ traits ตรง ๆ
        X = df[traits].astype(float).to_numpy()
    else:
        # สร้างเวกเตอร์จากคำตอบดิบของผู้เชี่ยวชาญ
        # รองรับ SJT คีย์แบบ SJT01_best/SJT01_second หรือ JSON string
        X_rows = []
        for _, row in df.iterrows():
            ans: Dict[str, Any] = {}

            # FC
            for qid in mappings["FC_MAP"].keys():
                if qid in row and pd.notna(row[qid]):
                    ans[qid] = str(row[qid])

            # LIKERT
            for qid in mappings["LI_MAP"].keys():
                if qid in row and pd.notna(row[qid]):
                    ans[qid] = str(int(row[qid]))

            # SJT
            for qid in mappings["SJT_MAP"].keys():
                best_col = f"{qid}_best"
                second_col = f"{qid}_second"
                best = str(int(row[best_col])) if best_col in row and pd.notna(row[best_col]) else None
                second = str(int(row[second_col])) if second_col in row and pd.notna(row[second_col]) else None
                if best or second:
                    ans[qid] = {}
                    if best: ans[qid]["best"] = best
                    if second: ans[qid]["second"] = second

            _, vec = answers_to_trait_vector(ans, mappings)
            X_rows.append(vec)

        X = np.vstack(X_rows) if X_rows else np.zeros((0, len(traits)), dtype=float)

    # normalize สำหรับ cosine
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    X = X / norms

    return df, X, traits

EXPERT_DF, EXPERT_X, TRAITS = load_experts(EXPERT_XLSX, MAPPINGS)

class PredictPayload(BaseModel):
    # โครงที่ฝั่งหน้าเว็บส่งมา: "answers": dict
    answers: Dict[str, Any]
    top_k: Optional[int] = 5

@app.post("/api/predict")
def predict(payload: PredictPayload):
    """
    รับคำตอบ -> เวกเตอร์ trait -> similarity กับผู้เชี่ยวชาญทุกคน -> สรุปคะแนนรายอาชีพ -> ส่ง top_k (พร้อม role vector) กลับ
    """
    # 1) user vector
    traits, user_vec = answers_to_trait_vector(payload.answers, MAPPINGS)

    if EXPERT_X.shape[0] == 0:
        return {
            "traits": traits,
            "user_vector": user_vec.tolist(),
            "top": [],
            "debug": {"message": "No expert vectors loaded."}
        }

    # 2) cosine sim กับผู้เชี่ยวชาญ
    sim = cosine_similarity(user_vec.reshape(1, -1), EXPERT_X).ravel()  # shape = (n_experts,)

    # ถ้าไม่มีคอลัมน์ role -> ตอบเป็นรายผู้เชี่ยวชาญ (แนบเวกเตอร์ expert ด้วย)
    if "role" not in EXPERT_DF.columns:
        top_idx = np.argsort(sim)[::-1][: int(payload.top_k or 5)]
        top = []
        for i in top_idx:
            # EXPERT_X เป็นเวกเตอร์ normalize แล้ว
            expert_vec = EXPERT_X[i].tolist()
            top.append({
                "role": str(EXPERT_DF.iloc[i].get("role", f"expert_{i}")),
                "score": float(sim[i]),
                "vector": expert_vec,  # << แนบไว้ให้เทียบในกราฟได้
                "support": [{"expert_index": int(i), "sim": float(sim[i])}],
            })
        return {
            "traits": traits,
            "user_vector": user_vec.tolist(),
            "top": top,
        }

    # 3) รวมคะแนนเฉลี่ยต่ออาชีพ + คำนวณ centroid (role vector)
    roles = EXPERT_DF["role"].astype(str).tolist()
    df_role = pd.DataFrame({"role": roles, "sim": sim})

    # 3.1 คะแนนเฉลี่ยต่อ role เพื่อจัดอันดับ
    agg = (df_role.groupby("role")["sim"]
                 .mean()
                 .reset_index()
                 .sort_values("sim", ascending=False))

    # 3.2 หา centroid ต่อ role จาก EXPERT_X (normalize แล้ว)
    role_centroids: dict[str, np.ndarray] = {}
    for role in agg["role"].unique():
        idx = [i for i, r in enumerate(roles) if r == role]
        if idx:  # เผื่อ role ไหนไม่มีแถว (ไม่น่าเกิด แต่กันไว้)
            role_centroids[role] = EXPERT_X[idx].mean(axis=0)
        else:
            role_centroids[role] = np.zeros(EXPERT_X.shape[1], dtype=float)

    # 3.3 support: ผู้เชี่ยวชาญ top-3 ของแต่ละ role (สำหรับอธิบาย)
    support_idx = (
        pd.DataFrame({"idx": np.arange(len(roles)), "role": roles, "sim": sim})
        .sort_values(["role", "sim"], ascending=[True, False])
        .groupby("role")
        .head(3)
        .groupby("role")
        .apply(lambda g: [{"expert_index": int(i), "sim": float(s)} for i, s in zip(g["idx"], g["sim"])])
    )

    # 4) เลือก top-k และแนบ "vector" ของอาชีพเข้าไป
    k = int(payload.top_k or 5)
    top_rows = agg.head(k).to_dict(orient="records")

    top = []
    for r in top_rows:
        role = r["role"]
        centroid = role_centroids.get(role, np.zeros(len(traits), dtype=float))
        top.append({
            "role": role,
            "score": float(r["sim"]),
            "vector": centroid.tolist(),          # << เพิ่มเวกเตอร์ของอาชีพ
            "support": support_idx.get(role, [])
        })

    return {
        "traits": traits,                          # ลำดับคีย์ 10 มิติ (เช่น proto..communication)
        "user_vector": user_vec.tolist(),          # เวกเตอร์ของผู้ใช้ (normalize แล้ว)
        "top": top,                                # แต่ละอาชีพมี role, score, vector, support
    }


@app.get("/healthz")
def healthz():
    return {"ok": True, "experts": int(EXPERT_X.shape[0])}
