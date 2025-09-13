// src/components/TraitRadar.jsx
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend
} from "recharts";

export default function TraitRadar({
  traits = [],                 // ["proto","ops",...]
  vector = [],                 // เวกเตอร์ของผู้ใช้ (0..1)
  title = "TRAIT (Radar %)",
  compareList = [],            // [{ label, vector:[0..1,...], visible:true/false, color?: "#hex" }]
  // 🎨 ตัวเลือกสี/สไตล์ (optional)
  youColor = "#60a5fa",
  youFillOpacity = 0.35,
  youStrokeWidth = 2,
  palette = ["#34d399", "#f59e0b", "#a78bfa", "#f472b6", "#22d3ee"],
  cmpFillOpacity = 0.15,
  cmpStrokeWidth = 2,
  gridColor = "rgba(20,20,20,0.15)",
  axisColor = "#141414",
}) {
  // เตรียมข้อมูลหลักเป็น %
  const base = traits.map((t, i) => ({
    trait: t,
    you: (vector[i] ?? 0) * 100,
  }));

  // รวมคอลัมน์เส้นเทียบเข้ากับ data ตาม index trait
  const data = base.map((row, idx) => {
    const extra = {};
    compareList.forEach((c, k) => {
      extra[`cmp${k}`] = ((c.vector?.[idx] ?? 0) * 100);
    });
    return { ...row, ...extra };
  });

  // เฉพาะรายการที่ visible !== false
  const shown = compareList.filter(c => c?.visible !== false);

  return (
    <div className="w-full h-full p-4">
      {title && <h1 className="grid place-items-center p-2 text-2xl">{title}</h1>}
      <div className="h-[720px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            {/* เส้นกริด / สีกริด */}
            <PolarGrid stroke={gridColor} gridType="polygon" />
            {/* ชื่อแกน (proto, ops, ...) */}
            <PolarAngleAxis
              dataKey="trait"
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            {/* วงรัศมี + % */}
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              stroke={gridColor}
            />
            <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
            <Legend />

            {/* ผู้ใช้ */}
            <Radar
              name="You"
              dataKey="you"
              stroke={youColor}
              fill={youColor}
              fillOpacity={youFillOpacity}
              strokeWidth={youStrokeWidth}
              dot={false}
              isAnimationActive={false}
            />

            {/* อาชีพ/ซีรีส์เทียบ */}
            {shown.map((c, i) => {
              const originalIndex = compareList.indexOf(c); // ต้องชี้คอลัมน์ดิบให้ถูก
              const color = c.color || palette[i % palette.length];
              return (
                <Radar
                  key={c.label ?? `cmp${originalIndex}`}
                  name={c.label}
                  dataKey={`cmp${originalIndex}`}
                  stroke={color}
                  fill={color}
                  fillOpacity={cmpFillOpacity}
                  strokeWidth={cmpStrokeWidth}
                  dot={false}
                  isAnimationActive={false}
                />
              );
            })}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
