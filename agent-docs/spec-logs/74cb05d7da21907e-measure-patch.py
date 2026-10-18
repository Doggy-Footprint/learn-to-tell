#!/usr/bin/env python3
# Usage: 74cb05d7da21907e-measure-patch.py <copy of skills/learn-to-tell/kit/ltt-deck.js> [--visible-only]
# run 74cb05d7da21907e 측정 전용(E 사례 조사, widen 동작 조사). 기준 커밋 사본의 ltt-deck.js에 계측을 넣는다.
# 원래 경로(lockZoom이 정한 zmax, widen 판정)는 바꾸지 않고, 그 뒤에 선택지마다 공개 상태를 흉내 내 floatPanel로 잰 값을
# <script id="ltt-measure"> JSON에 남긴다. 저장소 kit에는 적용하지 않는다.
import sys

path = sys.argv[1]
visible_only = len(sys.argv) > 2 and sys.argv[2] == "--visible-only"
src = open(path, encoding="utf8").read()


def sub(old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.exit(f"patch anchor found {n} times: {old[:60]!r}")
    src = src.replace(old, new)


sub('var h = LTT.h, fill = LTT.fill;',
    'var h = LTT.h, fill = LTT.fill;\n'
    '  var __M = root.__lttM = root.__lttM || { predict: {}, widen: {}, steps: {} };\n'
    '  function __save() { var o = document.getElementById("ltt-measure"); if (!o) { o = document.createElement("script"); o.id = "ltt-measure"; o.type = "application/json"; document.documentElement.appendChild(o); }'
    ' o.textContent = JSON.stringify(__M).replace(/</g, "\\\\u003c"); }')

# figure steps: which scenes go below (stuck), and whether widen fired and was kept
sub('        function measureAll() {\n          unwiden();',
    '        function measureAll() {\n          __M.widen[ctx.index + 1] = null;\n          unwiden();')
sub('            if (widen()) {\n',
    '            if (widen()) {\n              __M.widen[ctx.index + 1] = { size: innerWidth + "x" + innerHeight, kept: null };\n')
sub('              if (ctx.el.firstChild.style.zoom) { unwiden(); tallest.stack = before; }\n            }\n          }\n',
    '              var __kept = !ctx.el.firstChild.style.zoom;\n              __M.widen[ctx.index + 1].kept = __kept;\n'
    '              if (!__kept) { unwiden(); tallest.stack = before; }\n            }\n          }\n'
    '          __M.steps[ctx.index + 1] = { size: innerWidth + "x" + innerHeight, stuck: stuck, side: tallest.side, stack: tallest.stack };\n          __save();\n')

# predict: per-choice in-flow zoom, then float-aware zoom (option C simulation)
sub('        var z = ctx.refit();\n        ans.classList.remove("ltt-hidden");',
    '        var z = ctx.refit(), __z0 = z, __inflow = [];\n        ans.classList.remove("ltt-hidden");')
sub('              z = Math.min(z, ctx.refit());',
    '              var __zi = ctx.refit(); __inflow.push(__zi); z = Math.min(z, __zi);')
sub('        ctx.zmax = z;\n      }\n      ctx.place = function () {\n        if (w.classList.contains("done"))',
    '''        ctx.zmax = z;
        (function () {
          // v2 (ledger 4): a hidden scene has no solid boxes for freeSlot, so only the visible (current) scene is measured.
          if (MEASURE_VISIBLE_ONLY && getComputedStyle(ctx.el).visibility === "hidden") return;
          var rec = { size: innerWidth + "x" + innerHeight, z0: __z0, inflow: __inflow, zInflow: z, choices: [] };
          var btns = [].slice.call(box.querySelectorAll("button")), zf = __z0, t0 = performance.now();
          w.classList.add("dk-still");
          try {
            LTT.measure(function () {
              choices.forEach(function (c) {
                btns.forEach(function (b) {
                  b.setAttribute("aria-pressed", String(b.dataset.choice === c.id));
                  b.classList.toggle("right", b.dataset.choice === String(s.answer));
                  b.classList.toggle("wrong", b.dataset.choice === c.id && c.id !== String(s.answer));
                });
                w.classList.add("done"); ans.classList.remove("ltt-hidden"); ans.classList.add("dk-probe");
                if (typeof s.answerVisual === "function") { av.replaceChildren(); s.answerVisual(av, c.id); }
                else if (s.answerVisual) av.innerHTML = s.answerVisual;
                ctx.zmax = 1;
                var zin = ctx.refit();
                ctx.zmax = __z0;
                var ok = ctx.float(ans, w, faded, !faded);
                var zc = ok ? __z0 : Math.min(__z0, zin);
                rec.choices.push({ id: c.id, inflow: zin, floats: ok, z: zc });
                zf = Math.min(zf, zc);
                ans.classList.remove("dk-float"); ans.style.left = ans.style.top = ans.style.width = "";
              });
            });
          } catch (e) { rec.error = e.message; }
          finally {
            btns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); b.classList.remove("right", "wrong"); });
            w.classList.remove("done"); ans.classList.remove("dk-probe"); ans.classList.add("ltt-hidden"); av.replaceChildren();
            void w.offsetHeight; w.classList.remove("dk-still");
            ctx.zmax = z; ctx.refit();
          }
          rec.zFloat = zf; rec.gain = zf - z; rec.ms = performance.now() - t0;
          __M.predict[ctx.index + 1] = rec; __save();
        })();
      }
      ctx.place = function () {
        if (w.classList.contains("done"))''')

src = src.replace('var __M = root.__lttM', 'var MEASURE_VISIBLE_ONLY = ' + ('true' if visible_only else 'false') + ';\n  var __M = root.__lttM', 1)
open(path, "w", encoding="utf8").write(src)
print("patched", path)
