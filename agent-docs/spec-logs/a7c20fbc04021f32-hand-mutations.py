import subprocess, sys, re, pathlib
G = pathlib.Path("skills/learn-to-tell/gallery")
I, C = G/"index.html", G/"catalog.html"
def sub(p, old, new, count=1):
    s = p.read_text(); assert old in s, (p, old); p.write_text(s.replace(old, new, count))
M = {
 "M1 d3 version stale": lambda: sub(I, "<td>7.9.0</td>", "<td>7.9.1</td>"),
 "M2 prismjs row removed": lambda: I.write_text(re.sub(r'\s*<tr data-vendor="prismjs">.*?</tr>', "", I.read_text(), flags=re.S)),
 "M3 extra mathjax row": lambda: sub(I, "</tbody>", '<tr data-vendor="mathjax"><td>mathjax</td><td>3.2.2</td><td>x</td><td>x</td></tr></tbody>'),
 "M4 katex script removed": lambda: sub(C, '<script src="/kit/vendor/katex/katex.min.js"></script>\n', ""),
 "M5 katex after kit": lambda: (sub(C, '<script src="/kit/vendor/katex/katex.min.js"></script>\n', ""), sub(C, '<script src="/kit/ltt.js"></script>\n', '<script src="/kit/ltt.js"></script>\n<script src="/kit/vendor/katex/katex.min.js"></script>\n')),
 "M6 math demo removed": lambda: sub(C, 'demo("math"', 'demo("maths"'),
 "M7 hex in style": lambda: sub(I, ".sp-note { margin: 0 0 6px;", ".sp-note { color: #777; margin: 0 0 6px;"),
 "M8 map feature removed": lambda: I.write_text(re.sub(r'\s*<li data-feature="map">.*?</li>', "", I.read_text(), flags=re.S)),
}
for name, f in M.items():
    subprocess.run(["python3", ".harness/bin/seed.py", "backup", str(I), str(C)], check=True, capture_output=True)
    try:
        f()
        r = subprocess.run(["node", "--test", "tests/"], capture_output=True, text=True, timeout=120)
        fails = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith("✖") and "failing tests" not in l]
        print(f"{name}: exit={r.returncode} failing={sorted(set(fails))[:3]}")
    finally:
        rr = subprocess.run(["python3", ".harness/bin/seed.py", "restore"], capture_output=True, text=True)
        if rr.returncode: print("RESTORE FAILED", rr.stderr); sys.exit(1)

# --- v2 set ---
