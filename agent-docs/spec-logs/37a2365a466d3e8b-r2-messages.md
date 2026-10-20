# R-2 message sample (spec 37a2365a466d3e8b v2; rechecked v5: all 100 audit messages identical after correction batches)

Source: R-1 new kit, first stage (`r1-new-first-1/audit.json`). shrunk sample: `random.seed(37)`, 5 of 47; overflow and hscroll: all. Scene sources read by evaluating each first draft's deck script against a stub `LTT` (top-level prose fields, `{{term}}` marks and HTML tags stripped, as the kit counts visible characters).

| lesson · size · scene | rule | message claim | source | match |
| --- | --- | --- | --- | --- |
| shot-check cache-ttl-after · 1280 · 6 | shrunk | 78% floor, longest takeaway 76 | untyped scene; takeaway 76 > narration 52 > recall 44; measures zoom 0.78 floor true | yes |
| final-check cpu-cache-head · 1440 · 6 | shrunk | 78% floor, longest narration 90 | narration 98 raw, 90 visible (marks stripped) > ask 74 | yes |
| audit5 cache-ttl-base-2 · 1280 · 5 | shrunk | 85%, set by 정답 "#1은 절반 가까이 줄고 #1000은 조금만 준다", longest why 128 | predict; that string is choice 2; why 128 > question 77 | yes |
| final-check cpu-cache-head · 1280 · 5 | shrunk | 78% floor, set by 질문, longest why 158 | predict; why 189 raw, 158 visible (tags stripped) > question 54 | yes |
| final-check projectile-base · 1280 · 7 | shrunk | 85%, longest narration 70 | narration 70 > takeaway 63 | yes |
| audit5 cache-ttl-base-2 · 1440 / 1280 · 1 | overflow | 78% floor | hook, measures zoom 0.78 floor true, absorb 1 (no drawing) | yes |
| audit5 cache-ttl-base-2 · 1280 · 8 | overflow | 78% floor | measures zoom 0.78 floor true, absorb 0.65 | yes |
| audit5 projectile-base-2 · 1440 / 1280 · 5 | hscroll | 23px over, widest div.ltt-stat 234px | page uses `.ltt-stat` blocks in that scene | yes (class present; width not re-measured outside Chrome) |

QR-5: 10 / 10 messages consistent with the source.
