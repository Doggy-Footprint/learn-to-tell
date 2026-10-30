"""Thresholds and pass rules were pre-registered in the handoff (2026-10-27) before the main run; changing them invalidates that result."""
import sys, csv, json, hashlib, pathlib, statistics
HERE = pathlib.Path(__file__).resolve().parent
L = json.load(open(HERE / "labels.json"))
ARM = {"zero": "zero", "0R": "zero-review", "0RR2": "zero-review-2nd", "S4": "review", "S4R2": "review-2nd", "HHH": "hreview"}
SCORED = [f"{b.replace('-', '/')}/{ARM[a]}" for b, v in json.load(open(HERE.parent / "round-judge" / "user-hsh.json")).items() for a in v["arms"]]
MAP = [("shake", "frame_jumps", "high", "shake"), ("recreate", "path_shown", "low", "choppy"), ("recreate", "text_jump_ratio", "high", "choppy"), ("rough", "isolated_change", "high", "choppy"),
       ("hidden", "hidden_controls", "high", "below"), ("hidden", "svg_visible", "low", "below"), ("hidden", "hidden_text", "high", "below"), ("hidden", "hidden_change", "high", "below"),
       ("no_anim", "smooth_px", "low", "freeze"), ("small", "svg_area", "low", "small"), ("fast", "speed_p90", "high", "fast")]
# a missing value means nothing moved / no SVG: ratios with no motion count as 0, a missing SVG counts as not visible and zero area
# except label-tracking metrics, where no moving SVG label means the check does not apply and the scene is left out
NA = {"path_shown", "text_jump_ratio"}
def one(v, m):
    if v in (None, "", "None"): return None if m in NA else 0.0
    return float(v)

args = sys.argv[1:]
EXCL = args[args.index("--exclude") + 1].split(",") if "--exclude" in args else []
tsvs = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] != "--exclude")]
reps = [{r["run"]: r for r in csv.DictReader(open(p), delimiter="\t")} for p in tsvs]
runs = set.intersection(*(set(r) for r in reps))
def val_rep(rep, run, m): return one(rep[run].get(m), m)
def val(run, m):
    xs = [x for x in (val_rep(r, run, m) for r in reps) if x is not None]
    return statistics.median(xs) if xs else None

L = {k: [x for x in v if not any(x.startswith(e + "/") for e in EXCL)] if isinstance(v, list) else v for k, v in L.items()}
SCORED = [x for x in SCORED if not any(x.startswith(e + "/") for e in EXCL)]
def key(k): return k.replace("/", "_")
_h = {}
def dedup(keys):
    seen, out = set(), []
    for k in keys:
        h = _h.setdefault(k, hashlib.md5(open(HERE.parent / "round-hsh" / k / "scene.html", "rb").read()).hexdigest())
        if h not in seen and key(k) in runs: seen.add(h); out.append(k)
    return out
clean = dedup(L["clean"])
bundle = lambda k: k.rsplit("/", 1)[0]
fails = lambda x, thr, d: x >= thr if d == "high" else x <= thr
def auc(pos, neg, d):
    s = sum((1 if (p > n if d == "high" else p < n) else 0.5 if p == n else 0) for p in pos for n in neg)
    return s / (len(pos) * len(neg)) if pos and neg else float("nan")
def fit(cv, allv, d): return next((v for v in allv if sum(fails(x, v, d) for x in cv) <= len(cv) // 10), None)

print(f"repeats {len(reps)}, clean {len(clean)} (after dedup), scored {len(dedup(SCORED))}\n")
print("type\tmetric\tdir\tthreshold\tclean_fail\tinj_detect\tlabel_recall\tAUC\tpass\tneg_fail\tLOBO_recall\tLOBO_neg_fail\tflips")
for typ, m, d, inj in MAP:
    cv = [x for x in (val(key(k), m) for k in clean) if x is not None]
    allv = sorted({x for x in (val(r, m) for r in runs) if x is not None}, reverse=(d == "low"))
    thr = fit(cv, allv, d)
    cf = sum(fails(x, thr, d) for x in cv)
    iv = [x for x in (val(f"{key(k)}+{inj}", m) for k in clean if f"{key(k)}+{inj}" in runs) if x is not None]
    det = sum(fails(x, thr, d) for x in iv) / len(iv)
    lab = [k for k in dedup(L[typ]) if val(key(k), m) is not None]; lv = [val(key(k), m) for k in lab]
    rec = sum(fails(x, thr, d) for x in lv); a = auc(lv, cv, d)
    ok = det >= 0.9 and (len(lv) < 3 or a >= 0.75)
    neg = [k for k in dedup(SCORED) if k not in L[typ] and val(key(k), m) is not None]
    nf = [k for k in neg if fails(val(key(k), m), thr, d)]
    lr = ln = ltot = lntot = 0
    for b in sorted({bundle(k) for k in lab + neg}):
        bt = fit([val(key(k), m) for k in clean if bundle(k) != b and val(key(k), m) is not None], allv, d)
        if bt is None: continue
        bl, bn = [k for k in lab if bundle(k) == b], [k for k in neg if bundle(k) == b]
        lr += sum(fails(val(key(k), m), bt, d) for k in bl); ltot += len(bl)
        ln += sum(fails(val(key(k), m), bt, d) for k in bn); lntot += len(bn)
    fl = sum(len({fails(x, thr, d) for x in (val_rep(r, key(k), m) for r in reps) if x is not None}) > 1 for k in dedup(SCORED)) if len(reps) > 1 else "-"
    print(f"{typ}\t{m}\t{d}\t{thr}\t{cf}/{len(cv)}\t{det:.2f} ({len(iv)})\t{rec}/{len(lv)}\t{a:.2f}\t{'PASS' if ok else 'fail'}\t{len(nf)}/{len(neg)}\t{lr}/{ltot}\t{ln}/{lntot}\t{fl}")
    missed = [k for k in lab if not fails(val(key(k), m), thr, d)]
    if missed: print(f"\t  missed labels: {', '.join(missed)}")
    if nf: print(f"\t  failed unlabelled: {', '.join(nf)}")
