import json, random, re, shutil, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import r1
E = r1.E; G = E/"gallery"/"judge"; r1.G = G; r1.LOG = E/"judge.log"
SH = E.parents[1]/"site/gallery/shots"; LABS = "가나다라마바"
USER = {"04": (3, 8, 8), "07": (7, 7, 10), "13": (8, 6, 9), "16": (2, 7, 10), "47": (6, 2, 7), "14": (9, 5, 7), "25": (3, 6, 7), "30": (7, 10, 7), "31": (7, 7, 8), "49": (4, 10, 9)}

PROMPT = """너는 Learn to Tell 수업 장면의 채점관이다. 같은 스토리보드(`storyboard.md`)를 주제로 서로 다른 방법으로 만든 장면 {n}개({labs})를 블라인드로 비교해 장면마다 10점 만점으로 매긴다.

## 장면이 해야 하는 일
수업 장면은 infographic animation이다. 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 기준
- 정확성: 스토리보드의 사실 점검표(방향·부호·보존량·단위·수치)와 어긋나지 않는다.
- 생성 순서와 디테일: 대상이 메커니즘 안에서 실제로 생기고 바뀌는 순서대로 나타난다(예: 파서가 만드는 트리는 잎부터 위로 자란다). 핵심 과정이 생략되지 않는다.
- 효율: 한 화면에서 핵심이 바로 읽힌다. 군더더기 글과 장식이 없다.
- 표현력: 세련됨, 창의성, 메커니즘을 보여 주는 그림의 힘.
- 체계성: 단계와 강조가 일관되고 따라가기 쉽다.
- 화면 결함: 겹침, 잘림, 빈 화면, 읽을 수 없는 글, 멈추거나 끝나지 않는 움직임은 크게 감점한다.

## 읽을 것
`storyboard.md`, `index.txt`(장면별 스크린샷 목록), 각 장면의 `scenes/<라벨>.html`, 그리고 `shots/` 아래 스크린샷 전부를 한 응답에서 함께 Read한다. 그 밖의 경로는 읽지 않는다. 파일을 쓰지 않는다.

## 답
장면마다 근거 한두 문장을 쓴 뒤, 맨 끝에 이 JSON 블록 하나로 답한다. 점수는 1–10 정수이고 같은 점수를 여러 장면에 줘도 된다:
```json
{{"scores": {{{example}}}, "best": "라벨", "why": "한 문장"}}
```
"""

def shots_of(src_dir, gal_rel, out, lab):
    """장면을 gallery/judge 아래에 두고 기본 화면을 찍는다."""
    ix = r1.shots(src_dir, out, lab, small=True)
    return [f"{lab} | {s['name']} | {s['file'] or '-'} | {s['note']}" for s in ix["shots"]] + [f"{lab} | pageerror | - | {e}" for e in ix["errors"]]

def prep(gid, storyboard, scenes):
    """scenes: [(arm, html_path)] → 무작위 라벨, 장면 복사, 스크린샷, 키."""
    d = G/gid; key_f = d/"key.json"
    if key_f.exists() and (d/"index.txt").exists(): return json.load(open(key_f))
    shutil.rmtree(d, ignore_errors=True); (d/"scenes").mkdir(parents=True); (d/"shots").mkdir()
    shutil.copy(storyboard, d/"storyboard.md")
    arms = scenes[:]; random.shuffle(arms); key = {}; lines = []
    for lab, (arm, src) in zip(LABS, arms):
        key[lab] = arm; sd = d/"src"/lab; sd.mkdir(parents=True)
        shutil.copy(src, sd/"scene.html"); shutil.copy(src, d/"scenes"/f"{lab}.html")
        lines += shots_of(sd, None, d/"shots", lab)
    (d/"index.txt").write_text("장면 | 상태 | 파일 | 메모\n" + "\n".join(lines) + "\n")
    shutil.rmtree(d/"src")
    json.dump(key, open(key_f, "w"), ensure_ascii=False); return key

def judge(gid, n):
    d = G/gid
    if (d/"verdict.json").exists(): return json.load(open(d/"verdict.json"))
    labs = LABS[:n]
    res = r1.claude(d, "opus", PROMPT.format(n=n, labs=", ".join(labs), example=", ".join(f'"{l}": 7' for l in labs)), ["Read"], turns=8, effort="medium")
    v = json.loads(re.findall(r"```json\s*(\{.*?\})\s*```", res["result"], re.S)[-1]); v["cost"] = res["cost"]
    json.dump(v, open(d/"verdict.json", "w"), ensure_ascii=False, indent=1); return v

def kw_groups():
    ax = r1.ax; out = []
    for k in USER:
        s = E/"round-kw"/f"s{k}"
        out.append((f"kw-s{k}", s/"sb"/"storyboard.md", [("orig", SH/ax[k]["file"]), ("K", s/"K"/"scene.html"), ("0", s/"0"/"scene.html")]))
    return out

def hsh_groups():
    H = E/"gallery"/"hsh"; out = []
    arms = {"zero": "zero", "S3": "sonnet", "S4": "review", "0R": "zero-review", "HHH": "hreview", "S4-2": "review2"}
    for p in sorted(H.glob("t*/r*")):
        if all((p/v/"scene.html").exists() for v in arms.values()):
            out.append((f"hsh-{p.parent.name}-{p.name}", p/"sb"/"storyboard.md", [(a, p/v/"scene.html") for a, v in arms.items()]))
    return out

def retest_groups():
    return [(f"hsh2-{g[0][4:]}", g[1], g[2]) for g in hsh_groups() if g[0].endswith("-r1")]

def second_groups():
    H = E/"gallery"/"hsh"; out = []
    arms = {"S4": "review", "S4R2": "review-2nd", "0R": "zero-review", "0RR2": "zero-review-2nd"}
    for p in sorted(H.glob("t*/r*")):
        if all((p/v/"scene.html").exists() for v in arms.values()):
            out.append((f"hsh3-{p.parent.name}-{p.name}", p/"sb"/"storyboard.md", [(a, p/v/"scene.html") for a, v in arms.items()]))
    return out

def third_groups():
    H = E/"gallery"/"hsh"; out = []
    arms = {"0RR2": "zero-review-2nd", "0RR3": "zero-review-3rd", "S4R2": "review-2nd"}
    for p in sorted(H.glob("t*/r*")):
        if all((p/v/"scene.html").exists() for v in arms.values()):
            out.append((f"hsh4-{p.parent.name}-{p.name}", p/"sb"/"storyboard.md", [(a, p/v/"scene.html") for a, v in arms.items()]))
    return out

def fix_groups():
    H = E/"gallery"/"hsh"; out = []
    arms = {"zero": "zero", "0RR2": "zero-review-2nd", "0F": "zero-fix", "0FRR2": "zero-fix-review-2nd"}
    for p in sorted(H.glob("t*/r*")):
        if all((p/v/"scene.html").exists() for v in arms.values()):
            out.append((f"hsh5-{p.parent.name}-{p.name}", p/"sb"/"storyboard.md", [(a, p/v/"scene.html") for a, v in arms.items()]))
    return out

def run(groups):
    def one(g):
        gid, sb, scenes = g
        try: key = prep(gid, sb, scenes); v = judge(gid, len(scenes))
        except Exception as e: r1.log(f"오류 {gid} {e!r}"); return None
        return {"gid": gid, "key": key, "scores": {key[l]: s for l, s in v["scores"].items() if l in key}, "best": key.get(v.get("best")), "why": v.get("why"), "cost": v.get("cost")}
    with ThreadPoolExecutor(9) as ex: rows = [r for r in ex.map(one, groups) if r]
    return rows

def spearman(a, b):
    def rank(x):
        o = sorted(range(len(x)), key=lambda i: x[i]); r = [0] * len(x); i = 0
        while i < len(o):
            j = i
            while j + 1 < len(o) and x[o[j + 1]] == x[o[i]]: j += 1
            for m in range(i, j + 1): r[o[m]] = (i + j) / 2
            i = j + 1
        return r
    ra, rb = rank(a), rank(b); ma, mb = sum(ra) / len(ra), sum(rb) / len(rb)
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb)); den = (sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb)) ** .5
    return num / den if den else 0

if __name__ == "__main__":
    mode = sys.argv[1]
    rows = run({"kw": kw_groups, "hsh": hsh_groups, "retest": retest_groups, "second": second_groups, "third": third_groups, "fix": fix_groups}[mode]())
    out = {"rows": rows, "cost": round(sum(r["cost"] or 0 for r in rows), 4)}
    if mode == "kw":
        def top(r):
            us = dict(zip(("orig", "K", "0"), USER[r["gid"].split("s")[-1]])); return {a for a, v in us.items() if v == max(us.values())}
        u, j, within = [], [], []
        for r in rows:
            k = r["gid"].split("s")[-1]; us = dict(zip(("orig", "K", "0"), USER[k]))
            for a in ("orig", "K", "0"): u.append(us[a]); j.append(r["scores"][a])
            within.append(spearman([us[a] for a in ("orig", "K", "0")], [r["scores"][a] for a in ("orig", "K", "0")]))
        out.update({"spearman_all": round(spearman(u, j), 3), "spearman_within_mean": round(sum(within) / len(within), 3),
                    "best_match": sum(1 for r in rows if r["best"] in top(r)),
                    "judge_mean": {a: round(sum(r["scores"][a] for r in rows) / len(rows), 2) for a in ("orig", "K", "0")}})
    else:
        arms = ("S4", "S4R2", "0R", "0RR2") if mode == "second" else ("0RR2", "0RR3", "S4R2") if mode == "third" else ("zero", "0RR2", "0F", "0FRR2") if mode == "fix" else ("zero", "S3", "S4", "0R", "HHH", "S4-2")
        out["judge_mean"] = {a: round(sum(r["scores"][a] for r in rows) / len(rows), 2) for a in arms}
        out["best_count"] = {a: sum(1 for r in rows if r["best"] == a) for a in arms}
    (E/"round-judge").mkdir(exist_ok=True); json.dump(out, open(E/"round-judge"/f"{mode}.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in out.items() if k != "rows"}, ensure_ascii=False))
