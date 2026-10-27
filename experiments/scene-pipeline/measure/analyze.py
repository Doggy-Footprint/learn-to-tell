"""analyze.py <metrics.tsv> -> per metric: threshold, clean false-failure, injection detection, natural-label recall and AUC.
Rules were fixed in the handoff before the main run: threshold = strictest value that fails at most 10% of clean originals (ties fail);
pass = injection detection >= 90% and, for defect types with >= 3 labelled scenes, AUC vs clean >= 0.75. Identical scene files count once."""
import sys, csv, json, hashlib, pathlib
HERE = pathlib.Path(__file__).resolve().parent
L = json.load(open(HERE / "labels.json"))
MAP = [("shake", "frame_jumps", "high", "shake"), ("recreate", "path_shown", "low", "choppy"), ("recreate", "text_jump_ratio", "high", "choppy"), ("rough", "isolated_change", "high", "choppy"),
       ("hidden", "hidden_controls", "high", "below"), ("hidden", "svg_visible", "low", "below"), ("hidden", "hidden_text", "high", "below"),
       ("no_anim", "smooth_px", "low", "freeze"), ("small", "svg_area", "low", "small"), ("fast", "speed_p90", "high", "fast")]
# a missing value means nothing moved / no SVG: ratios with no motion count as 0, a missing SVG counts as not visible and zero area
# except label-tracking metrics, where no moving SVG label means the check does not apply and the scene is left out
NA = {"path_shown", "text_jump_ratio"}
def val(row, m):
    v = row.get(m)
    if v in (None, "", "None"): return None if m in NA else 0.0
    return float(v)

rows = {r["run"]: r for r in csv.DictReader(open(sys.argv[1]), delimiter="\t")}
# --exclude <topic/round>: drop scenes whose bundle was used to shape a metric definition
EXCL = sys.argv[sys.argv.index("--exclude") + 1].split(",") if "--exclude" in sys.argv else []
L = {k: [x for x in v if not any(x.startswith(e + "/") for e in EXCL)] if isinstance(v, list) else v for k, v in L.items()}
def key(k): return k.replace("/", "_")
def dedup(keys):
    seen, out = set(), []
    for k in keys:
        h = hashlib.md5(open(HERE.parent / "round-hsh" / k / "scene.html", "rb").read()).hexdigest()
        if h not in seen and key(k) in rows: seen.add(h); out.append(k)
    return out
clean = dedup(L["clean"])
fails = lambda x, thr, d: x >= thr if d == "high" else x <= thr
def auc(pos, neg, d):
    s = sum((1 if (p > n if d == "high" else p < n) else 0.5 if p == n else 0) for p in pos for n in neg)
    return s / (len(pos) * len(neg))

print(f"clean {len(clean)} (after dedup)\n")
print("type\tmetric\tdir\tthreshold\tclean_fail\tinj_detect\tlabel_recall\tAUC\tpass")
for typ, m, d, inj in MAP:
    cv = [x for x in (val(rows[key(k)], m) for k in clean) if x is not None]
    allv = sorted({x for x in (val(r, m) for r in rows.values()) if x is not None}, reverse=(d == "low"))
    thr = next((v for v in allv if sum(fails(x, v, d) for x in cv) <= len(cv) // 10), None)
    cf = sum(fails(x, thr, d) for x in cv)
    iv = [x for x in (val(rows[f"{key(k)}+{inj}"], m) for k in clean if f"{key(k)}+{inj}" in rows) if x is not None]
    det = sum(fails(x, thr, d) for x in iv) / len(iv)
    lab = [k for k in dedup(L[typ]) if val(rows[key(k)], m) is not None]; lv = [val(rows[key(k)], m) for k in lab]
    rec = sum(fails(x, thr, d) for x in lv); a = auc(lv, cv, d)
    ok = det >= 0.9 and (len(lv) < 3 or a >= 0.75)
    print(f"{typ}\t{m}\t{d}\t{thr}\t{cf}/{len(cv)}\t{det:.2f} ({len(iv)})\t{rec}/{len(lv)}\t{a:.2f}\t{'PASS' if ok else 'fail'}")
    missed = [k for k in lab if not fails(val(rows[key(k)], m), thr, d)]
    if missed: print(f"\t  missed labels: {', '.join(missed)}")
