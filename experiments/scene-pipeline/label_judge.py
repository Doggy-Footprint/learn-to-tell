"""label_judge.py: Sonnet judge for the 20 user label items (label-items.json), checked against the user's labels (label-r1.json).
  capture <pos>...            run measure.mjs --frames for those label slots -> measure/out/judge/<scene>/
  run <tag> <pos>... [--effort medium] [--items <file>]   judge each slot -> judge-out/<tag>/<pos>.json (+ items.json used)
  compare <tag> <pos>...      per-item agreement with the user's labels
Positions are label-set slots (label-key.json). The judge sees what the labeler saw: the scene's intent as shown on the label page, screenshots,
the measured event list and metrics; not the scene code."""
import base64, json, os, subprocess, sys, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
E = Path(__file__).resolve().parent; M = E/"measure"; CAP = M/"out/judge"; OUT = E/"judge-out"
sys.path.insert(0, str(M)); import events
KEY = {e["pos"]: e for e in json.load(open(E/"label-key.json"))["entries"]}
ITEMS = json.load(open(sys.argv[sys.argv.index("--items") + 1] if "--items" in sys.argv else E/"label-items.json"))
_page = (E/"label-set/index.html").read_text(); DATA, _ = json.JSONDecoder().raw_decode(_page[_page.index("const DATA = ") + 13:])
NEUTRAL = {"no", "na", "unsure"}
# one-line meanings for the judge; values come from measure/metrics.py on a clean run (HSH: main3/r1, shots: shots/r1)
METRICS = {"frame_jumps": "쪽 안에서 주 그림 상자의 위치·크기가 1px 넘게 바뀐 횟수(그림 틀 흔들림)", "frame_max_px": "그 변화의 최대 px",
           "svg_area": "쪽 도착 0.5초 뒤 주 그림 넓이 / 화면 넓이(쪽 중앙값)", "svg_visible": "그 그림이 첫 화면 안에 보인 비율(쪽 최솟값)",
           "hidden_text": "쪽 도착 1초 뒤 화면 밖 글자 비율(쪽 최댓값)", "hidden_controls": "도착 1초 뒤 화면 밖 조작 단추 수(최댓값)",
           "hidden_change": "화면 밖에서 일어난 요소 변화의 비율", "teleport_ratio": "요소 이동 중 앞뒤 정지 사이 한 표본(50ms)에 크게 뛴 이동의 비율",
           "path_shown": "글자 라벨이 자리를 옮길 때 경로가 보인 비율", "text_jump_ratio": "글자 라벨 이동 중 건너뛴 이동의 비율",
           "isolated_change": "한 표본(50ms)에서만 바뀌고 앞뒤로는 그대로인 변화의 비율(깜빡임)", "speed_p90": "움직이는 요소의 50ms당 이동량 90분위(그림 폭 1000 기준)",
           "svg_text_px": "그림 안 글자 높이 중앙값 px", "html_text_px": "본문 글자 크기 중앙값 px", "new_chars_max_1s": "1초 동안 새로 보인 글자 수 최댓값"}

def scene(pos):
    n = KEY[pos]["scene"]
    if n.startswith("shots/"): return n, ["--gallery", "../../../site/gallery"], n.split("/")[1].removesuffix(".html"), M/"out/shots/r1/metrics.tsv"
    t, r, s = n.split("/")[1:]; return f"{t}/{r}/{s}/scene.html", [], f"{t}_{r}_{s}", M/"out/main3/r1/metrics.tsv"

def capture(pos):
    rel, extra, run, _ = scene(pos); d = CAP/run
    if (d/"frames.json").exists(): return f"{pos} cached"
    p = subprocess.run(["node", "measure.mjs", str(CAP/f"{run}.json"), rel, "--frames", str(d), *extra], cwd=M, capture_output=True, text=True)
    return f"{pos} {p.stdout.strip()[-120:]} {p.stderr.strip()[-200:]}"

def metrics(pos):
    _, _, run, tsv = scene(pos); rows = [l.split("\t") for l in tsv.read_text().splitlines()]
    r = dict(zip(rows[0], next(x for x in rows[1:] if x[0] == run)))
    return "\n".join(f"- {k} = {r[k]}: {v}" for k, v in METRICS.items())

# Judge-only procedure per item, added one at a time against the user's dev labels; the labeler's definition text stays as shown on the page.
NOTES = {"no-anim": "학습자가 화면만 보고 두 가지를 할 수 있는지 본다. "
                    "(1) 결과를 이루는 각 부분이 어떤 입력에서 오는가: 그림의 단위(칸 크기, 막대 높이)가 어떤 변수와 어떻게 연결되는지 표시되고, 한 단계(예: 클럭 한 번)가 결과 한 조각(예: 에너지 CV²)으로 바뀌는 과정이 보여야 한다. "
                    "결과가 여러 변수에 비례한다고 말하면 변수를 하나씩 바꿀 때 결과가 어떻게 달라지는지 보여야 한다. 공식대로 만든 결과 모양(예: 높이가 V²인 블록이 쌓임)만 보이면 원인을 보인 것이 아니다. "
                    "(2) 한 단계가 다음 단계로 어떻게 이어지는가: 앞 단계에서 남거나 넘어간 것이 다음 단계의 입력이 되는 모습이 그림에서 보여야 한다(예: 100 중 95가 남고 다음 은행이 95를 받음). "
                    "두 그림(예: 왼쪽 막대와 오른쪽 누적 그래프)이 어떻게 연결되는지를 학습자가 움직이는 동안 직접 계산해야만 알 수 있고, 둘이 서로 다른 그래프라 해도 이상하지 않다면 연결을 보인 것이 아니다. "
                    "조금 뚜렷하지 않아도 여러 번 보면 따라갈 수 있으면 문제 없음이다. 근거에는 (1)·(2) 중 무엇이 보이고 무엇이 빠졌는지 쓴다."}

def choices(it):
    o = it.get("options")
    if o: return [o[0], ["no", "문제 없음"], *o[1:]]
    return [["yes", "문제 있음"], ["no", "문제 없음"]] + ([["na", "해당 없음"]] if it.get("na") else [])

PROMPT = """너는 학습 장면 하나를 보고 결함 체크리스트 20개 항목에 답하는 평가자다. 사람 평가자와 같은 조건으로 판단한다.

## 사람 평가자가 장면을 본 방식
- 장면을 1280x800 화면으로 열어 대상 독자 입장에서 처음부터 끝까지 본다. 단계 단추, → 키, 예측 선택지를 눌러 진행한다.
- 장면을 본 뒤 "이 장면의 의도"를 참고한다. 원리 항목은 그 대상 독자가 의도의 내용을 화면으로 따라갈 수 있는지로 판단한다.

## 너에게 주는 자료
1. 이 장면의 의도(사람 평가자에게 보인 것과 같다).
2. 쪽마다 도착 1.5초 뒤 화면(원본 크기).
3. 프레임 묶음: 쪽 안에서 화면이 바뀌는 동안 1초마다, 그리고 움직임이 0.6초 멈췄을 때 찍은 화면을 3x3으로 줄여 붙였다. 노란 칸은 장면 시작부터의 시각이고 "멈춤"은 멈춘 뒤 화면이다. 쪽마다 앞에서부터 최대 18장이다.
4. 사건 목록: 50ms마다 잰 SVG 도형·글자와 화면 글의 나타남·사라짐·이동, 그리고 자동 진행이 한 동작. 좌표는 화면 px. HTML 상자의 움직임은 잡히지 않는다.
5. 측정 지표.
자료는 자동 진행으로 만들었으므로 사람이 누른 순서·시각과 다를 수 있다.

## 판단 규칙
- 항목마다 정의와 예를 따른다. 정의가 다루지 않는 문제는 그 항목에서 세지 않는다.
- "문제 있음" 쪽 답은 자료에서 확인되는 것만 근거로 한다. 자료로 확인할 수 없으면 문제 없음을 고르고 근거에 "자료로 확인 못 함"이라고 쓴다.
- 근거(reason)는 한국어 한 문장으로, 쪽·시각·프레임·사건을 가리킨다. basis는 근거로 쓴 자료다.

## 항목
{items}"""

# Split so the rules and items (same for every scene) form the cached prefix of each request.
SCENE = """## 이 장면의 의도
{intent}

## 측정 지표
{metrics}

## 사건 목록
{events}

이제 화면 자료가 이어진다."""

def build(pos):
    _, _, run, _ = scene(pos); d = CAP/run; fr = json.load(open(d/"frames.json"))["frames"]
    intent = "\n".join(f"- {k}: {v}" for k, v in DATA["intent"][pos - 1])
    items = "\n".join(f"- id `{it['id']}` [{it['group']}] {it['label']}: {it['def']} 예: {it['ex']}" + (f" 해당 없음: {it['na']}" if it.get("na") else "")
                      + " 선택지: " + ", ".join(f"`{c}`={t}" for c, t in choices(it)) + (f" 판정 절차: {NOTES[it['id']]}" if it["id"] in NOTES else "") for it in ITEMS)
    content = [{"type": "text", "text": PROMPT.format(items=items)},
               {"type": "text", "text": SCENE.format(intent=intent, metrics=metrics(pos), events=events.main(str(CAP/f"{run}.json")))}]
    def img(f): return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode((d/f).read_bytes()).decode()}}
    for pg in dict.fromkeys(f["page"] for f in fr):
        a = next((f for f in fr if f["page"] == pg and f["kind"] == "arrive"), None)
        if a: content += [{"type": "text", "text": f"쪽 {pg.replace(' ', '')} 도착 화면 ({a['t'] / 1000:.1f}s)"}, img(a["file"])]
        for sh in dict.fromkeys(f["sheet"] for f in fr if f["page"] == pg and f.get("sheet")):
            ts = [f["t"] for f in fr if f.get("sheet") == sh]
            content += [{"type": "text", "text": f"쪽 {pg.replace(' ', '')} 프레임 묶음 ({ts[0] / 1000:.1f}s–{ts[-1] / 1000:.1f}s)"}, img(sh)]
    schema = {"type": "object", "required": ["answers"], "properties": {"answers": {"type": "object", "required": [it["id"] for it in ITEMS], "properties": {
        it["id"]: {"type": "object", "required": ["answer", "basis", "reason"], "properties": {
            "answer": {"enum": [c for c, _ in choices(it)]}, "basis": {"type": "array", "items": {"enum": ["의도", "화면", "프레임", "사건", "지표"]}},
            "reason": {"type": "string"}}} for it in ITEMS}}}}
    return content, schema

def judge(tag, pos, effort):
    f = OUT/tag/f"{pos:02d}.json"
    if f.exists(): return f"{pos} cached"
    content, schema = build(pos)
    env = {k: v for k, v in os.environ.items() if k not in ("CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_REMOTE_SESSION_ID", "CLAUDE_CODE_CHILD_SESSION")}
    msg = json.dumps({"type": "user", "message": {"role": "user", "content": content}})
    p = subprocess.run(["claude", "-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--model", "sonnet", "--effort", effort,
                        "--strict-mcp-config", "--tools", "", "--no-session-persistence", "--session-id", str(uuid.uuid4()), "--json-schema", json.dumps(schema)],
                       input=msg, env=env, capture_output=True, text=True, timeout=900, cwd=OUT)
    res = next((d for d in map(json.loads, filter(None, p.stdout.splitlines())) if d.get("type") == "result"), None)
    if not res or not res.get("structured_output"): return f"{pos} FAILED {(p.stdout + p.stderr)[-300:]}"
    f.write_text(json.dumps({"pos": pos, "effort": effort, "cost": res.get("total_cost_usd"), "usage": res.get("usage"), **res["structured_output"]}, ensure_ascii=False, indent=1))
    return f"{pos} ${res.get('total_cost_usd')}"

def compare(tag, ps):
    lab = {d["pos"]: d for d in json.load(open(E/"label-r1.json"))}
    jd = {p: json.load(open(OUT/tag/f"{p:02d}.json")) for p in ps if (OUT/tag/f"{p:02d}.json").exists()}
    print(f"{tag}: {len(jd)} slots, cost ${sum(j['cost'] or 0 for j in jd.values()):.3f}")
    print("item\tuser+\tjudge+\tboth+\tjudge only\tuser only\texact")
    for it in ITEMS:
        i = it["id"]; u = [lab[p]["answers"][i] for p in jd]; j = [jd[p]["answers"][i]["answer"] for p in jd]
        up = [a not in NEUTRAL for a in u]; jp = [a not in NEUTRAL for a in j]
        print(f"{i}\t{sum(up)}\t{sum(jp)}\t{sum(a and b for a, b in zip(up, jp))}\t{sum(b and not a for a, b in zip(up, jp))}\t{sum(a and not b for a, b in zip(up, jp))}\t{sum(a == b for a, b in zip(u, j))}/{len(u)}")

if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    effort = args[args.index("--effort") + 1] if "--effort" in args else "medium"
    args = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] not in ("--effort", "--items"))]
    if cmd == "capture":
        CAP.mkdir(parents=True, exist_ok=True)
        with ThreadPoolExecutor(4) as ex: [print(r, flush=True) for r in ex.map(capture, map(int, args))]
    elif cmd == "run":
        tag, ps = args[0], list(map(int, args[1:])); (OUT/tag).mkdir(parents=True, exist_ok=True)
        if not (OUT/tag/"items.json").exists(): (OUT/tag/"items.json").write_text(json.dumps(ITEMS, ensure_ascii=False, indent=1))
        with ThreadPoolExecutor(4) as ex: [print(r, flush=True) for r in ex.map(lambda p: judge(tag, p, effort), ps)]
    elif cmd == "compare": compare(args[0], list(map(int, args[1:])))
