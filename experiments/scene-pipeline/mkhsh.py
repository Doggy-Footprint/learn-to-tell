# HSH 기록 페이지: round-hsh/ 기록 → review-hsh/(index.html, d/<t>-<r>.json, s/*.html, img/*.jpg, kit/)
# usage: python3 hsh.py --record && python3 mkhsh.py
import base64, difflib, json, re, shutil, subprocess
from pathlib import Path
E = Path(__file__).resolve().parent; R = E/"round-hsh"; GAL = E/"gallery"/"hsh"; OUT = E/"review-hsh"; K = E.parents[1]/"skills/learn-to-tell/kit"
ledger = json.load(open(R/"ledger.json")); topics = json.load(open(R/"topics.json"))
for d in ("s", "img", "d"): shutil.rmtree(OUT/d, ignore_errors=True); (OUT/d).mkdir(parents=True)
used = set()

def scene(src, name):
    html = src.read_text()
    used.update(re.findall(r'"/kit/([^"]+)"', html))
    html = html.replace('"/kit/', '"../kit/').replace("</head>", "<style>#ltt-expect{display:none!important}</style>\n</head>", 1)
    (OUT/"s"/f"{name}.html").write_text(html); return f"s/{name}.html"

# 썸네일은 반복별 기록 JSON에 data URI로 넣는다. 파일로 두면 artifact 한 버전의 파일 수 상한(511)을 넘는다.
def thumb(src, name):
    if not src.exists(): return None
    out = OUT/"img"/f"{name}.jpg"
    subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "60", "-Z", "640", str(src), "--out", str(out)], capture_output=True)
    if not out.exists(): return None
    uri = "data:image/jpeg;base64," + base64.b64encode(out.read_bytes()).decode(); out.unlink(); return uri

def read(p): return p.read_text() if p.exists() else ""

def shot_of(d, prefix):
    if prefix == "sonnet": d, prefix = d.parent/"review", "scene"
    if prefix == "hdir": d, prefix = d.parent/"hreview", "scene"
    if prefix == "sonnet2": d, prefix = d.parent/"review2", "scene"
    if prefix == "zero-fix": d, prefix = d.parent/"zero-fix-review", "scene"
    for sub, ext in (("final-shots", "png"), ("shots", "jpg"), ("shots", "png")):
        p = d/sub/f"{prefix}-t8s.{ext}"
        if p.exists(): return p
    return d/"missing"

DIFF_FROM = {"review": "Sonnet 장면", "zero-review": "0 장면", "hreview": "Haiku 제작 장면", "review2": "Sonnet 장면(샘플 2개)", "review-2nd": "S4 장면", "zero-review-2nd": "0R 장면",
             "zero-review-3rd": "0RR2 장면", "zero-fix-review": "0F 장면", "zero-fix-review-2nd": "0F 검수 1회 장면"}
items = []
for rep in ledger:
    t, r = rep["topic"], rep["rep"]; base = R/t/r; detail = {}; stages = []
    for st in rep["stages"]:
        d = base/st["stage"]; key = f"{t}-{r}-{st['stage'].replace('/', '-')}"
        prefix = {"zero": "zero", "review": "final", "zero-review": "final", "hreview": "final", "review2": "final", "review-2nd": "final", "zero-review-2nd": "final", "zero-review-3rd": "final", "zero-fix-review": "final", "zero-fix-review-2nd": "final", **{f"zero-{k}{n}": "zero" for k in ("hb", "hf") for n in (1, 2)}}.get(st["stage"], st["stage"].split("/")[-1])
        th = thumb(shot_of(GAL/t/r/st["stage"], prefix), key) if st["stage"] != "sb" else None
        row = {**st, "scene": scene(d/"scene.html", key) if (d/"scene.html").exists() else None, "thumb": bool(th)}
        stages.append(row)
        det = {"prompt": read(d/"prompt.md"), "trace": read(d/"trace.md"), "audit": read(d/"final-audit.txt"), "thumb": th}
        if st["stage"] == "sb": det["doc"] = read(d/"storyboard.md")
        if st["stage"] in ("sonnet", "hdir", "sonnet2"): det["doc"] = read(d/"direction.md")
        if st["stage"] in DIFF_FROM:
            det["doc"] = read(d/"review.md")
            det["diff"] = "".join(difflib.unified_diff(read(d/"before.html").splitlines(True), read(d/"scene.html").splitlines(True), DIFF_FROM[st["stage"]], "검수 후", n=2))
        detail[st["stage"]] = det
    json.dump(detail, open(OUT/"d"/f"{t}-{r}.json", "w"), ensure_ascii=False)
    items.append({**{k: v for k, v in rep.items() if k != "stages"}, "stages": stages})

shutil.rmtree(OUT/"kit", ignore_errors=True); (OUT/"kit/vendor").mkdir(parents=True)
for f in K.glob("ltt*.*"): shutil.copy(f, OUT/"kit"/f.name)
for u in used:
    if u.startswith("vendor/"):
        top = u.split("/")[1]; src = K/"vendor"/top
        if src.is_dir(): shutil.copytree(src, OUT/"kit/vendor"/top, dirs_exist_ok=True)
        else: shutil.copy(src, OUT/"kit/vendor"/top)
for d in ("pretendard", "d2coding", "noto-serif-kr"): shutil.copytree(K/"vendor"/d, OUT/"kit/vendor"/d, dirs_exist_ok=True)

data = {"topics": topics, "reps": items}
(OUT/"index.html").write_text((E/"hsh-view.tpl.html").read_text().replace("/*DATA*/null", json.dumps(data, ensure_ascii=False)))
files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file() and p.name != "index.html")
json.dump(files, open(E/"hsh-files.json", "w"))
print(len(files), "files", sum((OUT/f).stat().st_size for f in files)//1024, "KB")
