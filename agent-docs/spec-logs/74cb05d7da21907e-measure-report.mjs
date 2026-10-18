// Usage: node 74cb05d7da21907e-measure-report.mjs <dump dir> [threshold=0.02]
// 74cb05d7da21907e-measure-patch.py를 적용한 사본으로 뜬 덤프(0041d668222ce019-dom-dump.mjs)에서 #ltt-measure·#ltt-audit을 읽어
// predict 장면별 흐름 안 zmax와 띄우기 고려 zmax의 차이, figure steps 장면의 아래 배치·widen 동작을 JSON으로 낸다.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const [dir, th = "0.02"] = process.argv.slice(2);
const threshold = Number(th);
const grab = (s, id) => {
  const m = new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`).exec(s);
  return m ? JSON.parse(m[1]) : null;
};
const out = { threshold, predict: [], widen: [], stacked: [], audit: {} };
for (const f of readdirSync(dir).sort()) {
  const s = readFileSync(join(dir, f), "utf8");
  const [size, ...rest] = f.split("__");
  const page = rest.join("/");
  const m = grab(s, "ltt-measure"), a = grab(s, "ltt-audit");
  out.audit[`${size} ${page}`] = a ? a.audit.length : "no-audit";
  if (!m) continue;
  for (const [scene, r] of Object.entries(m.predict)) {
    out.predict.push({ size, page, scene: +scene, z0: +r.z0.toFixed(4), zInflow: +r.zInflow.toFixed(4), zFloat: +r.zFloat.toFixed(4),
      gain: +r.gain.toFixed(4), ms: r.ms == null ? null : +r.ms.toFixed(1), real: r.gain > threshold, floats: r.choices.map((c) => `${c.id}:${c.floats ? "F" : "-"}${c.inflow.toFixed(3)}`).join(" "), error: r.error });
  }
  for (const [scene, w] of Object.entries(m.widen)) if (w) out.widen.push({ size, page, scene: +scene, kept: w.kept });
  for (const [scene, st] of Object.entries(m.steps)) if (st.stuck) out.stacked.push({ size, page, scene: +scene });
}
out.realCases = out.predict.filter((p) => p.real).length;
out.maxGain = Math.max(0, ...out.predict.map((p) => p.gain));
console.log(JSON.stringify(out, null, 1));
