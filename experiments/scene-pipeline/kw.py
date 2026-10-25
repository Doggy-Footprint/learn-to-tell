# 키워드 실험: gallery shot을 기법 키워드로 태깅하고, K(키워드로 고른 본보기 2개 + kit 문서) vs 0(kit 문서만)을 같은 스토리보드로 만든다.
# usage: python3 kw.py tag | python3 kw.py <shot>...   (작업 디렉터리 gallery/kw/)
import json, math, os, re, shutil, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import r1
E = r1.E; G = E/"gallery"/"kw"; r1.G = G; r1.LOG = E/"kw.log"
SH = Path("/home/user/learn-to-tell/site/gallery/shots"); KIT = Path("/home/user/learn-to-tell/skills/learn-to-tell/kit")
ax = r1.ax

def brief(k):
    """plan.json에 없는 shot은 원본의 ltt-meta와 axes.json에서 round0과 같은 필드로 브리프를 만든다(구조·움직임·구도 제외)."""
    if k in r1.plan: return r1.plan_brief(k)
    m = json.loads(re.search(r'id="ltt-meta">(.*?)</script>', (SH/ax[k]["file"]).read_text()).group(1))
    return {"topic_line": ax[k]["topic"], **{x: m[x] for x in ("topic", "audience", "theme", "medium", "decision", "domain") if x in m}, "role": ax[k]["role"]}
r1.plan_brief = r1.brief; r1.brief = brief

TAG = """너는 장면 본보기 gallery의 검색 키워드 사전을 만든다. `shots/` 아래 HTML 51개가 본보기다. 모두 한 응답에서 함께 Read한다.

## 키워드가 담을 것
새 장면을 만드는 작성자가 "이 기법이 필요하니 이 본보기 코드를 참고하자"고 고를 수 있게 하는 것이 목적이다.
- 키워드는 다시 쓸 수 있는 그리기·애니메이션·조작 기법이다. 예: `지도 위 경로`, `경로를 따라 흐르는 입자`, `갈라지고 합쳐지는 흐름`, `조건에 따라 갈리는 흐름`, `쌓이는 막대`, `단계 넘김`, `손잡이로 값 바꾸기`.
- 주제·분야(물리, 금융)나 색·테마는 키워드가 아니다.
- 사전은 25–45개. 같은 뜻의 말은 하나로 묶고, 키워드마다 한 줄 정의(무엇이 화면에 보이는가)를 붙인다.
- shot마다 그 코드가 실제로 구현한 키워드 3–7개를 붙인다. 코드에 없는 것은 붙이지 않는다.

## 결과
현재 디렉터리에 `keywords.json`을 Write한다:
```json
{"dict": {"키워드": "정의"}, "shots": {"04": ["키워드", ...]}}
```
`shots`의 키는 파일 이름 앞 두 자리 번호다. 끝나면 사전 크기를 한 줄로 답한다.
"""

PICK = """너는 Learn to Tell 수업 장면 한 장에 필요한 기법을 고른다. 파일을 쓰지 않고 답으로만 낸다.

## 브리프
```json
{brief}
```
`storyboard.md`(무엇을 설명할지)를 Read한다. 그 밖의 파일은 읽지 않는다.

## 기법 사전
{dict}

## 할 일
스토리보드를 화면으로 옮길 때 쓸 기법을 사전에서 3–6개 고른다. 사전에 없는 말은 쓰지 않는다. 맨 끝에 이 JSON 블록 하나로 답한다:
```json
{{"keywords": ["...", "..."], "why": "한두 문장"}}
```
"""

def writer(k, arm, ex):
    exr = f"""
## 본보기
`refs/examples/`의 {", ".join(f"`{x}`" for x in ex["files"])}는 이 장면에 필요한 기법({", ".join(ex["keywords"])})을 구현한 장면이다. kit 문서와 함께 Read하고, 기법(그리는 방법, 재생 루프, 조작)을 옮긴다. 본보기의 주제·문구·수치·배치는 옮기지 않는다.
""" if arm == "K" else ""
    return f"""너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{json.dumps(r1.brief(k), ensure_ascii=False, indent=1)}
```
- `role`은 장면 type, `theme`은 deck theme이다. 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- `storyboard.md`가 무엇을 설명할지 정한다. 화면 구성(구도, 움직임, 조작)은 네가 정한다.
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 읽을 것
`storyboard.md`, `refs/API.md`, 그리고 API.md 부품 표에서 고른 `refs/api/<part>.md`만 한 응답에서 함께 Read한다{" (본보기 포함)" if arm == "K" else ""}. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.
{exr}
## 규칙
- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node {E}/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 무엇을 그렸는지 한 줄로 답한다.
"""

def tag():
    d = G/"tag"; (d/"shots").mkdir(parents=True, exist_ok=True)
    for f in SH.glob("s*.html"): shutil.copy(f, d/"shots"/f.name)
    if not (d/"keywords.json").exists(): r1.claude(d, "sonnet", TAG, ["Read", "Write"], turns=10)
    kw = json.load(open(d/"keywords.json")); print(len(kw["dict"]), "keywords,", len(kw["shots"]), "shots")

def retrieve(k, picked, kw):
    df = {w: sum(w in v for v in kw["shots"].values()) for w in kw["dict"]}
    idf = {w: math.log(len(kw["shots"]) / df[w]) if df[w] else 0 for w in df}
    role = ax[k]["role"]
    cand = sorted(((sum(idf.get(w, 0) for w in set(picked) & set(v)), ax[j]["role"] == role, j) for j, v in kw["shots"].items() if j != k), key=lambda x: (-x[0], -x[1], x[2]))
    return [{"shot": j, "score": round(s, 3), "overlap": sorted(set(picked) & set(kw["shots"][j]))} for s, _, j in cand[:2]]

def refs(d, k, ex=None):
    rd = d/"refs"; shutil.rmtree(rd, ignore_errors=True); rd.mkdir(parents=True)
    shutil.copy(KIT/"API.md", rd/"API.md"); shutil.copytree(KIT/"api", rd/"api")
    if ex:
        (rd/"examples").mkdir()
        for f in ex["files"]: shutil.copy(SH/f, rd/"examples"/f)

def run(k):
    kw = json.load(open(G/"tag"/"keywords.json")); s = G/f"s{k}"
    sb = s/"sb"; sb.mkdir(parents=True, exist_ok=True)
    if not (sb/"storyboard.md").exists(): r1.claude(sb, "sonnet", r1.SB.format(brief=json.dumps(r1.brief(k), ensure_ascii=False, indent=1)), ["Write"], turns=10)
    pk = s/"pick"; pk.mkdir(exist_ok=True); shutil.copy(sb/"storyboard.md", pk/"storyboard.md")
    if not (pk/"pick.json").exists():
        res = r1.claude(pk, "sonnet", PICK.format(brief=json.dumps(r1.brief(k), ensure_ascii=False, indent=1), dict="\n".join(f"- `{w}`: {v}" for w, v in kw["dict"].items())), ["Read"], turns=5)
        p = json.loads(re.findall(r"```json\s*(\{.*?\})\s*```", res["result"], re.S)[-1])
        p["picked_valid"] = [w for w in p["keywords"] if w in kw["dict"]]
        p["orig_keywords"] = kw["shots"].get(k, []); p["retrieved"] = retrieve(k, p["picked_valid"], kw)
        json.dump(p, open(pk/"pick.json", "w"), ensure_ascii=False, indent=1)
    p = json.load(open(pk/"pick.json"))
    ex = {"files": [ax[r["shot"]]["file"] for r in p["retrieved"]], "keywords": p["picked_valid"]}
    def arm(a):
        d = s/a; d.mkdir(exist_ok=True); shutil.copy(sb/"storyboard.md", d/"storyboard.md"); refs(d, k, ex if a == "K" else None)
        if not (d/"scene.html").exists(): r1.claude(d, "sonnet", writer(k, a, ex), r1.WT)
        r1.audit(d)
    with ThreadPoolExecutor(2) as x: list(x.map(arm, ["K", "0"]))
    r1.log(f"s{k} 끝")

if __name__ == "__main__":
    if sys.argv[1] == "tag": tag()
    else:
        with ThreadPoolExecutor(5) as x:
            for f in [x.submit(run, k) for k in sys.argv[1:]]:
                try: f.result()
                except Exception as e: r1.log(f"오류 {e!r}")
