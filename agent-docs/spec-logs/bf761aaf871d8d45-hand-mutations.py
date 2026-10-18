#!/usr/bin/env python3
# This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
# Hand mutations HM-1..HM-10 (spec bf761aaf871d8d45 v1), HM-11..HM-14 (v3, verifier 1 BV-1/BV-2). One at a time: seed.py backup -> inject (-> regenerate) -> detector -> seed.py restore.
# Usage: python3 bf761aaf871d8d45-hand-mutations.py <repo> <scratch dir> <out.json> [HM-id ...]
import json, os, re, subprocess, sys

repo, scratch, out = sys.argv[1], sys.argv[2], sys.argv[3]
only = set(sys.argv[4:])
KIT = "skills/learn-to-tell/kit/"
DECK, DECKCSS, BUILD = KIT + "ltt-deck.js", KIT + "ltt-deck.css", "scripts/build.mjs"
LOGS = "agent-docs/spec-logs/"
FIX = LOGS + "bf761aaf871d8d45-error-fixture.html"
TOP = "  gap: 16px;\n  padding: clamp(12px,2.2vh,26px) 0 clamp(4px,1vh,10px);\n}\n.dk-top h1 {"
M = [
    ("HM-1", [(DECKCSS, TOP, TOP.replace("16px", "17px"))], False, "npm+check"),
    ("HM-2", [(DECK, "/* css:end */", "")], False, "npm+css"),
    ("HM-3", [(DECKCSS, ".dk-top {\n  display: flex;\n  align-items: center;\n" + TOP, ".dk-top h1 {")], True, "npm+r1"),
    ("HM-4", [(FIX, 'HA = +(Q.get("ha") || 360)', 'HA = +(Q.get("ha") || 1400)')], False, "errors"),
    ("HM-5", [(DECK, "}, function (e) { z = 1; fail(e); }, function () {", "}, function (e) { z = zoomLock(question, zs); fail(e); }, function () {")], False, "errors"),
    ("HM-6", [(DECK, "        ctx.zmax = 1;\n", "        var old = ctx.zmax;\n        ctx.zmax = 1;\n"),
              (DECK, "}, function (e) { z = 1; fail(e); }, function () {", "}, function (e) { z = old === undefined ? 1 : old; fail(e); }, function () {")], False, "errors"),
    ("HM-7", [(DECK, '          [].forEach.call(pic.querySelectorAll(".pk"), function (c) { c.remove(); });\n', "")], False, "errors"),
    ("HM-8", [(DECK, "}, function (e) { z = 1; fail(e); }, function () {",
               '}, function (e) { z = 1; if (revealed) LTT.warn("장면 " + (ctx.index + 1) + ": 재측정 실패 (" + e.message + ")"); else fail(e); }, function () {')], False, "errors"),
    ("HM-9", [(BUILD, 'const out = spaced.filter((t, k) => !(t === ";" && spaced[k + 1] === "}"));', "const out = spaced;")], False, "npm"),
    ("HM-10", [(BUILD, "/\\.(js|css)$/.test(e.name)) rmSync", "/\\.(js)$/.test(e.name)) rmSync")], False, "npm"),
    ("HM-11", [(BUILD, 'if (!min) return \'""\';', 'return JSON.stringify(min);')], True, "npm"),
    ("HM-12", [(DECKCSS, "  overflow-x: clip;\n}\n.dk-top {", "    overflow-x: clip\n}\n.dk-top {")], False, "npm"),
    ("HM-13", [("scripts/git/pre-commit", 'css --check >/dev/null', 'css --check >/dev/null || true')], False, "npm"),
    ("HM-14", [(DECK, "  var h = LTT.h, fill = LTT.fill;\n", "  var h = LTT.h, fill = LTT.fill;\n  var EXTRA = '.dk-x{color:red}';\n")], False, "r3"),
]

def sh(cmd, timeout=1200):
    p = subprocess.run(cmd, cwd=repo, shell=True, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout + p.stderr

def npm():
    rc, o = sh("npm test 2>&1")
    fails = sorted(set(re.findall(r"^\s*✖ (.+?) \(\d", o, re.M)))
    m = re.search(r"ℹ fail (\d+)", o)
    return {"rc": rc, "fail": int(m.group(1)) if m else None, "failing": fails}

def errors():
    f = os.path.join(scratch, "hm-errors.json")
    rc, o = sh(f"node {LOGS}bf761aaf871d8d45-cdp-review.mjs errors {repo} {f}")
    d = json.load(open(f))
    eg2 = d["rows"]["EG2"]
    return {"rc": rc, "failed": d["failed"], "discriminating": d["discriminating"], "EG1zoom": d["rows"]["EG1"]["zoomEntry"],
            "EG2": {k: eg2[k] for k in ("zoom", "fresh", "successOnly", "entry1440", "newWarns", "guard")}, "EG3pk": d["rows"]["EG3"]["pk"]}

def r1():
    tree = os.path.join(scratch, "hm-tree")
    sh(f"rm -rf {tree} && mkdir -p {tree} && rsync -a --exclude .git --exclude tests --exclude agent-docs ./ {tree}/")
    dump = os.path.join(scratch, "hm-dom")
    sh(f"rm -rf {dump}")
    sh(f"node {LOGS}0041d668222ce019-dom-dump.mjs {tree} {dump}")
    _, s = sh(f"node {LOGS}bf761aaf871d8d45-style-diff.mjs {scratch}/dom-base-1 {dump}")
    bases = " ".join(f"{scratch}/dom-base-{i}" for i in range(1, 6))
    _, m = sh(f'bash {LOGS}0041d668222ce019-dom-match.sh "{bases}" "{dump}"')
    return {"styleDiff": s.strip().splitlines()[-1], "domMatch": m.strip().splitlines()[-1]}

res = []
for hid, edits, regen, kind in M:
    if only and hid not in only: continue
    js = {KIT + m + ".js" for m in ("ltt", "ltt-parts", "ltt-ui", "ltt-mock", "ltt-deck")}
    files = sorted({f for f, _, _ in edits} | (js if regen or kind.startswith("npm") else set()))
    rc, o = sh("python3 .harness/bin/seed.py backup " + " ".join(files))
    assert rc == 0, o
    try:
        for f, a, b in edits:
            p = os.path.join(repo, f); t = open(p).read()
            assert t.count(a) == 1, (hid, f, a[:50])
            open(p, "w").write(t.replace(a, b, 1))
        r = {"id": hid, "files": files}
        if regen: r["regen"] = sh("node scripts/build.mjs css")
        if kind == "npm+css": r["css"] = sh("node scripts/build.mjs css")
        if kind == "npm+check":
            r["check"] = sh("node scripts/build.mjs css --check")
            r["preCommit"] = sh("bash scripts/git/pre-commit")[0]
        if kind.startswith("npm"): r["npm"] = npm()
        if kind == "npm+r1": r["r1"] = r1()
        if kind == "errors": r["errors"] = errors()
        if kind == "r3":
            _, o = sh(f"node {LOGS}bf761aaf871d8d45-r3-source.mjs {repo} 8522f7011504ce774a2207b2ae308b2fc3bab736")
            r["r3deck"] = json.loads(o)["outside"]["ltt-deck"]
        res.append(r)
        print(json.dumps(r, ensure_ascii=False)[:600], flush=True)
    finally:
        rc, o = sh("python3 .harness/bin/seed.py restore")
        if rc != 0: print("RESTORE FAILED", o); sys.exit(3)
prev = json.load(open(out)) if os.path.exists(out) else {"results": []}
keep = [r for r in prev["results"] if r["id"] not in {x["id"] for x in res}]
json.dump({"seed": "none", "results": sorted(keep + res, key=lambda r: int(r["id"].split("-")[1]))}, open(out, "w"), ensure_ascii=False, indent=1)
