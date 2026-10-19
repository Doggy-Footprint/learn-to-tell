import subprocess, sys, json, re
A="skills/learn-to-tell/server/audit.mjs"; K="skills/learn-to-tell/kit/ltt-parts.js"
M=[
("HM-1","FR-3 floor instead of round",A,"list[Math.round((k * (list.length - 1)) / (MAX_CELLS - 1))]","list[Math.floor((k * (list.length - 1)) / (MAX_CELLS - 1))]"),
("HM-2","FR-3 texted preference dropped",A,"(texted.length ? texted : beats).slice()","beats.slice()"),
("HM-3","FR-4 capture 400ms early",A,"Math.max(1, c.t);","Math.max(1, c.t - 400);"),
("HM-4","FR-2 always first size",A,"sizes.includes(SHEET_SIZE) ? SHEET_SIZE : sizes[0]","sizes[0]"),
("HM-5","FR-5 warn from sheet size only",A,"if (r.target !== target || r.error) continue;","if (r.target !== target || r.error || r.size !== SHEET_SIZE) continue;"),
("HM-6","FR-7 cleanup regex unanchored",A,"const SHEET_FILE = /^sheet(-\\d+)?\\.jpg$/;","const SHEET_FILE = /sheet.*\\.jpg/;"),
("HM-7","Errors compose failure exit 1",A,"if (results.some((r) => r.error || (r.sheet && r.sheet.error))) return 2;","if (results.some((r) => r.error)) return 2;"),
("HM-8","QR-5 slug keeps / and ..",A,"let slug = label.replace(/[^\\w.-]/g, \"-\");","let slug = label.replace(/:/g, \"-\");"),
("HM-9","FR-11 textless still hides text",K,"else if (b.text && !sc.beats[at].text) sc.beats[at] = { t: b.t, text: b.text };","else if (false) sc.beats[at] = { t: b.t, text: b.text };"),
("HM-10","FR-8 area cap ignored",A,"const maxH = Math.min(SHEET_MAX_SIDE, Math.floor(SHEET_MAX_AREA / width));","const maxH = SHEET_MAX_SIDE;"),
("HM-11","Errors frame failure aborts sheet",A,"c.failed = !c.src;\n  });","c.failed = !c.src;\n    if (c.failed) throw new Error(\"frame\");\n  });"),
("HM-12","FR-1 sheet without flag",A,"if (sheet) await makeSheets(","if (true) await makeSheets("),
("HM-13","FR-1 extra capture Chrome without flag",A,"    if (sheet) await makeSheets(chrome, tmp, results, sizes, jobs, home, budget);","    if (sheet) await makeSheets(chrome, tmp, results, sizes, jobs, home, budget);\n    else await runChrome(chrome, chromeArgs(join(tmp, \"hmx\"), sizes[0], \"--virtual-time-budget=100\", \"--screenshot=\" + join(tmp, \"hmx.png\"), runs[0].url.split(\"#\")[0] + \"#1\"));"),
("HM-14","FR-4 rest cell captured at entry",A,"const at = c.t == null ? budget : Math.max(1, c.t);","const at = c.t == null ? 1 : Math.max(1, c.t);"),
("HM-15","Errors other cells reuse one image after a failure",A,"  await pool(ready, Math.max(1, jobs), async (job) => {\n    const { sheet } = job.r;","  for (const job of ready) { const cs = job.r.sheet.cells; if (cs.some((c) => c.failed)) { const first = cs.find((c) => c.src).src; cs.forEach((c) => { if (c.src) c.src = first; }); } }\n  await pool(ready, Math.max(1, jobs), async (job) => {\n    const { sheet } = job.r;"),
("HM-16","Errors compose failure drops other targets' sheets",A,"    job.r.sheet.failed = job.r.sheet.cells.filter((c) => c.failed).length;\n  }","    job.r.sheet.failed = job.r.sheet.cells.filter((c) => c.failed).length;\n  }\n  if (jobsList.some((j) => j.r.sheet.error)) jobsList.forEach((j) => { j.r.sheet.files = []; });"),
("HM-17","FR-4 rest cell ignores --budget (fixed 12000)",A,"const at = c.t == null ? budget : Math.max(1, c.t);","const at = c.t == null ? 12000 : Math.max(1, c.t);"),
]
only=sys.argv[1:] 
out=open(sys.argv[0].replace("hm.py","hm-results.txt"),"a")
for mid,desc,f,old,new in M:
    if only and mid not in only: continue
    src=open(f).read()
    if src.count(old)!=1:
        out.write(f"{mid} SETUP-FAIL pattern count {src.count(old)}\n"); out.flush(); continue
    subprocess.run(["python3",".harness/bin/seed.py","backup",f],check=True)
    try:
        open(f,"w").write(src.replace(old,new))
        p=subprocess.run("LTT_AUDIT=1 node --test tests/audit-sheet.test.mjs",shell=True,capture_output=True,text=True,timeout=900)
        fails=re.findall(r"^✖ (.+?)(?: \(\d)",p.stdout,re.M)
        st="KILLED" if p.returncode!=0 else "SURVIVED"
        out.write(f"{mid} {desc}: {st} exit {p.returncode}; failing: {sorted(set(fails))[:6]}\n"); out.flush()
    finally:
        r=subprocess.run(["python3",".harness/bin/seed.py","restore"])
        if r.returncode!=0: out.write(f"{mid} RESTORE FAILED\n"); out.flush(); sys.exit(1)
        if open(f).read()!=src: out.write(f"{mid} RESTORE MISMATCH\n"); out.flush(); sys.exit(1)
out.write("DONE\n")
