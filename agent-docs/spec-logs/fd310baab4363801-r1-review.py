#!/usr/bin/env python3
"""R-1 review for run fd310baab4363801: where each base kit/API.md unit went, and per-sentence meaning flags.

Usage: python3 agent-docs/spec-logs/fd310baab4363801-r1-review.py > <output>
Base text: git show b514c52:skills/learn-to-tell/kit/API.md. New set D: kit/API.md + kit/api/*.md.
"""
import glob, re, subprocess
K = "skills/learn-to-tell/kit/"
base = subprocess.run(["git", "show", "b514c52:" + K + "API.md"], capture_output=True, text=True, check=True).stdout
files = [K + "API.md"] + sorted(glob.glob(K + "api/*.md"))
D = {f: open(f, encoding="utf-8").read() for f in files}

def unfence(t): return re.sub(r"```.*?```", lambda m: "\n" * m.group(0).count("\n"), t, flags=re.S)
def words(s): return set(re.findall(r"[가-힣A-Za-z][가-힣A-Za-z0-9_-]+", s))
def nums(s): return re.findall(r"\d[\d,.×–]*", re.sub(r"`[^`]*`", "", s))
POL = ["미만", "이상", "초과", "이하", "않", "없", "못", "뿐", "모두", "항상", "기본", "넘", "아래", "끈", "켜", "말고", "대신", "만 ", "전", "뒤", "앞", "먼저", "나중"]
def pol(s): return {p for p in POL if p in s}

def units(text):
    out, sec = [], ""
    for i, line in enumerate(unfence(text).split("\n"), 1):
        if line.startswith("#"): sec = line.strip("# ").strip(); continue
        if not line.strip() or re.match(r"^\|[\s:|-]+\|$", line.strip()): continue
        if line.startswith("|"):
            cells = re.split(r"(?<!\\)\|", line)[1:-1]
            first, rest = cells[0].strip(), " | ".join(c.strip() for c in cells[1:])
            for s in re.split(r"(?<=[.다])\s+", rest): out.append((sec, first, i, s))
        else:
            for s in re.split(r"(?<=[.다])\s+", line): out.append((sec, "", i, s))
    return [u for u in out if len(words(u[3])) >= 3]

new = [(f,) + u for f, t in D.items() for u in units(t)]
print("| # | base section | base first cell | base line | best file:line | word match | number check | polarity diff | base sentence |")
print("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
flags = 0
for n, (sec, first, line, s) in enumerate(units(base), 1):
    w = words(s)
    best = max(new, key=lambda u: len(w & words(u[4])) / len(w))
    score = len(w & words(best[4])) / len(w)
    nb, nn = nums(s), nums(best[4])
    numok = all(x in nn for x in nb)
    pd = sorted(pol(s) ^ pol(best[4]))
    mark = score < 0.6 or not numok or bool(pd)
    flags += mark
    print(f"| {n}{' *' if mark else ''} | {sec} | {first[:40].replace('|', '/')} | {line} | {best[0].replace(K, '')}:{best[3]} | {score:.2f} | {'ok' if numok else 'MISS ' + ','.join(x for x in nb if x not in nn)} | {','.join(pd)} | {s[:160].replace('|', '/')} |")
print(f"\nflagged (*): {flags}")
