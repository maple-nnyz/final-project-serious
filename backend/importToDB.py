import json, os, sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# โหลด .env
load_dotenv()
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_DB   = os.getenv("PG_DB", "career-sys-db")
PG_USER = os.getenv("PG_USER", "maple")
PG_PW   = os.getenv("PG_PASSWORD", "AjF5gP3xbd")

DSN = f"postgresql+psycopg://{PG_USER}:{PG_PW}@{PG_HOST}:{PG_PORT}/{PG_DB}"
engine = create_engine(DSN, future=True)

UPSERT_SQL = text("""
INSERT INTO roles
(id, name_th, overview, responsibilities, hard_skills, soft_skills, tools, updated_at)
VALUES
(:id, :name_th, :overview, :responsibilities, :hard_skills, :soft_skills, CAST(:tools_json AS JSONB), now())
ON CONFLICT (id) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  overview = EXCLUDED.overview,
  responsibilities = EXCLUDED.responsibilities,
  hard_skills = EXCLUDED.hard_skills,
  soft_skills = EXCLUDED.soft_skills,
  tools = EXCLUDED.tools,
  updated_at = now();
""")

def validate_role(role):
    for k in ["id","name_th","overview","responsibilities","hard_skills","soft_skills","tools"]:
        if k not in role:
            raise ValueError(f"Missing key: {k} in role {role.get('id')}")
    for lvl in ["basic","intermediate","advanced"]:
        if lvl not in role["tools"] or not isinstance(role["tools"][lvl], list):
            raise ValueError(f"tools.{lvl} must be a list in {role['id']}")

def main(json_path):
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("JSON root must be a list")

    rows = []
    for r in data:
        validate_role(r)
        rows.append({
            "id": r["id"],
            "name_th": r["name_th"],
            "overview": r["overview"],
            "responsibilities": r["responsibilities"],
            "hard_skills": r["hard_skills"],
            "soft_skills": r["soft_skills"],
            "tools_json": json.dumps(r["tools"], ensure_ascii=False)
        })

    with engine.begin() as conn:
        conn.execute(text("SET TIME ZONE 'Asia/Bangkok'"))
        conn.execute(UPSERT_SQL, rows)
    print(f"Upserted {len(rows)} role(s).")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python importToDB.py path/to/careerData.json")
        sys.exit(1)
    main(sys.argv[1])