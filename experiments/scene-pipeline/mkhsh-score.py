import json, random, secrets, shutil
from pathlib import Path
E = Path(__file__).resolve().parent; G = E/"gallery"/"hsh"; OUT = E/"review-hsh-score"; K = E.parents[1]/"skills/learn-to-tell/kit"
T = json.load(open(E/"hsh-topics.json")); KEY = E/"review-key-hsh.json"
ARMS = {"zero": "zero", "0R": "zero-review", "0RR2": "zero-review-2nd", "S4": "review", "S4R2": "review-2nd", "HHH": "hreview"}; LABS = "가나다라마바"
reps = [p for p in sorted(G.glob("t*/r*")) if all((p/d/"scene.html").exists() for d in ARMS.values())]
key = json.load(open(KEY)) if KEY.exists() else {}
rng = random.Random()
for p in reps:
    rid = f"{p.parent.name}-{p.name}"
    if f"{rid}:가" in key: continue
    names = list(ARMS); rng.shuffle(names); key.update({f"{rid}:{l}": n for l, n in zip(LABS, names)})
json.dump(key, open(KEY, "w"), ensure_ascii=False, indent=1)
shutil.rmtree(OUT, ignore_errors=True); (OUT/"s").mkdir(parents=True); (OUT/"kit/vendor").mkdir(parents=True)
for f in K.glob("ltt*.*"): shutil.copy(f, OUT/"kit"/f.name)
for f in ["d3.min.js", "plot.umd.min.js", "rough.js"]:
    if (K/"vendor"/f).exists(): shutil.copy(K/"vendor"/f, OUT/"kit/vendor"/f)
for d in ["pretendard", "d2coding", "noto-serif-kr", "katex"]: shutil.copytree(K/"vendor"/d, OUT/"kit/vendor"/d)
items = []; files = {}
for p in reps:
    rid = f"{p.parent.name}-{p.name}"; clips = []
    for lab in LABS:
        html = (p/ARMS[key[f"{rid}:{lab}"]]/"scene.html").read_text().replace('"/kit/', '"../kit/')
        html = html.replace("</head>", "<style>#ltt-expect{display:none!important}</style>\n</head>", 1)
        tok = secrets.token_hex(6); (OUT/"s"/f"{tok}.html").write_text(html); files[f"{rid}:{lab}"] = f"s/{tok}.html"
        clips.append({"label": lab, "src": f"s/{tok}.html"})
    b = T[p.parent.name]; items.append({"id": rid, "topic": f"{b['topic_line']} (반복 {p.name[1:]})", "role": b["role"], "clips": clips})
json.dump(files, open(E/"review-hsh-score-files.json", "w"), ensure_ascii=False, indent=1)
tpl = (E/"review-score.tpl.html").read_text()
old = "shot마다 장면 다섯 개(가–마)가 섞여 있습니다. 하나는 갤러리 원본이고 나머지는 생성 결과입니다."
assert old in tpl
tpl = tpl.replace(old, "주제·반복마다 같은 스토리보드로 만든 장면 여섯 개(가–바)가 섞여 있습니다. 모두 생성 결과이고, 어느 장면이 어느 방식인지는 채점이 끝난 뒤 공개합니다.")
tpl = tpl.replace("<title>장면 블라인드 비교</title>", "<title>HSH 블라인드 채점</title>", 1)
(OUT/"index.html").write_text(tpl.replace("/*DATA*/[]", json.dumps(items, ensure_ascii=False)))
fl = sorted(str(q.relative_to(OUT)) for q in OUT.rglob("*") if q.is_file() and q.name != "index.html")
json.dump(fl, open(E/"hsh-score-files.json", "w"))
print(len(items), "reps,", len(fl), "files", sum((OUT/f).stat().st_size for f in fl)//1024, "KB")
