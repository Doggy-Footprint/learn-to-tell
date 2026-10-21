# Hand mutations for spec 80a1b2f18f50b1df: inject one violation, run the intended test file(s), restore.
import subprocess, sys, re, json
R="/Users/hwansu/toy-projects/learn-to-tell"
K="skills/learn-to-tell/kit/"
M=[
 ("HM-1 termIssues ignores defines for first position (F-1)", K+"ltt.js", "        if (!(k in first)) first[k] = i;\n", "", ["tests/check.test.mjs"]),
 ("HM-2 deck page drops meta glossary in deckIssues (F-2)", K+"ltt.js", "[extraGlossary, spec.glossary].forEach", "[spec.glossary].forEach", ["tests/check-page.test.mjs","tests/lint-rules.test.mjs"]),
 ("HM-3 walker/link enters textarea and #ltt-expect", K+"ltt.js", 'noscript,textarea,#ltt-expect,#ltt-pop', 'noscript,#ltt-pop', ["tests/check-page.test.mjs"]),
 ("HM-4 goal errors before static errors", K+"ltt.js", "errors = errors.concat(goalIssues(goals), expectFails", "errors = goalIssues(goals).concat(errors, expectFails", ["tests/check-page.test.mjs"]),
 ("HM-5 lint event sent on manual check and includes expect-mismatch", K+"ltt.js", 'if (auto) {\n      var lint = errors.filter(function (e) { return e.rule !== "expect-mismatch"; });', 'if (true) {\n      var lint = errors;', ["tests/check-page.test.mjs"]),
 ("HM-6 #ltt-check does not escape <", K+"ltt.js", 'out.textContent = JSON.stringify(result).replace(/</g, "\\\\u003c");', 'out.textContent = JSON.stringify(result);', ["tests/check-page.test.mjs"]),
 ("HM-7 recall answer not trimmed", K+"ltt-ui.js", "answer: box.value.trim() });", "answer: box.value });", ["tests/check-page.test.mjs"]),
 ("HM-8 deck ?check does not mount all scenes", K+"ltt-deck.js", "if (/[?&](check|audit)\\b/.test(location.search)) mountAll();", "if (false) mountAll();", ["tests/check-page.test.mjs"]),
 ("HM-9 audit.mjs exit code ignores check", "skills/learn-to-tell/server/audit.mjs", " || r.expectFails.length || r.check.length) ? 1 : 0;", " || r.expectFails.length) ? 1 : 0;", ["tests/check-page.test.mjs"]),
 ("HM-10 auditScene re-emits goal-at-start", K+"ltt.js", '      if (g.hits && g.hits < 2) add("goal-narrow",', '      if (g.start) add("goal-at-start", "x");\n      if (g.hits && g.hits < 2) add("goal-narrow",', ["tests/kit.test.mjs"]),
]
only = sys.argv[1:]
res=[]
for name,f,old,new,tests in M:
    if only and name.split()[0] not in only: continue
    p=f"{R}/{f}"; src=open(p).read()
    n=src.count(old)
    if n!=1: res.append((name,"SETUP-FAIL count=%d"%n,"")); continue
    subprocess.run(["python3",".harness/bin/seed.py","backup",f],cwd=R,check=True,capture_output=True)
    try:
        open(p,"w").write(src.replace(old,new))
        out=subprocess.run(["node","--test",*tests],cwd=R,capture_output=True,text=True,timeout=600).stdout
        fails=[l.strip() for l in out.splitlines() if l.startswith("✖ ") and "failing tests" not in l]
        fails=sorted(set(re.sub(r" \([0-9.]+ms\)$","",x) for x in fails))
        res.append((name,"KILLED" if fails else "SURVIVED",fails))
    finally:
        r=subprocess.run(["python3",".harness/bin/seed.py","restore"],cwd=R,capture_output=True,text=True)
        if r.returncode!=0: print("RESTORE FAILED",r.stderr); sys.exit(2)
for name,st,fails in res:
    print(f"{name}: {st}")
    for x in (fails or [])[:6]: print("    ",x)
