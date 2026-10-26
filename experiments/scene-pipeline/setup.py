import json, re, shutil, os
from pathlib import Path
from PIL import Image, ImageDraw
R = Path(__file__).resolve().parents[2]; SK = R/"skills/learn-to-tell"; SH = R/"site/gallery/shots"
E = Path(__file__).resolve().parent
axes = json.load(open(SH/"axes.json"))
HELD = ["10","33","07","12","13","16","04","47"]
def sc(a,b): return 3*(a['structure']==b['structure'])+2*(a['motion']==b['motion'])+(a['composition']==b['composition'])
def neighbors(k):
    v = axes[k]; others = [j for j in axes if j!=k]
    ranked = sorted(others, key=lambda j:(-sc(v,axes[j]), int(j)))
    n1 = ranked[0]
    if axes[n1]['role']==v['role']: n2 = ranked[1]
    else: n2 = next(j for j in ranked if axes[j]['role']==v['role'])
    return [n1, n2]
def meta(k):
    t = (SH/axes[k]['file']).read_text()
    return json.loads(re.search(r'id="ltt-meta">(.*?)</script>', t).group(1))
beat_ids = sorted(int(p.stem[1:]) for p in (SK/"look/shots").glob("s*.jpg"))
TW, TH, G = 217, 136, 6
plan = {}
for k in HELD:
    m = meta(k); a = axes[k]; nb = neighbors(k)
    brief = {"topic_line": a["topic"], **{x: m[x] for x in ("topic","audience","theme","medium","decision","domain") if x in m}, "role": a['role'], "structure": a['structure'], "motion": a['motion'], "composition": a['composition']}
    for arm in "AB":
        ref = E/"refs"/f"s{k}-{arm}"; shutil.rmtree(ref, ignore_errors=True); ref.mkdir(parents=True)
        if arm == "A":
            shutil.copy(SK/"kit/API.md", ref/"API.md"); shutil.copytree(SK/"kit/api", ref/"api")
            look = (SK/"look/look.md").read_text()
            look = "\n".join(l for l in look.split("\n") if not l.startswith(f"| s{k} |"))
            look = look.replace("본보기 49개", "본보기 48개")
            (ref/"look.md").write_text(look)
            (ref/"shots").mkdir()
            for p in (SK/"look/shots").glob("s*.jpg"):
                if p.stem != f"s{k}": shutil.copy(p, ref/"shots"/p.name)
            im = Image.open(SK/"look/board.jpg").convert("RGB")
            i = beat_ids.index(int(k)); x = G+(i%7)*(TW+G); y = G+(i//7)*(TH+G)
            ImageDraw.Draw(im).rectangle([x, y, x+TW-1, y+TH-1], fill=(60,60,60))
            im.save(ref/"board.jpg", quality=88)
        else:
            (ref/"examples").mkdir()
            for j in nb: shutil.copy(SH/axes[j]['file'], ref/"examples"/axes[j]['file'])
            shutil.copy(E/"primitives.md", ref/"primitives.md")
    plan[k] = {"brief": brief, "neighbors_B": nb, "orig": axes[k]['file']}
json.dump(plan, open(E/"plan.json","w"), ensure_ascii=False, indent=1)
for k,v in plan.items(): print(k, v['brief']['role'], v['brief']['structure'], v['brief']['motion'], '-> B', [(j, axes[j]['structure'], axes[j]['motion'], axes[j]['role']) for j in v['neighbors_B']])
