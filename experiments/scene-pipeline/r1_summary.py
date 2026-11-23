# round1 비용 집계: 회차마다 S·L(공통), P, H(샘플 합 + 다듬기). S·L은 P와 H 양쪽에 더한다.
import json, sys
from pathlib import Path
E = Path(__file__).resolve().parent; G = E/"gallery"/"r1"
def res(d):
    for line in open(d/"stream.jsonl"):
        if '"type":"result"' in line: r = json.loads(line); return r["total_cost_usd"], r["duration_ms"]/1000
    return 0, 0
rows = []
for sd in sorted(G.glob("s*")):
    for i in (1, 2):
        if not (sd/f"P{i}").exists(): continue
        s, l, p = res(sd/f"sb{i}"), res(sd/f"L{i}"), res(sd/f"P{i}")
        sm = [res(d) for d in sorted((sd/f"H{i}"/"samples").glob("c*"))]; rf = res(sd/f"H{i}"/"refine")
        sl = s[0] + l[0]; hs = sum(c for c, _ in sm)
        rows.append({"shot": sd.name, "rep": i, "S": round(s[0], 3), "L": round(l[0], 3), "P": round(p[0], 3), "H_samples": round(hs, 3), "n_samples": len(sm),
                     "H_refine": round(rf[0], 3), "P_total": round(sl + p[0], 3), "H_total": round(sl + hs + rf[0], 3),
                     "P_wall_s": round(s[1] + l[1] + p[1]), "H_wall_s": round(s[1] + l[1] + max([w for _, w in sm] or [0]) + rf[1])})
for r in rows: print(json.dumps(r, ensure_ascii=False))
if rows:
    n = len(rows); avg = lambda k: round(sum(r[k] for r in rows) / n, 3)
    print(json.dumps({"n": n, **{f"avg_{k}": avg(k) for k in ("S", "L", "P", "H_samples", "H_refine", "P_total", "H_total", "P_wall_s", "H_wall_s")}}, ensure_ascii=False))
