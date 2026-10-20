import subprocess, sys, re
J="skills/learn-to-tell/kit/ltt.js"; R="skills/learn-to-tell/kit/api/rules.md"; C="skills/learn-to-tell/kit/CHANGELOG.md"
def block_move(s):
    a=s.index('    { id: "icon-not-string"'); b=s.index('    { id: "card-monotony"')
    blk=s[a:b]; s=s[:a]+s[b:]
    f=s.index('    { id: "filler-content"'); return s[:f]+blk+s[f:]
M=[
 ("HM-1 falsy treated as bad",J,lambda s:s.replace('if (v && typeof v !== "string")','if (v != null && typeof v !== "string")')),
 ("HM-2 array kind named object",J,lambda s:s.replace('(Array.isArray(v) ? "array" : typeof v)','typeof v')),
 ("HM-3 1-based path index",J,lambda s:s.replace('name + "[" + k + "].icon"','name + "[" + (k + 1) + "].icon"')),
 ("HM-4 only first element checked",J,lambda s:s.replace('list.forEach(function (e, k) { if (e && typeof e === "object") check','list.slice(0, 1).forEach(function (e, k) { if (e && typeof e === "object") check')),
 ("HM-5 terms field dropped",J,lambda s:s.replace('else if (s.type === "terms") each(s.terms, "terms");','')),
 ("HM-6 explain check ignores scene type",J,lambda s:s.replace('else if (s.type === "explain") each(s.steps, "steps");','else if (s.steps) each(s.steps, "steps");')),
 ("HM-7 registered before filler-content",J,block_move),
 ("HM-8 element null guard removed",J,lambda s:s.replace('if (e && typeof e === "object") check(e.icon','check(e.icon')),
 ("HM-9 scene index off by one",J,lambda s:s.replace('out.push([i, "icon-not-string"','out.push([i - 1, "icon-not-string"')),
 ("HM-10 rules.md graded 권고",R,lambda s:s.replace('| `icon-not-string` | 고침 |','| `icon-not-string` | 권고 |')),
]
for name,path,fn in M:
    subprocess.run(["python3",".harness/bin/seed.py","backup",path],check=True,capture_output=True)
    s=open(path).read(); t=fn(s)
    if t==s: print(name,"NOT APPLIED"); subprocess.run(["python3",".harness/bin/seed.py","restore"],check=True); continue
    open(path,"w").write(t)
    p=subprocess.run(["node","--test","tests/lint-rules.test.mjs","tests/api-docs.test.mjs"],capture_output=True,text=True)
    fails=sorted(set(l[2:].split(" (")[0] for l in p.stdout.splitlines() if l.startswith("✖ ") and "84c0" in l or l.startswith("✖ ") and "lint rules" in l))
    other=[l for l in p.stdout.splitlines() if l.startswith("✖ ") and "84c0" not in l and "lint rules" not in l and "failing tests" not in l]
    print(f"{name}: {'KILLED' if p.returncode else 'SURVIVED'} 84c0-fails={len(fails)} e.g. {fails[:2]} other={len(set(other))}")
    r=subprocess.run(["python3",".harness/bin/seed.py","restore"],capture_output=True,text=True)
    if r.returncode: print("RESTORE FAILED",r.stderr); sys.exit(1)
