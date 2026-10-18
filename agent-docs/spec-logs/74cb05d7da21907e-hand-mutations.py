#!/usr/bin/env python3
# Hand mutations HM-1..HM-12 (spec 74cb05d7da21907e v4). One at a time: seed.py backup -> inject -> detector -> seed.py restore.
# Usage: python3 74cb05d7da21907e-hand-mutations.py <repo> <out.json> [HM-id ...]
import json, os, subprocess, sys, re, tempfile

repo, out = sys.argv[1], sys.argv[2]
only = set(sys.argv[3:])
DECK = "skills/learn-to-tell/kit/ltt-deck.js"
LOGS = "agent-docs/spec-logs"
SCRATCH = tempfile.mkdtemp(prefix="ltt-hm-")

M = [
    ("HM-1", DECK, "for (var i = 0; i < zs.length; i++) {", "for (var i = 0; i < zs.length - 1; i++) {", "npm"),
    ("HM-2", DECK, "    var z = question;\n    for (var i = 0;", "    var z = 1;\n    for (var i = 0;", "npm"),
    ("HM-3", DECK, "if (!ok(question) || !Array.isArray(zs)) return 1;", "if (!ok(question) || !Array.isArray(zs)) return question;", "npm"),
    ("HM-4", DECK, "if (size.changed()) lock(revealed);", "if (!revealed && size.changed()) lock(revealed);", "resize"),
    ("HM-5", DECK, "            o.draw(o.chosen());\n", "", "resize"),
    ("HM-6", DECK, "for (var k = 0; k < o.count; k++)", "for (var k = 0; k < o.count - 1; k++)", "dom"),
    ("HM-7", DECK, "      root.classList.add(\"dk-still\");\n", "", "dom"),
    ("HM-8", "site/gallery/network/tls13-quic.html", ".seqwrap { width: 800px; max-width: 100%; }", ".seqwrap { width: min(820px, 56vw); }", "npm"),
    ("HM-9", DECK, "          w.classList.add(\"done\");\n          ans.classList.remove(\"ltt-hidden\");\n          try {", "          ans.classList.remove(\"ltt-hidden\");\n          try {", "resize"),
    ("HM-10", "skills/learn-to-tell/kit/API.md", "- figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다).\n", "", "npm"),
    ("HM-11", DECK, "LTT.placement = { zoomLock: zoomLock };", "LTT.placement = { zoomLock: zoomLock, width: function () { return innerWidth; } };", "npm"),
    ("HM-12", DECK, "placement.release(a); b.disabled = true;", "a.classList.remove(\"pending\"); b.disabled = true;", "r3"),
    # v5 (verifier 1 TV-2/TV-4, HM-6 re-probe): HM-6 again with the C-17 fixture, plus classes the verifier named undetected.
    ("HM-6b", DECK, "for (var k = 0; k < o.count; k++)", "for (var k = 0; k < o.count - 1; k++)", "errors"),
    ("HM-13", DECK, "}, function (e) { z = 1; fail(e); }, function () {", "}, function (e) { z = zoomLock(question, zs); fail(e); }, function () {", "errors"),
    ("HM-14", DECK, "        placement.still(pic, measureAll, function (e) {\n          tallest = { side: 0, stack: 0 };\n", "        placement.still(pic, measureAll, function (e) {\n", "errors"),
    ("HM-15", DECK, "LTT.warn(\"장면 \" + (ctx.index + 1) + \": answerVisual을", "LTT.warn(\"장면 \" + ctx.index + \": answerVisual을", "errors"),
    ("HM-16", DECK, "            o.draw(o.chosen());\n", "            [].forEach.call(w.querySelectorAll(\".ltt-choices button\"), function (x) { var v = x.getAttribute(\"aria-pressed\"); x.setAttribute(\"aria-pressed\", \"false\"); x.setAttribute(\"aria-pressed\", v); });\n            o.draw(o.chosen());\n", "resize"),
]

def sh(cmd, timeout=900):
    p = subprocess.run(cmd, cwd=repo, shell=True, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout + p.stderr

def detect(kind):
    if kind == "npm":
        rc, o = sh("npm test 2>&1")
        fails = re.findall(r"^✖ (.+?) \(\d", o, re.M)
        m = re.search(r"^ℹ fail (\d+)", o, re.M)
        names = sorted(set(f for f in fails if f != "failing tests:"))
        return {"fail": int(m.group(1)) if m else None, "tests": names[:12]}
    if kind == "resize":
        f = os.path.join(SCRATCH, "resize.json")
        rc, o = sh(f"node {LOGS}/74cb05d7da21907e-cdp-review.mjs resize {repo} {f} 2")
        r = json.load(open(f))
        bad = [x for x in r["rows"] if x.get("error") or not x["ok"]]
        return {"cases": r["cases"], "bad": len(bad), "sample": [{k: x.get(k) for k in ("rel", "scene", "from", "kind", "delta", "shown", "sameAnswerText", "sameMarks")} for x in bad[:3]]}
    if kind == "dom":
        dirs = []
        for i in (1, 2):
            d = os.path.join(SCRATCH, f"dom-{i}")
            sh(f"rm -rf {d} && node {LOGS}/0041d668222ce019-dom-dump.mjs {repo} {d}")
            dirs.append(d)
        base = " ".join(os.path.join(os.environ["LTT_BASE_DUMPS"], f"dom-base-{i}") for i in range(1, 6))
        rc, o = sh(f"bash {LOGS}/0041d668222ce019-dom-match.sh \"{base}\" \"{' '.join(dirs)}\"")
        nom = [l.split()[1] for l in o.splitlines() if l.startswith("NOMATCH")]
        allowed = {f"{s}__network__tls13-quic.html" for s in ("1440x900", "1280x800")} | {f"{s}__knowledge-graph__ontology-triples.html" for s in ("1440x900", "1280x800")}
        return {"nomatch_outside_B": sorted(set(nom) - allowed), "summary": o.strip().splitlines()[-1]}
    if kind == "errors":
        f = os.path.join(SCRATCH, "errors.json")
        sh(f"node {LOGS}/74cb05d7da21907e-cdp-review.mjs errors {repo} {f}")
        r = json.load(open(f))["rows"]
        fails = []
        e1, e2, e3, e5 = r["EG1"], r["EG2"], r["EG3"], r["EG5"]
        if e1["zoomEntry"] != 1: fails.append("EG1 zoom")
        if not e1["exactWarn"] or not e1["warns"]: fails.append("EG1 warn")
        if e1["pressed"] or e1["right"] or e1["wrong"] or e1["still"]: fails.append("EG1 marks/still")
        if not (e2["shown"] and e2["done"] and e2["pressed"] == ["a"] and e2["right"] == ["a"] and not e2["still"] and e2["warnsAfter"] > e2["warnsBefore"]): fails.append("EG2")
        if not e3["exactWarn"] or not e3["warns"] or e3["still"] or e3["pk"] or e3["drawing"] != "단계 0" or (e3["minHeight"] and float(e3["minHeight"].rstrip("px")) >= 300): fails.append("EG3")
        if r["EG4"]["warnsAfterResize"] <= e3["warns"]: fails.append("EG4")
        if e5["revealsOnPick"] != 1 or e5["reveals"] != 0 or e5["records"] != 0: fails.append("EG5")
        if r["C16"]["callsPerLock"] != 1: fails.append("C16")
        if not r["C17"]["minHeight"] or float(r["C17"]["minHeight"].rstrip("px")) < 300: fails.append("C17")
        return {"fails": fails, "rows": r}
    if kind == "r3":
        rc, o = sh(f"node {LOGS}/74cb05d7da21907e-r3-grep.mjs {DECK}")
        return json.loads(o.strip().splitlines()[-1])
    raise ValueError(kind)

def detected(kind, r):
    if kind == "npm": return bool(r["fail"])
    if kind == "resize": return r["bad"] > 0
    if kind == "dom": return bool(r["nomatch_outside_B"])
    if kind == "errors": return bool(r["fails"])
    if kind == "r3": return bool(r["hits"])

results = []
for hid, path, old, new, kind in M:
    if only and hid not in only: continue
    full = os.path.join(repo, path)
    src = open(full, encoding="utf8").read()
    if src.count(old) != 1:
        results.append({"id": hid, "error": f"anchor count {src.count(old)}"}); continue
    rc, o = sh(f"python3 .harness/bin/seed.py backup {path}")
    if rc: results.append({"id": hid, "error": "backup failed: " + o}); continue
    try:
        open(full, "w", encoding="utf8").write(src.replace(old, new))
        r = detect(kind)
        results.append({"id": hid, "detector": kind, "detected": detected(kind, r), "result": r})
    finally:
        rc, o = sh("python3 .harness/bin/seed.py restore")
        if open(full, encoding="utf8").read() != src:
            results.append({"id": hid, "error": "RESTORE MISMATCH"}); json.dump(results, open(out, "w"), ensure_ascii=False, indent=1); sys.exit(2)
    print(hid, kind, results[-1].get("detected"), flush=True)
json.dump(results, open(out, "w"), ensure_ascii=False, indent=1)
rc, o = sh("python3 .harness/bin/seed.py status")
print("seed status:", o.strip())
