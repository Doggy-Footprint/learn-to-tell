import subprocess, sys, re, pathlib
G = pathlib.Path("skills/learn-to-tell/gallery")
I, C = G/"index.html", G/"catalog.html"
def sub(p, old, new, count=1):
    s = p.read_text(); assert old in s, (p, old); p.write_text(s.replace(old, new, count))
def rx(p, pat, new):
    s = p.read_text(); n = re.sub(pat, new, s, count=1, flags=re.S); assert n != s, pat; p.write_text(n)
M = {
 "M2 prismjs row removed": lambda: rx(I, r'\s*<tr data-vendor="prismjs">.*?</tr>', ""),
 "M3 extra mathjax row": lambda: sub(I, "</tbody>", '<tr data-vendor="mathjax"><td>mathjax</td><td>3.2.2</td><td>x</td><td>x</td></tr></tbody>'),
 "M6 math demo renamed": lambda: sub(C, 'demo("math"', 'demo("maths"'),
 "M8 map feature removed": lambda: rx(I, r'\s*<li data-feature="map">.*?</li>', ""),
 "M9 display block removed from demo": lambda: sub(C, '<div data-tex="\\\\det A = ad - bc" data-display></div>', ''),
 "M9b LTT.math call removed from demo": lambda: sub(C, "    LTT.math(el);\n  });\n\n  group(\"장면 덱", "  });\n\n  group(\"장면 덱"),
 "M9c inline tex removed from demo": lambda: sub(C, '<span data-tex="A\\\\mathbf{x}"></span>', "Ax"),
 "M10 chip href removed": lambda: sub(I, '<a class="sp-chip" data-group="ltt-ui.js" href="catalog.html">', '<a class="sp-chip" data-group="ltt-ui.js">'),
 "M11 feature moved outside card": lambda: (rx(I, r'\s*<li data-feature="sketch">.*?</li>', ""), sub(I, '<h3 class="group">예시 수업', '<ul><li data-feature="sketch"><b>손그림</b> /kit/vendor/rough.js</li></ul>\n  <h3 class="group">예시 수업')),
 "M12 d3 row duplicated": lambda: rx(I, r'(<tr data-vendor="d3">.*?</tr>)', r'\1\1'),
 "M13a purpose cell blanked": lambda: sub(I, "<td>코드 색 입히기</td>", "<td> </td>"),
 "M13b chip with one part": lambda: sub(I, "<code>LTT.diagram</code> · <code>LTT.sweep</code> · <code>LTT.sankey</code>", "<code>LTT.diagram</code>"),
 "M13c feature without vendor path": lambda: sub(I, "<code>/kit/vendor/elk.bundled.js</code>가 필요하다.", "elkjs가 필요하다."),
}
for name, f in M.items():
    subprocess.run(["python3", ".harness/bin/seed.py", "backup", str(I), str(C)], check=True, capture_output=True)
    try:
        f()
        r = subprocess.run(["node", "--test", "tests/"], capture_output=True, text=True, timeout=120)
        fails = sorted({l.strip().split(" (")[0] for l in r.stdout.splitlines() if l.strip().startswith("✖") and "failing tests" not in l})
        print(f"{name}: exit={r.returncode} failing={fails}")
    except AssertionError as e:
        print(f"{name}: SETUP FAILED {e}")
    finally:
        rr = subprocess.run(["python3", ".harness/bin/seed.py", "restore"], capture_output=True, text=True)
        if rr.returncode: print("RESTORE FAILED", rr.stderr); sys.exit(1)
