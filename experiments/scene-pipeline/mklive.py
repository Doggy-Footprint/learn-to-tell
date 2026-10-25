# 라이브 비교: 기존 가–마 배정(review-key.json)을 유지하고 장면 HTML과 kit을 review/ 아래에 둔다.
import json, os, re, shutil, secrets
from pathlib import Path
E = Path(__file__).resolve().parent; OUT = E/"review"; K = Path("/home/user/learn-to-tell/skills/learn-to-tell/kit")
plan = json.load(open(E/"plan.json"))
if not (E/"review-key.json").exists():
    import random; rng = random.Random(); key = {}
    for k in plan:
        names = ["orig", "A1", "A2", "B1", "B2"]; rng.shuffle(names)
        key.update({f"s{k}:{lab}": n for lab, n in zip("가나다라마", names)})
    json.dump(key, open(E/"review-key.json", "w"), ensure_ascii=False, indent=1)
key = json.load(open(E/"review-key.json"))
shutil.rmtree(OUT/"s", ignore_errors=True); shutil.rmtree(OUT/"kit", ignore_errors=True)
(OUT/"s").mkdir(parents=True); (OUT/"kit/vendor").mkdir(parents=True)
for f in K.glob("ltt*.*"): shutil.copy(f, OUT/"kit"/f.name)
for f in ["d3.min.js", "plot.umd.min.js", "rough.js"]: shutil.copy(K/"vendor"/f, OUT/"kit/vendor"/f)
for d in ["pretendard", "d2coding", "noto-serif-kr"]: shutil.copytree(K/"vendor"/d, OUT/"kit/vendor"/d)
items = []; skey = {}
for k in plan:
    clips = []
    for lab in "가나다라마":
        n = key[f"s{k}:{lab}"]
        src = E/"gallery/orig"/plan[k]["orig"] if n == "orig" else E/f"gallery/runs/s{k}-{n[0]}-{n[1]}/scene.html"
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
