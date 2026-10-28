"""mklabel.py -> label-set/ (artifact page + scenes + kit) and label-key.json.
Blind label set: shot cards with beats + chosen HSH scenes, shuffled with a fixed seed; REPEATS earlier scenes come back near the end
for self-agreement; each original goes to dev or holdout (stratified by shot role / HSH topic). The page only sees opaque tokens."""
import json, random, shutil
from pathlib import Path
E = Path(__file__).resolve().parent; R = E.parents[1]; K = R/"skills/learn-to-tell/kit"; SH = R/"site/gallery/shots"
OUT = E/"label-set"; KEY = E/"label-key.json"; SEED = 20261028; PILOT = 10; REPEATS = 7
# 2026-10-28: scenes the measurement flagged without a user label (small, no_anim, shake, recreate, hidden, fast), label-missed scenes,
# unflagged clean scenes and one unscored t6 scene (handoff "shot 카드로 사용자 라벨 세트 만들기").
HSH = ["t1/r2/zero", "t1/r3/review-2nd", "t2/r1/hreview", "t2/r2/zero", "t2/r2/zero-review-2nd", "t2/r3/review", "t3/r1/zero-review-2nd",
       "t3/r1/review-2nd", "t3/r2/hreview", "t3/r2/review", "t3/r3/zero-review", "t4/r2/review", "t4/r3/review", "t4/r3/hreview",
       "t5/r1/zero", "t5/r1/hreview", "t5/r2/zero", "t5/r2/review", "t5/r2/hreview", "t6/r2/hreview"]
axes = json.load(open(SH/"axes.json")); beats = {p.stem for p in (SH/"beats").glob("s*.json")}
shots = [(f"shots/{v['file']}", v["role"], SH/v["file"]) for k, v in sorted(axes.items()) if f"s{int(k):02d}" in beats]
hsh = [(f"hsh/{s}", s.split("/")[0], E/"round-hsh"/s/"scene.html") for s in HSH]
rng = random.Random(SEED)
scenes = shots + hsh; rng.shuffle(scenes)
split, odd = {}, 0
for g in sorted({(n.split("/")[0], s) for n, s, _ in scenes}):
    grp = [n for n, s, _ in scenes if (n.split("/")[0], s) == g]; rng.shuffle(grp)
    for i, n in enumerate(grp): split[n] = "dev" if (i + odd) % 2 == 0 else "holdout"
    odd += len(grp) % 2
order = [n for n, _, _ in scenes]
early = order[PILOT:PILOT + 25]
rep_shots = rng.sample([n for n in early if n.startswith("shots/")], REPEATS - 2); rep_hsh = rng.sample([n for n in early if n.startswith("hsh/")], 2)
reps = rep_shots + rep_hsh; rng.shuffle(reps)
for n in reps: order.insert(rng.randint(len(order) - 15, len(order)), n)
src = {n: p for n, _, p in scenes}
shutil.rmtree(OUT, ignore_errors=True); (OUT/"s").mkdir(parents=True); (OUT/"kit/vendor").mkdir(parents=True)
for f in K.glob("ltt*.*"): shutil.copy(f, OUT/"kit"/f.name)
for f in ["d3.min.js", "plot.umd.min.js", "rough.js", "topojson-client.min.js", "d3-sankey.min.js"]: shutil.copy(K/"vendor"/f, OUT/"kit/vendor"/f)
for d in ["pretendard", "d2coding", "noto-serif-kr", "katex", "prism", "world-atlas"]: shutil.copytree(K/"vendor"/d, OUT/"kit/vendor"/d)
seen, entries = set(), []
for pos, n in enumerate(order):
    tok = "%012x" % rng.getrandbits(48)
    html = src[n].read_text().replace('"/kit/', '"../kit/').replace("</head>", "<style>#ltt-expect{display:none!important}</style>\n</head>", 1)
    (OUT/"s"/f"{tok}.html").write_text(html)
    entries.append({"pos": pos + 1, "token": tok, "scene": n, "split": split[n], "repeat_of_pos": next(e["pos"] for e in entries if e["scene"] == n) if n in seen else None})
    seen.add(n)
json.dump({"seed": SEED, "pilot": PILOT, "entries": entries}, open(KEY, "w"), ensure_ascii=False, indent=1)
items = json.load(open(E/"label-items.json"))
page = {"items": [{k: v for k, v in i.items() if k not in ("rubric", "metric")} for i in items], "order": [e["token"] for e in entries], "pilot": PILOT}
(OUT/"index.html").write_text((E/"label-set.tpl.html").read_text().replace("/*DATA*/null", json.dumps(page, ensure_ascii=False)))
fl = sorted(str(q.relative_to(OUT)) for q in OUT.rglob("*") if q.is_file() and q.name != "index.html")
json.dump(fl, open(E/"label-set-files.json", "w"))
print(len(entries), "entries,", len(fl), "files", sum((OUT/f).stat().st_size for f in fl)//1024, "KB")
