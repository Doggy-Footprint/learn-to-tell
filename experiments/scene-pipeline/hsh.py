# HSH 실험: 스토리보드(Sonnet) → Haiku 샘플 4개 → Sonnet 방향 정리·제작 → Haiku 검수·수정, 기준선 0(Sonnet 단독). 모두 effort medium.
# usage: python3 hsh.py <topic>[:<rep>]...   예: python3 hsh.py t1:1 / python3 hsh.py t1 t2 (반복 1–3)
#        python3 hsh.py --record   (gallery/hsh → round-hsh 기록 복사, ledger 갱신)
import json, shutil, sys, threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import r1
E = r1.E; G = E/"gallery"/"hsh"; r1.G = G; r1.LOG = E/"hsh.log"
KIT = E.parents[1]/"skills/learn-to-tell/kit"; OUT = E/"round-hsh"
T = json.load(open(E/"hsh-topics.json")); EFF = "medium"; SAMPLES = "abcd"; REPS = (1, 2, 3)
WT = ["Read", "Write", "Edit", "Bash(node:*)"]

SB = """너는 Learn to Tell 수업 장면 한 장의 스토리보드를 쓴다. 결과물은 현재 디렉터리의 `storyboard.md` 하나다.

## 브리프
```json
{brief}
```
`role`은 장면 type, `theme`은 deck theme, `medium`은 그 분야 사람이 보는 매체다.

## 스토리보드가 정할 것: 무엇을 설명하는가
- 장면을 본 독자가 스스로 말할 수 있어야 하는 한 문장.
- 메커니즘의 인과 사슬: 무엇이 무엇을 일으키는가.
- 화면에 꼭 보여야 할 대상과 관계, 강조점 하나.
- 생성 순서: 메커니즘 안에서 각 대상이 실제로 생기고 바뀌는 순서. 예: 파서는 잎 노드를 먼저 만들고 부모를 나중에 만든다(트리가 아래에서 위로 자란다). 애니메이션은 이 순서를 따르므로 순서를 틀리기 쉬운 곳을 짚는다.
- 사실 점검표: 방향·부호·보존량·단위·수치 범위처럼 틀리기 쉬운 것. 구체 수치 예시는 손 계산과 함께 적는다.
- 흔한 오해 하나와, 그 오해를 깨는 순간.
- 비트 3–6개: 비트마다 독자가 알아차릴 것 한 줄.

## 정하지 않을 것
화면 구도, 움직임의 종류, 조작 방식, kit 부품. 장면 작성자가 정한다.

## 규칙
파일을 읽지 않는다. `storyboard.md`를 한 번 Write하고(70줄 이내) 끝낸다. 끝나면 한 문장 요지를 한 줄로 답한다.
"""

def head(b, task, read):
    return f"""너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{json.dumps(b, ensure_ascii=False, indent=1)}
```
- `role`은 장면 type, `theme`은 deck theme이다. 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- `storyboard.md`가 무엇을 설명할지 정한다. 화면 구성(구도, 움직임, 조작)은 네가 정한다.{task}
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.
- 움직임은 스토리보드의 생성 순서를 따른다. 대상은 메커니즘 안에서 실제로 생기는 순서대로 화면에 나타나고 바뀐다.

## 읽을 것
{read}, 그리고 API.md 부품 표에서 고른 `refs/api/<part>.md`만 한 응답에서 함께 Read한다. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.
"""

AUDIT = f"- Write 뒤 `node {E}/audit.mjs scene.html`을 실행한다. \"고침\" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 \"권고\"는 그대로 둬도 된다.\n"

def writer(b):
    return head(b, "", "`storyboard.md`, `refs/API.md`") + f"""
## 규칙
- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
{AUDIT}- 끝나면 무엇을 그렸는지 한 줄로 답한다.
"""

def director(b, have):
    task = (f"\n- `samples/` 아래 {', '.join(f'`{x}.html`' for x in have)}은 Haiku가 같은 스토리보드로 서로 모르고 만든 초안 {len(have)}개이고, `samples/<x>-audit.txt`는 각 초안의 마지막 audit 결과다. "
            "초안들이 무엇을 표현하려 했는지 읽고 방향을 정한 뒤, 그 방향으로 장면을 새로 만든다.")
    return head(b, task, "`storyboard.md`, `samples/*.html`, `samples/*-audit.txt`, `refs/API.md`") + f"""
## direction.md
`scene.html`보다 먼저 `direction.md`를 한 번 Write한다(60줄 이내):
1. 초안마다 한 단락: 표현하려 한 것(그림의 뼈대, 움직임, 조작), 스토리보드의 사실 점검표·생성 순서에 맞는 점과 어긋난 점, 화면 결함으로 보이는 코드.
2. 가져올 것: 어느 초안의 어떤 아이디어나 코드를 쓰는가.
3. 최종 방향 한 단락: 그림의 뼈대, 비트별 움직임(무엇이 어떤 순서로 생기는가), 조작, 화면에 얹을 글.

## 규칙
- `direction.md`를 쓴 뒤 `scene.html`을 한 번에 Write한다. 초안 코드를 가져와도 된다. 고칠 때는 Edit만 쓴다. 자기가 쓴 파일을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
{AUDIT}- 끝나면 첫 줄에 고른 방향을, 둘째 줄에 초안에서 가져온 것을 답한다.
"""

def reviewer(b):
    return f"""너는 Learn to Tell 수업 장면 한 장을 검수하고 고친다. 대상은 현재 디렉터리의 `scene.html`이다. 다른 작성자가 만들었다.

## 브리프
```json
{json.dumps(b, ensure_ascii=False, indent=1)}
```
`storyboard.md`가 무엇을 설명할지, `direction.md`가 작성자가 정한 화면 방향이다. `shots/index.txt`는 이 장면의 기본 화면(t1s·t4s·t8s, 단계마다, 손잡이 양 끝) 스크린샷 목록이고 `shots/scene-audit.txt`는 마지막 audit 결과다.

## 읽을 것
`storyboard.md`, `direction.md`, `scene.html`, `shots/index.txt`, `shots/scene-audit.txt`, `refs/API.md`, 그리고 `shots/` 아래 스크린샷 전부를 한 응답에서 함께 Read한다. 고치는 데 필요하면 API.md 부품 표에서 고른 `refs/api/<part>.md`를 더 Read한다. 그 밖의 경로는 읽거나 검색하지 않는다.

## review.md
고치기 전에 `review.md`를 한 번 Write한다(60줄 이내). 표 하나에 항목마다 `| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |`:
- 스토리보드 사실 점검표의 항목 각각.
- 생성 순서: 대상이 실제로 생기는 순서대로 나타나는가.
- 비트 각각이 화면에서 보이는가.
- 화면 결함: 겹침, 잘림, 빈 프레임, 읽을 수 없는 글, 움직임이 끝나지 않거나 멈추는 곳.

## 규칙
- 실패 항목만 `scene.html`에 Edit로 고친다. `scene.html`을 Write로 새로 쓰지 않는다. 통과 항목과 방향(`direction.md`)은 바꾸지 않는다.
{AUDIT}- 끝나면 `review.md` 끝에 `## 고친 것` 목록을 Edit로 붙인다(항목마다 한 줄). 답은 실패 항목 수와 고친 항목 수 한 줄이다.
"""

def refs(d):
    rd = d/"refs"
    if not rd.exists(): rd.mkdir(parents=True); shutil.copy(KIT/"API.md", rd/"API.md"); shutil.copytree(KIT/"api", rd/"api")

def done(d, f):
    if not ((d/f).exists() and (d/"stream.jsonl").exists()): return False
    r = r1.result(d); return r.get("subtype") == "success" and not r.get("is_error")

def index_txt(ix):
    rows = [f"{s['name']} | {s['file'] or '-'} | {s['note']}" for s in ix["shots"]] + [f"pageerror | - | {e}" for e in ix["errors"]]
    return "상태 | 파일 | 메모\n" + "\n".join(rows) + "\n"

def scene_stage(d, model, prompt, inputs=()):
    d.mkdir(parents=True, exist_ok=True); refs(d)
    for src, name in inputs: shutil.copy(src, d/name)
    if not done(d, "scene.html"): r1.claude(d, model, prompt, WT, effort=EFF)
    r1.audit(d)

def run_rep(t, i):
    b = T[t]; R = G/t/f"r{i}"; sb = R/"sb"; sb.mkdir(parents=True, exist_ok=True)
    if not done(sb, "storyboard.md"): r1.claude(sb, "sonnet", SB.format(brief=json.dumps(b, ensure_ascii=False, indent=1)), ["Write"], turns=10, effort=EFF)
    story = [(sb/"storyboard.md", "storyboard.md")]
    def sample(x):
        d = R/"samples"/x
        try: scene_stage(d, "haiku", writer(b), story)
        except RuntimeError as e: r1.log(f"샘플 실패 {e}"); return
        r1.shots(d, d/"shots", x, small=True)
    def zero():
        d = R/"zero"; scene_stage(d, "sonnet", writer(b), story); r1.shots(d, d/"shots", "zero")
    with ThreadPoolExecutor(5) as ex: list(ex.map(lambda f: f(), [zero] + [lambda x=x: sample(x) for x in SAMPLES]))
    have = [x for x in SAMPLES if (R/"samples"/x/"scene.html").exists()]
    direct(R, b, "sonnet", "sonnet", have)
    review(R, b, R/"sonnet", "review")
    r1.log(f"{t} r{i} 끝"); record()

def direct(R, b, model, name, have):
    so = R/name; (so/"samples").mkdir(parents=True, exist_ok=True)
    for x in have:
        shutil.copy(R/"samples"/x/"scene.html", so/"samples"/f"{x}.html"); shutil.copy(R/"samples"/x/"final-audit.txt", so/"samples"/f"{x}-audit.txt")
    scene_stage(so, model, director(b, have), [(R/"sb"/"storyboard.md", "storyboard.md")])

NODIR = "# direction\n\n작성자가 남긴 방향 기록이 없다. 스토리보드와 장면 자체를 기준으로 검수한다.\n"

def review(R, b, src, name):
    rv = R/name; sh = rv/"shots"; sh.mkdir(parents=True, exist_ok=True)
    if not done(rv, "scene.html"):
        for f in sh.iterdir(): f.unlink()
        ix = r1.shots(src, sh, "scene", small=True)
        (sh/"index.txt").write_text(index_txt(ix)); shutil.copy(src/"final-audit.txt", sh/"scene-audit.txt")
        shutil.copy(src/"scene.html", rv/"before.html")
        if not (src/"direction.md").exists(): (rv/"direction.md").write_text(NODIR)
        dirs = [(src/"direction.md", "direction.md")] if (src/"direction.md").exists() else []
        scene_stage(rv, "haiku", reviewer(b), [(R/"sb"/"storyboard.md", "storyboard.md")] + dirs + [(src/"scene.html", "scene.html")])
    r1.audit(rv); r1.shots(rv, rv/"final-shots", "final")

def ablate(t, i):
    """절제 갈래: 0R(0 + Haiku 검수), HHH(같은 샘플로 Haiku 방향·제작 → Haiku 검수)."""
    b = T[t]; R = G/t/f"r{i}"
    have = [x for x in SAMPLES if (R/"samples"/x/"scene.html").exists()]
    with ThreadPoolExecutor(2) as ex:
        fs = [ex.submit(review, R, b, R/"zero", "zero-review"), ex.submit(lambda: (direct(R, b, "haiku", "hdir", have), review(R, b, R/"hdir", "hreview")))]
        for f in fs: f.result()
    r1.log(f"{t} r{i} 절제 끝"); record()

# 기록: stream.jsonl과 스크린샷은 크므로 gallery/에만 두고, round-hsh/에는 사람이 읽을 trace.md와 비용·사용량을 남긴다.
STAGES = [("sb", "스토리보드", "sonnet"), *[(f"samples/{x}", f"샘플 {x}", "haiku") for x in SAMPLES], ("sonnet", "Sonnet 방향·제작", "sonnet"), ("review", "Haiku 검수·수정", "haiku"), ("zero", "기준선 0", "sonnet"),
          ("zero-review", "0 + Haiku 검수", "haiku"), ("hdir", "Haiku 방향·제작", "haiku"), ("hreview", "Haiku 검수 (Haiku 제작본)", "haiku"),
          ("sonnet2", "Sonnet 방향·제작 (샘플 2개)", "sonnet"), ("review2", "Haiku 검수 (샘플 2개본)", "haiku"),
          ("review-2nd", "Haiku 2회차 검수 (S4)", "haiku"), ("zero-review-2nd", "Haiku 2회차 검수 (0R)", "haiku"),
          ("zero-review-3rd", "Haiku 3회차 검수 (0R)", "haiku"),
          *[(f"zero-{k}{n}", f"hook 실험 {k}{n}", "sonnet") for k in ("hb", "hf") for n in (1, 2)],
          ("zero-fix", "0F (문서 수정본)", "sonnet"), ("zero-fix-review", "0F + Haiku 검수", "haiku"), ("zero-fix-review-2nd", "0F + Haiku 2회차 검수", "haiku")]
KEEP = {"prompt.md", "storyboard.md", "scene.html", "direction.md", "review.md", "before.html", "final-audit.txt", "attempts.jsonl", "trace.md"}

def trace(d):
    lines = []
    for p in sorted(d.glob("stream*.jsonl")):
        lines.append(f"# {p.name}\n")
        for line in open(p):
            try: x = json.loads(line)
            except Exception: continue
            if x.get("type") == "assistant":
                for c in x["message"].get("content", []):
                    if c.get("type") == "text" and c["text"].strip(): lines.append(f"- 말: {c['text'].strip()[:400]}")
                    if c.get("type") == "tool_use":
                        a = c["input"]; arg = a.get("file_path") or a.get("command") or ""
                        lines.append(f"- {c['name']} `{arg}`" + (f" (+{len(a.get('content', ''))}자)" if c["name"] == "Write" else ""))
            elif x.get("type") == "user":
                for c in x["message"].get("content", []) if isinstance(x["message"].get("content"), list) else []:
                    if c.get("type") == "tool_result" and c.get("is_error"): lines.append(f"  - 도구 오류: {str(c.get('content'))[:200]}")
            elif x.get("type") == "result": lines.append(f"- 결과: {x.get('subtype')} ${x.get('total_cost_usd', 0):.4f} {x.get('num_turns')}턴 {round(x.get('duration_ms', 0)/1000)}s")
    return "\n".join(lines) + "\n"

def stage_row(d):
    att = [json.loads(l) for l in open(d/"attempts.jsonl")] if (d/"attempts.jsonl").exists() else []
    tok = lambda k: sum((a.get("usage") or {}).get(k) or 0 for a in att)
    fa = (d/"final-audit.txt").read_text().strip().splitlines()[-1] if (d/"final-audit.txt").exists() else ""
    return {"cost": round(sum(a.get("cost") or 0 for a in att), 4), "wall_s": sum(a.get("wall_s") or 0 for a in att), "attempts": len(att),
            "turns": att[-1].get("turns") if att else None, "in_tok": tok("input_tokens"), "cache_write": tok("cache_creation_input_tokens"),
            "cache_read": tok("cache_read_input_tokens"), "out_tok": tok("output_tokens"), "audit": fa, "answer": (att[-1].get("result") or "")[:300] if att else ""}

LOCK = threading.Lock()

def record():
    with LOCK: _record()

def _record():
    ledger = []
    for R in sorted(G.glob("t*/r*")):
        t, i = R.parent.name, R.name
        rows = []
        for sd, name, model in STAGES:
            d = R/sd
            if not d.exists(): continue
            (d/"trace.md").write_text(trace(d))
            o = OUT/t/i/sd; o.mkdir(parents=True, exist_ok=True)
            for f in d.iterdir():
                if f.name in KEEP: shutil.copy(f, o/f.name)
            rows.append({"stage": sd, "name": name, "model": r1.M[model], "effort": EFF, **stage_row(d)})
        c = {r["stage"]: r["cost"] for r in rows}; base = c.get("sb", 0) + sum(v for k, v in c.items() if k.startswith("samples/"))
        pipe = base + c.get("sonnet", 0) + c.get("review", 0)
        arms = {"zr_cost": round(c["zero"] + c["zero-review"], 4) if "zero-review" in c and "zero" in c else None,
                "hhh_cost": round(base + c["hdir"] + c["hreview"], 4) if "hreview" in c else None,
                "s2_cost": round(c.get("sb", 0) + c.get("samples/a", 0) + c.get("samples/b", 0) + c["sonnet2"] + c["review2"], 4) if "review2" in c else None,
                "s4r2_cost": round(pipe + c["review-2nd"], 4) if "review-2nd" in c else None,
                "zrr2_cost": round(c["zero"] + c["zero-review"] + c["zero-review-2nd"], 4) if "zero-review-2nd" in c else None,
                "zrr3_cost": round(c["zero"] + c["zero-review"] + c["zero-review-2nd"] + c["zero-review-3rd"], 4) if "zero-review-3rd" in c else None,
                "frr2_cost": round(c["zero-fix"] + c["zero-fix-review"] + c["zero-fix-review-2nd"], 4) if "zero-fix-review-2nd" in c else None}
        ledger.append({"topic": t, "rep": i, "topic_line": T[t]["topic_line"], "pipeline_cost": round(pipe, 4),
                       "zero_cost": next((r["cost"] for r in rows if r["stage"] == "zero"), None), **arms, "stages": rows})
    OUT.mkdir(exist_ok=True); json.dump(ledger, open(OUT/"ledger.json", "w"), ensure_ascii=False, indent=1)
    shutil.copy(E/"hsh-topics.json", OUT/"topics.json")

if __name__ == "__main__":
    if sys.argv[1] == "--record": record(); sys.exit()
    if sys.argv[1] == "--docfix":
        # 실험용 API.md 복사본에만 생성기 수정 후보 두 개를 넣는다(kit 원본은 그대로): hook 그림은 mount로, 시각 칸 함수는 붙기 전에 불린다.
        FIX = [("| `hook` | `art`(아이콘 이름·HTML), `pre`, `text`, `sub`. 첫 장면 |",
                "| `hook` | `art`(아이콘 이름·작은 HTML. 제목 옆 작은 자리), `pre`, `text`, `sub`. 첫 장면. 메커니즘 그림이 주인공이면 `art`가 아니라 `mount`로 무대 전체에 그린다 |"),
               ("시각 칸(`figure`, `visual`, `answerVisual`)은 HTML 문자열, 노드, 또는 `(el) => …` 함수를 받는다.",
                "시각 칸(`figure`, `visual`, `answerVisual`)은 HTML 문자열, 노드, 또는 `(el) => …` 함수를 받는다. 함수는 칸이 문서에 붙기 전에 불릴 수 있다(`el.isConnected`가 false, 크기 0). 움직임은 `requestAnimationFrame` 뒤에 시작하고, `isConnected`로 멈춤을 판정하지 않는다.")]
        def df(t, i):
            R = G/t/f"r{i}"; d = R/"zero-fix"; d.mkdir(parents=True, exist_ok=True); refs(d)
            api = (d/"refs"/"API.md").read_text()
            for o, n in FIX:
                if n not in api: assert o in api, o; api = api.replace(o, n)
            (d/"refs"/"API.md").write_text(api)
            scene_stage(d, "sonnet", writer(T[t]), [(R/"sb"/"storyboard.md", "storyboard.md")])
            review(R, T[t], d, "zero-fix-review"); review(R, T[t], R/"zero-fix-review", "zero-fix-review-2nd")
            r1.log(f"{t} r{i} docfix 끝")
        jobs = [(p.parent.name, int(p.name[1:])) for p in sorted(G.glob("t*/r*")) if (p/"sb"/"storyboard.md").exists()]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(df, t, i) for t, i in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        record(); sys.exit()
    if sys.argv[1] == "--hookbase":
        def hb(t, i, n):
            R = G/t/f"r{i}"; d = R/f"zero-hb{n}"
            scene_stage(d, "sonnet", writer(T[t]), [(R/"sb"/"storyboard.md", "storyboard.md")]); r1.shots(d, d/"shots", "zero")
            r1.log(f"{t} r{i} hookbase{n} 끝")
        jobs = [("t4", i, n) for i in REPS for n in (1, 2)]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(hb, *j) for j in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        sys.exit()
    if sys.argv[1] == "--hookfix":
        # 실험용 API.md 복사본에서만 hook 행을 고친다(kit 원본은 그대로). 기준: 같은 스토리보드의 zero가 art에 그림을 넣는 비율.
        OLD = "| `hook` | `art`(아이콘 이름·HTML), `pre`, `text`, `sub`. 첫 장면 |"
        NEW = "| `hook` | `art`(아이콘 이름·작은 HTML. 제목 옆 작은 자리), `pre`, `text`, `sub`. 첫 장면. 메커니즘 그림이 주인공이면 `art`가 아니라 `mount`로 무대 전체에 그린다 |"
        def hf(t, i, n):
            R = G/t/f"r{i}"; d = R/f"zero-hf{n}"; d.mkdir(parents=True, exist_ok=True); refs(d)
            api = (d/"refs"/"API.md").read_text(); assert OLD in api; (d/"refs"/"API.md").write_text(api.replace(OLD, NEW))
            scene_stage(d, "sonnet", writer(T[t]), [(R/"sb"/"storyboard.md", "storyboard.md")]); r1.shots(d, d/"shots", "zero")
            r1.log(f"{t} r{i} hookfix{n} 끝")
        jobs = [("t4", i, n) for i in REPS for n in (1, 2)]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(hf, *j) for j in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        sys.exit()
    if sys.argv[1] == "--third":
        def third(t, i):
            R = G/t/f"r{i}"; review(R, T[t], R/"zero-review-2nd", "zero-review-3rd"); r1.log(f"{t} r{i} 3회차 끝")
        jobs = [(p.parent.name, int(p.name[1:])) for p in sorted(G.glob("t*/r*")) if (p/"zero-review-2nd"/"final-shots").exists()]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(third, t, i) for t, i in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        record(); sys.exit()
    if sys.argv[1] == "--rereview":
        def again(t, i):
            R = G/t/f"r{i}"
            with ThreadPoolExecutor(2) as ex:
                for f in [ex.submit(review, R, T[t], R/"review", "review-2nd"), ex.submit(review, R, T[t], R/"zero-review", "zero-review-2nd")]: f.result()
            r1.log(f"{t} r{i} 재검수 끝"); record()
        jobs = [(p.parent.name, int(p.name[1:])) for p in sorted(G.glob("t*/r*")) if (p/"zero-review"/"final-shots").exists()]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(again, t, i) for t, i in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        sys.exit()
    if sys.argv[1] == "--ablate2":
        def two(t, i):
            R = G/t/f"r{i}"; have = [x for x in "ab" if (R/"samples"/x/"scene.html").exists()]
            direct(R, T[t], "sonnet", "sonnet2", have); review(R, T[t], R/"sonnet2", "review2"); r1.log(f"{t} r{i} 샘플2 끝"); record()
        jobs = [(p.parent.name, int(p.name[1:])) for p in sorted(G.glob("t*/r*")) if (p/"review"/"final-shots").exists()]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(two, t, i) for t, i in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        sys.exit()
    if sys.argv[1] == "--ablate":
        jobs = [(p.parent.name, int(p.name[1:])) for p in sorted(G.glob("t*/r*")) if (p/"review"/"final-shots").exists()]
        with ThreadPoolExecutor(len(jobs)) as ex:
            for f in [ex.submit(ablate, t, i) for t, i in jobs]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
        sys.exit()
    jobs = [(a.split(":")[0], int(a.split(":")[1])) if ":" in a else None for a in sys.argv[1:]]
    jobs = [j for a, j in zip(sys.argv[1:], jobs) if j] + [(a, i) for a in sys.argv[1:] if ":" not in a for i in REPS]
    with ThreadPoolExecutor(len(jobs)) as ex:
        for f in [ex.submit(run_rep, t, i) for t, i in jobs]:
            try: f.result()
            except Exception as e: r1.log(f"오류 {e!r}")
