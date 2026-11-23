# 분류 실험: 스토리보드 → 축(structure·motion·composition) 분류만, 장면 생성 없음.
# V1: 축을 모른 채 설명 전략 → 별도 단계가 few-shot으로 축에 대응. V2: 축 어휘·few-shot을 주고 전략과 축을 함께.
# usage: python3 cls.py <shot>...   (작업 디렉터리 gallery/r1/s<k>/{sb1,cls-V1a,cls-V1b,cls-V2})
import json, re, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import r1
E = r1.E; G = r1.G; AX = ("structure", "motion", "composition")
axes = r1.ax
look = (Path(__file__).resolve().parents[2]/"skills/learn-to-tell/look/look.md").read_text()
principle = {m[0]: m[1].strip() for m in re.findall(r"^\| s(\d+) \|(?:[^|]*\|){5}([^|]*)\|$", look, re.M)}
VOCAB = {a: sorted({v[a] for v in axes.values()}) for a in AX}

def examples(k):
    rows = [f"- {v['topic']} → structure: {v['structure']} · motion: {v['motion']} · composition: {v['composition']}" + (f" · 옮길 원리: {principle[j]}" if j in principle else "")
            for j, v in sorted(axes.items()) if j != k]
    return "\n".join(rows)

AXDOC = lambda k: f"""## 축 어휘
- structure(개념 구조, 그림의 뼈대): {", ".join(VOCAB['structure'])}
- motion(움직임이 보이는 방식): {", ".join(VOCAB['motion'])}
- composition(화면 구도): {", ".join(VOCAB['composition'])}

## 예시: 이미 만든 장면의 주제와 축 ({len(axes) - 1}개)
{examples(k)}
"""

OUT = """## 답 형식
맨 끝에 이 JSON 블록 하나로 답한다. 축마다 위 어휘에서 정확히 하나를 고르고, 둘째 후보가 있으면 `alt`에 적는다(없으면 null).
```json
{"structure": "...", "motion": "...", "composition": "...", "alt": {"structure": null, "motion": null, "composition": null}, "why": "한두 문장"}
```"""

def strategy_prompt(k, sb, guided):
    head = f"""너는 Learn to Tell 수업 장면 한 장의 설명 전략을 세운다. 파일을 읽거나 쓰지 않고 답으로만 낸다.

## 브리프
```json
{json.dumps(r1.brief(k), ensure_ascii=False, indent=1)}
```

## 스토리보드(무엇을 설명할지)
{sb}

## 할 일
이 내용을 독자가 혼자 보고 이해하도록, 움직이는 인포그래픽 한 장으로 설명하는 전략을 세운다: 그림의 뼈대(무엇과 무엇의 관계를 그리나), 움직임(무엇이 어떻게 움직여 메커니즘을 보이나), 화면 구도, 비트 순서. 20줄 이내.
"""
    return head + ("\n" + AXDOC(k) + "\n전략을 쓴 뒤, 그 전략에 맞는 축을 고른다.\n\n" + OUT if guided else "")

def map_prompt(k, strat):
    return f"""아래는 Learn to Tell 수업 장면 한 장의 설명 전략이다. 이 전략을 우리 장면 분류 축에 대응시킨다. 파일을 읽거나 쓰지 않고 답으로만 낸다.

## 설명 전략
{strat}

{AXDOC(k)}
{OUT}"""

def parse(text):
    j = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.S)
    return json.loads(j[-1]) if j else None

def step(d, prompt):
    d.mkdir(parents=True, exist_ok=True)
    if not (d/"stream.jsonl").exists() or r1.result(d).get("subtype") != "success":
        r1.claude(d, "sonnet", prompt, ["Read"], turns=3)
    r = r1.result(d); (d/"answer.md").write_text(r["result"]); return r

def run(k):
    r1.stage_sb(k, 1); sb = (G/f"s{k}"/"sb1"/"storyboard.md").read_text(); base = G/f"s{k}"
    with ThreadPoolExecutor(2) as ex:
        f1 = ex.submit(step, base/"cls-V1a", strategy_prompt(k, sb, False))
        f2 = ex.submit(step, base/"cls-V2", strategy_prompt(k, sb, True))
        a = f1.result(); v2 = f2.result()
    b = step(base/"cls-V1b", map_prompt(k, a["result"]))
    gold = {x: axes[k][x] for x in AX}
    rows = []
    for arm, ans, cost in (("V1", parse(b["result"]), a["cost"] + b["cost"]), ("V2", parse(v2["result"]), v2["cost"])):
        hit = {x: (ans or {}).get(x) == gold[x] for x in AX}
        near = {x: hit[x] or ((ans or {}).get("alt") or {}).get(x) == gold[x] for x in AX}
        rows.append({"shot": f"s{k}", "arm": arm, "gold": gold, "pred": ans, "hit": hit, "hit_or_alt": near, "cost": round(cost, 4)})
    return rows

if __name__ == "__main__":
    ks = sys.argv[1:]
    with ThreadPoolExecutor(len(ks)) as ex: res = [r for rows in ex.map(run, ks) for r in rows]
    with open(E/"cls-results.jsonl", "w") as f:
        for r in res: f.write(json.dumps(r, ensure_ascii=False) + "\n")
    for arm in ("V1", "V2"):
        rs = [r for r in res if r["arm"] == arm]
        print(arm, {x: f"{sum(r['hit'][x] for r in rs)}/{len(rs)} (alt 포함 {sum(r['hit_or_alt'][x] for r in rs)})" for x in AX},
              "3축 모두", sum(all(r["hit"].values()) for r in rs), "cost", round(sum(r["cost"] for r in rs), 3))
