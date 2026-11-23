# 라이브 비교: 기존 가–바 배정(review-key)을 유지하고 장면 HTML과 kit을 review/ 아래에 둔다.
# LTT_ROUND=kw: 장면 orig, K(키워드 본보기), 0(본보기 없음).
# LTT_ROUND=r1: 장면 orig, A1(round0 A-1 기준점), P1, P2, H1, H2. 키는 review-key-r1.json, shot은 LTT_SHOTS(쉼표)로 고른다.
import json, os, re, shutil, secrets
from pathlib import Path
E = Path(__file__).resolve().parent; OUT = E/"review"; K = (Path(__file__).resolve().parents[2]/"skills/learn-to-tell/kit")
plan = json.load(open(E/"plan.json")); R = os.environ.get("LTT_ROUND", "r0")
if os.environ.get("LTT_SHOTS"):
    ax = json.load(open(Path(__file__).resolve().parents[2]/"site/gallery/shots/axes.json"))
    plan = {k: plan.get(k) or {"orig": ax[k]["file"], "brief": {"topic_line": ax[k]["topic"], "role": ax[k]["role"]}} for k in os.environ["LTT_SHOTS"].split(",")}
NAMES = {"r0": ["orig", "A1", "A2", "B1", "B2"], "kw": ["orig", "K", "0"]}.get(R, ["orig", "A1", "P1", "P2", "H1", "H2"])
LABS = "가나다라마바"[:len(NAMES)]
KEY = E/("review-key.json" if R == "r0" else f"review-key-{R}.json")
def src_of(k, n):
    if n == "orig": return E/"gallery/orig"/plan[k]["orig"]
    if R == "kw": return E/f"gallery/kw/s{k}/{n}/scene.html"
    if R == "r0" or n == "A1": return E/f"gallery/runs/s{k}-{n[0]}-{n[1]}/scene.html"
    return E/f"gallery/{R}/s{k}/{n}/scene.html" if n[0] == "P" else E/f"gallery/{R}/s{k}/{n}/refine/scene.html"
key = json.load(open(KEY)) if KEY.exists() else {}
if any(f"s{k}:{LABS[0]}" not in key for k in plan):
    import random; rng = random.Random()
    for k in plan:
        if f"s{k}:{LABS[0]}" in key: continue
        names = NAMES[:]; rng.shuffle(names)
        key.update({f"s{k}:{lab}": n for lab, n in zip(LABS, names)})
    json.dump(key, open(KEY, "w"), ensure_ascii=False, indent=1)
shutil.rmtree(OUT/"s", ignore_errors=True); shutil.rmtree(OUT/"kit", ignore_errors=True)
(OUT/"s").mkdir(parents=True); (OUT/"kit/vendor").mkdir(parents=True)
for f in K.glob("ltt*.*"): shutil.copy(f, OUT/"kit"/f.name)
for f in ["d3.min.js", "plot.umd.min.js", "rough.js"]: shutil.copy(K/"vendor"/f, OUT/"kit/vendor"/f)
for d in ["pretendard", "d2coding", "noto-serif-kr"]: shutil.copytree(K/"vendor"/d, OUT/"kit/vendor"/d)
items = []; skey = {}
for k in plan:
    clips = []
    for lab in LABS:
        n = key[f"s{k}:{lab}"]
        src = src_of(k, n)
        html = src.read_text().replace('"/kit/', '"../kit/')
        html = html.replace("</head>", "<style>#ltt-expect{display:none!important}</style>\n</head>", 1)
        tok = secrets.token_hex(6); (OUT/"s"/f"{tok}.html").write_text(html)
        skey[f"s{k}:{lab}"] = f"s/{tok}.html"; clips.append({"label": lab, "src": f"s/{tok}.html"})
    b = plan[k]["brief"]; items.append({"id": f"s{k}", "topic": b["topic_line"], "role": b["role"], "clips": clips})
json.dump(skey, open(E/"review-live-files.json", "w"), ensure_ascii=False, indent=1)
(OUT/"index.html").write_text((E/os.environ.get("LTT_TPL", "review-score.tpl.html")).read_text().replace("/*DATA*/[]", json.dumps(items, ensure_ascii=False)))
files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file() and p.name != "index.html" and not str(p.relative_to(OUT)).startswith("v/"))
json.dump(files, open(E/"live-files.json", "w"))
print(len(files), "files", sum((OUT/f).stat().st_size for f in files)//1024, "KB")
