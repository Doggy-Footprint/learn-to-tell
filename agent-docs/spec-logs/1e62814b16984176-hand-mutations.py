# This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
# VO-12 hand mutations (spec 1e62814b16984176): one at a time, seed.py backup -> inject -> npm test -> seed.py restore.
# Usage: python3 1e62814b16984176-hand-mutations.py <HM-id>... ; appends results to 1e62814b16984176-hand-mutations-result.json
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).with_name("1e62814b16984176-hand-mutations-result.json")
HEAD = lambda p: subprocess.run(["git", "show", "17ccf58:" + p], cwd=ROOT, capture_output=True, text=True, check=True).stdout

def field(text, start, key):
    i = text.index(start); j = text.index(key, i); k = text.index("\n", j)
    return text[j:k]

def hm1(files):
    p = "site/gallery/linear-algebra/matrix-as-transform.html"; base = HEAD(p); cur = (ROOT / p).read_text()
    for key in ("sub: \"행렬", "why: \"다르다."):
        cur = cur.replace(field(cur, "늘이기와 회전", key), field(base, "늘이기와 회전", key))
    cur = cur.replace(".ab svg { max-height: 21vh;", ".ab svg { max-height: 26vh;")
    (ROOT / p).write_text(cur); return [p]

def sub(p, old, new, count=1):
    t = (ROOT / p).read_text()
    if old not in t: raise SystemExit(f"{p}: anchor not found: {old[:60]}")
    (ROOT / p).write_text(t.replace(old, new, count)); return [p]

LTT = "skills/learn-to-tell/kit/ltt.js"
HERO = 'hero = sceneMeta(m.type, "auditHero") || (m.layout ? m.layout === "full" : !!sceneMeta(m.type, "fullByDefault"));'
TLS = "site/gallery/network/tls13-quic.html"
MUT = {
  "HM-1": (["site/gallery/linear-algebra/matrix-as-transform.html"], hm1),
  "HM-2": ([TLS], lambda f: sub(TLS, ".seqwrap { width: 800px; max-width: 100%; }", ".seqwrap { width: 56vw; max-width: 100%; }")),
  "HM-3": (["tests/gallery-audit.baseline.json"], lambda f: sub("tests/gallery-audit.baseline.json", '"cache-ttl.html": 0', '"cache-ttl.html": 1')),
  "HM-4": ([LTT], lambda f: sub(LTT, HERO, 'hero = sceneMeta(m.type, "auditHero") || m.layout === "full";')),
  "HM-5": ([LTT], lambda f: sub(LTT, HERO, 'hero = sceneMeta(m.type, "auditHero") || m.layout === "full" || !!sceneMeta(m.type, "fullByDefault");')),
  "HM-6": ([LTT], lambda f: sub(LTT, HERO, 'hero = (m.layout ? m.layout === "full" : !!sceneMeta(m.type, "fullByDefault"));')),
  "HM-7": ([TLS], lambda f: sub(TLS, "<script>\n", "<script>\n  function streamsMiniOld(el) {}\n")),
  "HM-8": ([TLS], lambda f: (lambda t: ((ROOT / TLS).write_text(re.sub(r'"mode": "체험형: [^"]*"', '"mode": "simulation"', t, 1)), [TLS])[1])((ROOT / TLS).read_text())),
  "HM-9": (["site/gallery/scenes.html"], None),
  "HM-10": (["skills/learn-to-tell/kit/API.md"], lambda f: sub("skills/learn-to-tell/kit/API.md", "진입 때 모든 상태(predict 선택지별 정답, figure 단계, summary recall 답)를 그려 잠근 최소 배율이 88% 미만", "88% 미만으로 줄었다")),
}

def hm9(files):
    p = "site/gallery/scenes.html"; base = HEAD(p); cur = (ROOT / p).read_text()
    a = cur.index('{ type: "overview"'); b = cur.index("caption:", a); b = cur.index("\n", b)
    a0 = base.index('{ type: "overview"'); b0 = base.index("caption:", a0); b0 = base.index("\n", b0)
    (ROOT / p).write_text(cur[:a] + base[a0:b0] + cur[b:]); return [p]
MUT["HM-9"] = (["site/gallery/scenes.html"], hm9)


TRO = "site/gallery/philosophy/trolley-ethics.html"
CL = "skills/learn-to-tell/kit/CHANGELOG.md"
CLLINE = "- audit은 장면을 실제로 그린 layout으로 판정한다: layout을 적지 않은 overview도 full 장면이라 `small-visual` 22% 기준과 `empty-stage`를 받는다.\n"
def hm13(files):
    p = ROOT / "tests/gallery-audit.baseline.json"; d = json.loads(p.read_text()); del d["1440x900"]["cache-ttl.html"]
    p.write_text(json.dumps(d, indent=2) + "\n"); return files
def hm14(files):
    t = (ROOT / CL).read_text()
    if CLLINE not in t: raise SystemExit("HM-14 anchor")
    t = t.replace(CLLINE, "", 1).replace("kit 개발자용\n", "kit 개발자용\n" + CLLINE, 1); (ROOT / CL).write_text(t); return [CL]
MUT.update({
  "HM-11": ([TRO], lambda f: sub(TRO, 'LTT.expect("net lives saved", 5 - 1,', 'LTT.expect("net lives saved", 5 - 2,')),
  "HM-12": ([TRO], lambda f: sub(TRO, "  LTT.deck({", '  throw new Error("HM-12 broken page");\n  LTT.deck({')),
  "HM-13": (["tests/gallery-audit.baseline.json"], hm13),
  "HM-14": ([CL], hm14),
  "HM-15": (["site/gallery/scenes.html"], lambda f: sub("site/gallery/scenes.html", '"mode":"카탈로그용: ', '"mode":"카탈로그: ')),
  "HM-16": (["skills/learn-to-tell/kit/API.md"], lambda f: sub("skills/learn-to-tell/kit/API.md", "88% 미만", "85% 미만")),
})

def run(cmd):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)

results = json.loads(OUT.read_text()) if OUT.exists() else {}
for hm in sys.argv[1:]:
    files, fn = MUT[hm]
    r = run(["python3", ".harness/bin/seed.py", "backup", *files])
    if r.returncode: raise SystemExit("backup failed: " + r.stderr)
    try:
        fn(files)
        diff = run(["git", "diff", "--stat", "--", *files]).stdout.strip()
        t = run(["npm", "test"])
        out = t.stdout + t.stderr
        fails = sorted(set(re.findall(r"^✖ (.+?) \(\d", out, re.M)) - {"failing tests:"})
        summary = re.findall(r"ℹ (tests|pass|fail) (\d+)", out)
        results[hm] = {"files": files, "diff": diff, "exit": t.returncode, "summary": dict(summary), "failing": fails[:12],
                       "detail": [l for l in out.splitlines() if ("장면" in l and "[" in l) or "actual:" in l or "expected:" in l or "trolley" in l or "cache-ttl.html" in l][:8]}
    finally:
        r = run(["python3", ".harness/bin/seed.py", "restore"])
        if r.returncode: raise SystemExit("RESTORE FAILED: " + r.stderr)
    print(hm, results[hm]["exit"], results[hm]["summary"], results[hm]["failing"][:4])
OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
