# round1: 스토리보드(Opus) → 계획(Sonnet) → P: Sonnet 바로 생성 / H: Haiku 구성안별 샘플 → Sonnet 고르고 다듬기
# usage: python3 r1.py <shot>... [--jobs N]   (작업 디렉터리 gallery/r1/s<k>/)
import json, os, re, shutil, subprocess, sys, threading, time, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
E = Path(__file__).resolve().parent; G = E/"gallery"/"r1"
M = {"opus": "claude-opus-5-5", "sonnet": "claude-sonnet-5-5", "haiku": "claude-haiku-5-5"}
plan = json.load(open(E/"plan.json")); ax = json.load(open("/home/user/learn-to-tell/site/gallery/shots/axes.json"))
LOG = E/"r1.log"; SEM = threading.Semaphore(int(os.environ.get("R1_PAR", "8")))

def log(s):
    with open(LOG, "a") as f: f.write(time.strftime("%H:%M:%S ") + s + "\n")
    print(s, flush=True)

def claude(d, model, prompt, tools, turns=60):
    """작업 디렉터리 d에서 claude -p를 돌린다. 세션 환경 변수를 지워 이 세션과 context를 나눈다."""
    (d/"prompt.md").write_text(prompt)
    env = {k: v for k, v in os.environ.items() if k not in ("CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_REMOTE_SESSION_ID", "CLAUDE_CODE_CHILD_SESSION")}
    cmd = ["timeout", "1800", "claude", "-p", prompt, "--model", M[model], "--effort", "high", "--session-id", str(uuid.uuid4()),
           "--strict-mcp-config", "--output-format", "stream-json", "--verbose", "--max-turns", str(turns),
           "--allowedTools", *tools, "--disallowedTools", "WebSearch", "WebFetch", "Agent", "Task", "Skill", "Glob", "Grep"]
    for attempt in range(3):
        t = time.time()
        with SEM, open(d/"stream.jsonl", "w") as out, open(d/"stderr.log", "w") as err:
            rc = subprocess.run(cmd, cwd=d, env=env, stdout=out, stderr=err).returncode
        r = result(d)
        log(f"{d.relative_to(G)} {model} rc={rc} {round(time.time()-t)}s ${r.get('cost')} {r.get('subtype')}")
        if r.get("subtype") == "success" and not r.get("is_error"): return r
        time.sleep(20 * (attempt + 1))
    raise RuntimeError(f"{d} 실패")

def result(d):
    res = None
    for line in open(d/"stream.jsonl"):
        try: x = json.loads(line)
        except Exception: continue
        if x.get("type") == "result": res = x
    if not res: return {}
    return {"cost": round(res.get("total_cost_usd", 0), 4), "wall_s": round(res.get("duration_ms", 0)/1000), "turns": res.get("num_turns"),
            "out_tok": res.get("usage", {}).get("output_tokens"), "subtype": res.get("subtype"), "is_error": res.get("is_error"), "result": res.get("result", "")}

def brief(k):
    b = dict(plan[k]["brief"]); [b.pop(x) for x in ("structure", "motion", "composition")]; return b

def refs(d, k):
    d.mkdir(parents=True, exist_ok=True)
    if not (d/"refs").exists(): os.symlink(E/"refs"/f"s{k}-B", d/"refs")

def put(d, *files):
    for f in files: shutil.copy(f, d/f.name)

EX = lambda k: ", ".join(f"`refs/examples/{ax[j]['file']}`" for j in plan[k]["neighbors_B"])

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
- 사실 점검표: 방향·부호·보존량·단위·수치 범위처럼 틀리기 쉬운 것. 구체 수치 예시는 손 계산과 함께 적는다.
- 흔한 오해 하나와, 그 오해를 깨는 순간.
- 비트 3–6개: 비트마다 독자가 알아차릴 것 한 줄.

## 정하지 않을 것
화면 구도, 움직임의 종류, 조작 방식, kit 부품. 다음 단계가 구성안 여러 개로 정한다.

## 규칙
파일을 읽지 않는다. `storyboard.md`를 한 번 Write하고(60줄 이내) 끝낸다. 끝나면 한 문장 요지를 한 줄로 답한다.
"""

PL = """너는 Learn to Tell 수업 장면 한 장의 제작 계획을 쓴다. 결과물은 현재 디렉터리의 `plan.md` 하나다.

## 입력
- 브리프: ```json
{brief}
```
- `storyboard.md`: 무엇을 설명할지. 계획은 이것을 바꾸지 않고 화면으로 옮긴다.
- `refs/primitives.md`와 본보기 {ex}: 장면 파일이 어떻게 생기는지(kit으로 무엇을 할 수 있는지) 알려 준다. 본보기의 주제·배치는 옮기지 않는다.

이 파일들을 한 응답에서 함께 Read한다. 그 밖의 경로는 읽지 않는다.

## plan.md에 쓸 것
1. 구성안 3–5개(`c1`…). 서로 닮지 않아야 한다: 개념 구조(그림의 뼈대), 움직임(자동 재생 비트 / 단계 `steps` / 손잡이 `LTT.sweep`), 구도 가운데 둘 이상이 달라야 한다. 구성안마다: 화면 배치, 움직임과 조작, 스토리보드 비트를 어떻게 보이는지, 실패 위험 한 줄.
2. 추천 구성안 하나와 이유.
3. 검사 지점 목록(`k1`…, 4–8개): 구성안과 무관하게 스토리보드 비트·사실 점검표 기준으로, "어느 상태에서 무엇이 보여야 하는가"를 한 줄씩. 예: "전류가 분기점에 들어온 뒤: 나가는 두 갈래의 화살표 합 = 들어온 양, 전류는 + → −, 전자는 반대". 그림이 칸 안에 다 보이고 찌그러지지 않는다는 지점도 하나 넣는다.
4. 맨 끝에 이 JSON 블록: ```json
{{"options": ["c1", "c2", ...], "recommended": "cN", "checks": ["k1", ...]}}
```

## 규칙
`plan.md`를 한 번 Write하고 끝낸다(120줄 이내). 끝나면 추천 구성안을 한 줄로 답한다.
"""

CHECKS = """## 검사 지점 블록
plan.md의 검사 지점마다, 내 장면에서 그 상태에 도달하는 방법을 `<head>` 안에 적는다:
```html
<script type="application/json" id="ltt-checks">
[{"id": "k1", "expect": "plan.md의 검사 지점 문장", "reach": [{"step": 3}, {"wait": 1500}]}]
</script>
```
`reach`는 장면을 새로 연 상태에서 차례로 하는 동작이다:
- `{"wait": ms}`: 기다림(자동 재생 장면은 그 비트가 보이는 시각).
- `{"step": n}`: 그림 단계 n번째로(1부터, figure `steps`·`LTT.stepper`의 "다음" 단추).
- `{"knob": "id", "stop": i}`: `steps` 손잡이 `#id`의 i번째(0부터) 단추. `{"knob": "id", "value": v}`: range 손잡이 `#id`의 입력값.
- `{"click": "css 선택자"}`.
녹화 스크립트가 이 동작으로 지점마다 스크린샷을 찍어 검토에 쓴다.
"""

def writer(k, task, extra_read="", extra_rules=""):
    return f"""너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{json.dumps(brief(k), ensure_ascii=False, indent=1)}
```
- `role`은 장면 type, `theme`은 deck theme이다. 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- `storyboard.md`가 무엇을 설명할지, `plan.md`가 화면 구성과 검사 지점을 정한다. {task}
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 읽을 것
`storyboard.md`, `plan.md`, `refs/primitives.md`, 본보기 {EX(k)}{extra_read}를 한 응답에서 함께 Read한다. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.

{CHECKS}
## 규칙
{extra_rules}- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node {E}/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 무엇을 그렸는지 한 줄로 답한다.
"""

WT = ["Read", "Write", "Edit", "Bash(node:*)"]

def audit(d):
    p = subprocess.run(["node", str(E/"audit.mjs"), str(d/"scene.html")], capture_output=True, text=True)
    (d/"final-audit.txt").write_text(p.stdout + p.stderr); return p.returncode == 0

def shots(d, out, prefix, small=False):
    subprocess.run(["node", str(E/"shots.mjs"), str(out), prefix, str((d/"scene.html").relative_to(E/"gallery"))] + (["--small"] if small else []), capture_output=True, text=True)
    return json.load(open(out/f"{prefix}-index.json"))

def stage_sb(k, i):
    d = G/f"s{k}"/f"sb{i}"; d.mkdir(parents=True, exist_ok=True)
    if (d/"storyboard.md").exists() and result(d).get("subtype") == "success": return
    claude(d, "opus", SB.format(brief=json.dumps(brief(k), ensure_ascii=False, indent=1)), ["Write"], turns=10)

def stage_plan(k, i):
    d = G/f"s{k}"/f"L{i}"; refs(d, k); put(d, G/f"s{k}"/f"sb{i}"/"storyboard.md")
    if not ((d/"plan.md").exists() and result(d).get("subtype") == "success"):
        claude(d, "sonnet", PL.format(brief=json.dumps(brief(k), ensure_ascii=False, indent=1), ex=EX(k)), ["Read", "Write"], turns=15)
    j = re.findall(r"```json\s*(\{.*?\})\s*```", (d/"plan.md").read_text(), re.S)
    meta = json.loads(j[-1]); json.dump(meta, open(d/"plan-meta.json", "w"), ensure_ascii=False); return meta

def inputs(d, k, i):
    refs(d, k); put(d, G/f"s{k}"/f"sb{i}"/"storyboard.md", G/f"s{k}"/f"L{i}"/"plan.md")

def stage_P(k, i, meta):
    d = G/f"s{k}"/f"P{i}"; inputs(d, k, i)
    if not (d/"scene.html").exists(): claude(d, "sonnet", writer(k, f"plan.md의 추천 구성안 `{meta['recommended']}`으로 만든다."), WT)
    audit(d); shots(d, d/"shots", "P")

def stage_sample(k, i, c):
    d = G/f"s{k}"/f"H{i}"/"samples"/c; inputs(d, k, i)
    if not (d/"scene.html").exists():
        try: claude(d, "haiku", writer(k, f"plan.md의 구성안 `{c}`으로 만든다(추천 여부와 무관하게 `{c}`)."), WT)
        except RuntimeError: return
    if (d/"scene.html").exists(): audit(d); shots(d, G/f"s{k}"/f"H{i}"/"refine"/"shots", c, small=True)

def stage_H(k, i, meta):
    h = G/f"s{k}"/f"H{i}"; r = h/"refine"
    with ThreadPoolExecutor(len(meta["options"])) as ex: list(ex.map(lambda c: stage_sample(k, i, c), meta["options"]))
    inputs(r, k, i); (r/"samples").mkdir(exist_ok=True)
    have = [c for c in meta["options"] if (h/"samples"/c/"scene.html").exists()]
    for c in have:
        shutil.copy(h/"samples"/c/"scene.html", r/"samples"/f"{c}.html"); shutil.copy(h/"samples"/c/"final-audit.txt", r/"samples"/f"{c}-audit.txt")
    lines = []
    for c in have:
        ix = json.load(open(r/"shots"/f"{c}-index.json"))
        for s in ix["shots"]: lines.append(f"{c} | {s['name']} | {s['file'] or '-'} | {s.get('expect') or s['note']}")
        for e in ix["errors"]: lines.append(f"{c} | pageerror | - | {e}")
    (r/"shots"/"index.txt").write_text("초안 | 상태 | 파일 | 기대(검사 지점) 또는 메모\n" + "\n".join(lines) + "\n")
    task = (f"`samples/` 아래는 Haiku가 plan.md의 구성안마다 하나씩 만든 초안({', '.join(have)})이고, `samples/cN-audit.txt`는 그 마지막 audit 결과다. "
            f"`shots/index.txt`는 초안마다 기본 화면(t1s·t4s·t8s, 단계, 손잡이 양 끝)과 검사 지점 스크린샷 목록이다. "
            f"스토리보드와 검사 지점을 기준으로 가장 나은 초안 하나를 골라 출발점으로 삼는다.")
    rules = (f"- 순서: (1) 위 문서와 `shots/index.txt`, 모든 초안 HTML을 함께 Read한다. (2) 고르는 데 필요한 스크린샷(검사 지점 위주)을 한 응답에서 함께 Read한다. "
             f"(3) `cp samples/cN.html scene.html`로 고른 초안을 옮긴다. 이 파일은 이미 읽은 초안이므로 다시 Read하지 않는다. "
             f"(4) 스토리보드·검사 지점에 어긋나는 점, 사실 오류, 화면 결함을 Edit로 고친다. 다른 초안의 좋은 부분을 옮겨 와도 된다. `ltt-checks` 블록이 내 장면에 맞는지도 확인한다.\n"
             f"- 이 경우에 한해 `scene.html`을 Write로 새로 쓰지 않는다(초안을 다듬는 것이 이 단계의 일이다).\n"
             f"- 끝날 때 답 첫 줄은 `고른 초안: cN — 이유`, 둘째 줄은 무엇을 고쳤는지다.\n")
    if not (r/"scene.html").exists():
        claude(r, "sonnet", writer(k, task, extra_read=", `shots/index.txt`, `samples/*.html`", extra_rules=rules), WT + ["Bash(cp:*)"])
    audit(r); shots(r, r/"final-shots", "H")

def run_rep(k, i):
    stage_sb(k, i); meta = stage_plan(k, i)
    with ThreadPoolExecutor(2) as ex:
        fs = [ex.submit(stage_P, k, i, meta), ex.submit(stage_H, k, i, meta)]
        for f in fs: f.result()
    log(f"s{k} rep{i} 끝")

if __name__ == "__main__":
    ks = [a for a in sys.argv[1:] if not a.startswith("--")]
    jobs = [(k, i) for k in ks for i in (1, 2)]
    with ThreadPoolExecutor(len(jobs)) as ex:
        for f in [ex.submit(run_rep, k, i) for k, i in jobs]:
            try: f.result()
            except Exception as e: log(f"오류 {e!r}")
