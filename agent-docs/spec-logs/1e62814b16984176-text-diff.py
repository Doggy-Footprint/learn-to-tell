# This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
# R-3 (spec 1e62814b16984176 v2): sentence-level before/after list for every changed scene in changed-scenes.json, from the
# scene textContent (1440×813 signatures; hidden answers included) plus the spec's string fields of that scene (review.mjs dump).
# Split halves are compared against their unmatched base scene. Usage: python3 <this> > 1e62814b16984176-text-diff.md
import difflib, json, re, sys
from pathlib import Path
D = Path(__file__).parent
sb = json.loads((D / "1e62814b16984176-sig-base.json").read_text()); sf = json.loads((D / "1e62814b16984176-sig-final.json").read_text())
cb = json.loads((D / "1e62814b16984176-base-content.json").read_text()); cf = json.loads((D / "1e62814b16984176-final-content.json").read_text())
ch = json.loads((D / "1e62814b16984176-changed-scenes.json").read_text())

def strings(v, out):
    if isinstance(v, str):
        if v not in ("[fn]", "[node]", "[deep]") and len(v) > 1: out.append(re.sub(r"<[^>]+>", "", v))
    elif isinstance(v, list): [strings(x, out) for x in v]
    elif isinstance(v, dict): [strings(x, out) for k, x in v.items() if k not in ("type", "layout", "icon", "tone", "id", "answer", "theme")]
    return out

def sents(t):
    t = re.sub(r"\s+", " ", t)
    return [x.strip() for x in re.split(r"(?<=[.?!다])\s+|(?<=\.)(?=[^\s\d])", t) if x.strip()]

def scene_text(sig, content, page, i):
    s = sig[f"1440x813 {page}"][i - 1]
    spec = content[page]["spec"]["scenes"][i - 1] if i - 1 < len(content[page]["spec"]["scenes"]) else {}
    return sents(s["text"]) + sents(" ".join(strings(spec, [])))

print("# R-3 문장 단위 전·후 목록 (spec 1e62814b16984176 v2)\n")
print("장면 textContent(1440×813, 숨은 답 포함)와 spec 문자열 필드를 문장으로 나눠 비교했다. `-`는 기준에만, `+`는 최종에만 있는 문장. 같은 문장이 두 출처에 다 나오면 두 번 보일 수 있다.\n")
for page, scenes in ch.items():
    for k, e in scenes.items():
        bases = [e["base"]] if e["base"] else e.get("unmatchedBase", [])
        a = sorted(set(sum((scene_text(sb, cb, page, b) for b in bases), [])))
        b = sorted(set(scene_text(sf, cf, page, e["final"])))
        minus = [x for x in a if x not in b]; plus = [x for x in b if x not in a]
        if e["base"] is None:  # split half: show only what this half has that the base lacks; the removal side is listed once per page
            minus = []
        print(f"## {page} 장면 {e['final']} (기준 {e['base'] if e['base'] else '짝 없음 → ' + ','.join(map(str, bases))}) {e['type'] or 'mount'} · {e['title'][:60]}")
        if not minus and not plus: print("- 글 차이 없음(배치·배율만)")
        for x in minus: print(f"  - {x}")
        for x in plus: print(f"  + {x}")
        print()
# Split pages: base scenes that lost their single partner, compared against the union of their halves.
for page, scenes in ch.items():
    halves = [e for e in scenes.values() if e["base"] is None]
    if not halves: continue
    for b in sorted(set(sum((e.get("unmatchedBase", []) for e in halves), []))):
        a = set(scene_text(sb, cb, page, b)); u = set(sum((scene_text(sf, cf, page, e["final"]) for e in halves), []))
        lost = sorted(a - u)
        print(f"## {page} 기준 장면 {b}: 나뉜 장면들 합집합에 없는 문장")
        print("- 없음" if not lost else "\n".join(f"  - {x}" for x in lost)); print()
