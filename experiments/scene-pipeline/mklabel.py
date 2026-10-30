"""mklabel.py -> label-set/ (artifact page + scenes + kit) and label-key.json.
Blind label set: shot cards with beats + chosen HSH scenes, shuffled with a fixed seed; REPEATS earlier scenes come back near the end
for self-agreement; each original goes to dev or holdout (stratified by shot role / HSH topic). The page only sees opaque tokens."""
import html, json, random, re, shutil
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
def sections(md):
    out, cur = {}, None
    for line in md.splitlines():
        if line.startswith("## "): cur = line[3:].strip(); out[cur] = []
        elif cur: out[cur].append(line)
    return {k: "\n".join(v).strip().replace("**", "").replace("`", "") for k, v in out.items()}
def pick(sec, prefix): return next(v for k, v in sec.items() if k.startswith(prefix))
notes = {int(n): html.unescape(t) for n, t in re.findall(r'data-n="(\d+)">.*?<i>움직임</i> (.*?)</p>', (SH/"index.html").read_text(), re.S)}
# Intent shown to the labeler (2026-10-28 user choice A): only what each scene's maker recorded. Shots never had a storyboard;
# their "옮길 원리" is left out because it reads like a legend that fills in what the scene itself fails to show.
intent = {}
for k, v in axes.items():
    n = f"shots/{v['file']}"
    if n not in {x for x, _, _ in shots}: continue
    m = json.loads(re.search(r'id="ltt-meta">(.*?)</script>', (SH/v["file"]).read_text(), re.S).group(1))
    intent[n] = [["대상 독자", m["audience"]], ["결정", m["decision"]], ["주제", v["topic"]], ["무엇이 움직이나", notes[int(k)]],
                 ["비트", "\n".join(b["text"] for b in json.load(open(SH/"beats"/f"s{int(k):02d}.json"))["beats"])]]
for s in HSH:
    t, r, _ = s.split("/")
    b = json.loads(re.search(r"```json\n(.*?)\n```", (E/"round-hsh"/t/r/"sb/prompt.md").read_text(), re.S).group(1))
    sec = sections((E/"round-hsh"/s/"storyboard.md").read_text())
    intent[f"hsh/{s}"] = [["대상 독자", b["audience"]], ["결정", b["decision"]], ["주제", b["topic_line"]],
                          ["독자가 말할 한 문장", pick(sec, "독자가")], ["인과 사슬", pick(sec, "인과 사슬")], ["비트", pick(sec, "비트")]]
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
page = {"items": [{k: v for k, v in i.items() if k not in ("rubric", "metric")} for i in items], "order": [e["token"] for e in entries], "intent": [intent[e["scene"]] for e in entries], "pilot": PILOT}
(OUT/"index.html").write_text((E/"label-set.tpl.html").read_text().replace("/*DATA*/null", json.dumps(page, ensure_ascii=False)))
fl = sorted(str(q.relative_to(OUT)) for q in OUT.rglob("*") if q.is_file() and q.name != "index.html")
json.dump(fl, open(E/"label-set-files.json", "w"))
print(len(entries), "entries,", len(fl), "files", sum((OUT/f).stat().st_size for f in fl)//1024, "KB")
