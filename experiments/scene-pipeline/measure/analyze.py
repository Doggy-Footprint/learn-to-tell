"""analyze.py <metrics.tsv> -> per metric: threshold, clean false-failure, injection detection, natural-label recall and AUC.
Rules were fixed in the handoff before the main run: threshold = strictest value that fails at most 10% of clean originals (ties fail);
pass = injection detection >= 90% and, for defect types with >= 3 labelled scenes, AUC vs clean >= 0.75. Identical scene files count once."""
import sys, csv, json, hashlib, pathlib
HERE = pathlib.Path(__file__).resolve().parent
L = json.load(open(HERE / "labels.json"))
MAP = [("shake", "frame_jumps", "high", "shake"), ("choppy", "teleport_ratio", "high", "choppy"), ("choppy", "travel_per_change", "low", "choppy"),
       ("hidden", "hidden_controls", "high", "below"), ("hidden", "svg_visible", "low", "below"), ("hidden", "hidden_text", "high", "below"),
       ("no_anim", "smooth_px", "low", "freeze"), ("small", "svg_area", "low", "small"), ("fast", "speed_p90", "high", "fast")]
# a missing value means nothing moved / no SVG: ratios with no motion count as 0, a missing SVG counts as not visible and zero area
def val(row, m):
    v = row.get(m)
    return 0.0 if v in (None, "", "None") else float(v)

rows = {r["run"]: r for r in csv.DictReader(open(sys.argv[1]), delimiter="\t")}
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
    cv = [val(rows[key(k)], m) for k in clean]
    allv = sorted({val(r, m) for r in rows.values()}, reverse=(d == "low"))
    thr = next((v for v in allv if sum(fails(x, v, d) for x in cv) <= len(cv) // 10), None)
    cf = sum(fails(x, thr, d) for x in cv)
    iv = [val(rows[f"{key(k)}+{inj}"], m) for k in clean if f"{key(k)}+{inj}" in rows]
    det = sum(fails(x, thr, d) for x in iv) / len(iv)
    lab = dedup(L[typ]); lv = [val(rows[key(k)], m) for k in lab]
    rec = sum(fails(x, thr, d) for x in lv); a = auc(lv, cv, d)
    ok = det >= 0.9 and (len(lv) < 3 or a >= 0.75)
    print(f"{typ}\t{m}\t{d}\t{thr}\t{cf}/{len(cv)}\t{det:.2f} ({len(iv)})\t{rec}/{len(lv)}\t{a:.2f}\t{'PASS' if ok else 'fail'}")
    missed = [k for k in lab if not fails(val(rows[key(k)], m), thr, d)]
    if missed: print(f"\t  missed labels: {', '.join(missed)}")
