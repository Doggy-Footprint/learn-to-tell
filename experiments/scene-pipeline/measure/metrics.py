"""metrics.py <measure.json>... -> one metric row per file (TSV on stdout).
Element positions are taken relative to the main SVG box and scaled to its width, so a moving or resizing frame (shake) is not counted as element motion.
Some scenes rebuild the SVG with innerHTML on every step, so DOM identity does not follow a shape; isolated_change uses identity-free box signatures instead.
Scenes are decks: sample pairs that span a page change are skipped, and first-screen measures are taken per page after it arrives."""
import sys, json, statistics, collections

SETTLE = 1500  # ms; the page reflows once when its scrollbar appears, so the frame is judged after this
FIGURE = 0.01  # share of the viewport; a smaller largest SVG is an icon, not the page's figure

def norm(s, x, y, w, h):
    ox, oy, sw = (s["svg"][0], s["svg"][1], s["svg"][2] or 1) if s["svg"] else (0, 0, 1000)
    k = 1000 / sw
    return (x - ox) * k, (y - oy) * k, w * k, h * k

def metrics(path):
    d = json.load(open(path)); S = d["samples"]; W, H = d["viewport"]
    out = {"run": path.split("/")[-1].removesuffix(".json"), "errors": len(d["errors"])}
    pages = [s.get("page", "") for s in S]; out["pages"] = len(set(pages))
    arrive, same = [], [True]
    for i, s in enumerate(S):
        if i == 0 or pages[i] != pages[i - 1]: arrive.append((pages[i], s["t"]))
        if i: same.append(pages[i] == pages[i - 1])
    # frame: main SVG box over time in content coordinates (window and deck-card scroll added back), same page and same SVG element only
    jumps = []
    for i in range(1, len(S)):
        a, b = S[i - 1], S[i]
        if not (same[i] and a["svg"] and b["svg"] and a.get("svgKey") == b.get("svgKey") and a["t"] >= SETTLE): continue
        ya, yb = a["svg"][1] + a["scrollY"] + a.get("stageY", 0), b["svg"][1] + b["scrollY"] + b.get("stageY", 0)
        jumps.append(max(abs(a["svg"][0] - b["svg"][0]), abs(ya - yb), abs(a["svg"][2] - b["svg"][2]), abs(a["svg"][3] - b["svg"][3])))
    out["frame_jumps"] = sum(j > 1 for j in jumps); out["frame_max_px"] = round(max(jumps + [0]), 1)
    # identity-free change: multiset of rounded normalized boxes + opacity per sample
    sig = [collections.Counter((round(a / 4), round(b / 4), round(c / 4), round(e / 4), round(o * 10)) for _, *xywh, o, _v in s["els"] for a, b, c, e in [norm(s, *xywh)]) for s in S]
    ch = [0] + [sum(((b - a) + (a - b)).values()) if same[i + 1] else 0 for i, (a, b) in enumerate(zip(sig, sig[1:]))]
    iso = sum(c for i, c in enumerate(ch) if c and (i == 0 or not ch[i - 1]) and (i + 1 == len(ch) or not ch[i + 1]))
    out["change"] = sum(ch); out["change_samples"] = sum(c > 0 for c in ch); out["isolated_change"] = round(iso / sum(ch), 2) if sum(ch) else None
    # element motion by DOM identity, relative to the SVG
    prev, steps = {}, {}
    for i, s in enumerate(S):
        if not same[i]: prev = {}
        cur = {}
        for k, x, y, w, h, o, _v in s["els"]:
            x, y, w, h = norm(s, x, y, w, h); c = (x + w / 2, y + h / 2, o); cur[k] = c
            if k in prev:
                p = prev[k]; steps.setdefault(k, []).append((((c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2) ** 0.5, abs(c[2] - p[2])))
        prev = cur
    travel = tele = fade = 0.0; moves = []
    for st in steps.values():
        ds = [a for a, _ in st]; fade += sum(b for _, b in st)
        for i, dd in enumerate(ds):
            if dd <= 0.5: continue
            travel += dd; moves.append(dd)
            if dd >= 8 and (i == 0 or ds[i - 1] < 0.5) and (i + 1 == len(ds) or ds[i + 1] < 0.5): tele += dd
    out["travel_px"] = round(travel); out["travel_per_change"] = round(travel / out["change"], 2) if out["change"] else None; out["teleport_ratio"] = round(tele / travel, 2) if travel else None; out["opacity_change"] = round(fade, 1)
    # smooth_px: travel made of consecutive small steps (a static or jump-only scene has ~0); speed_p90: per-50ms step size of moving elements
    out["smooth_px"] = round(travel - tele); out["speed_p90"] = round(sorted(moves)[int(0.9 * (len(moves) - 1))], 1) if moves else 0
    keys = [set(e[0] for e in s["els"]) for s in S]
    out["appear"] = sum(len(b - a) for i, (a, b) in enumerate(zip(keys, keys[1:])) if same[i + 1])
    # first screen per page: figure (largest SVG at least FIGURE of the viewport) 0.5s after arrival, text and controls 1s after arrival
    def at(pg, t0, dt): return next((s for s in S if s.get("page", "") == pg and s["t"] >= t0 + dt), None)
    vis_l, area_l, ht_l, hc_l, ctl = [], [], [], [], 0
    for pg, t0 in arrive:
        s05 = at(pg, t0, 500)
        if s05 and s05["svg"] and s05["svg"][2] * s05["svg"][3] >= FIGURE * W * H:
            x, y, w, h = s05["svg"]; vis = max(0, min(x + w, W) - max(x, 0)) * max(0, min(y + h, H) - max(y, 0))
            vis_l.append(vis / (w * h)); area_l.append(w * h / (W * H))
        s1 = at(pg, t0, 1000)
        if s1:
            tot = sum(len(t[1]) for t in s1["texts"])
            if tot: ht_l.append(sum(len(t[1]) for t in s1["texts"] if not t[5]) / tot)
            hc_l.append(sum(not c[2] for c in s1["controls"])); ctl = max(ctl, len(s1["controls"]))
    out["figure_pages"] = len(area_l)
    out["svg_visible"] = round(min(vis_l), 2) if vis_l else None; out["svg_area"] = round(statistics.median(area_l), 2) if area_l else None
    out["hidden_text"] = round(max(ht_l), 2) if ht_l else None
    # hidden change: element change that happens while the element is out of view
    hid = vis = 0
    for a, b in zip(S, S[1:]):
        pa = {e[0]: e for e in a["els"]}
        for e in b["els"]:
            p = pa.get(e[0]) if a.get("page") == b.get("page") else None
            if p and (abs(p[1] - e[1]) > 0.5 or abs(p[2] - e[2]) > 0.5 or abs(p[5] - e[5]) > 0.01): (vis := vis + 1) if e[6] else (hid := hid + 1)
    out["controls"] = ctl; out["hidden_controls"] = max(hc_l, default=0)
    out["hidden_change"] = round(hid / (hid + vis), 2) if hid + vis else None
    # text sizes: rendered height of SVG <text>, computed font-size for HTML text, at the last sample
    last = S[-1]; svg_keys = {e[0] for e in last["els"]}
    svg_h = [t[4] for t in last["texts"] if t[0] in svg_keys and t[5]]; html_px = [t[3] for t in last["texts"] if t[0] not in svg_keys and t[5]]
    out["svg_text_px"] = round(statistics.median(svg_h), 1) if svg_h else None; out["html_text_px"] = round(statistics.median(html_px), 1) if html_px else None
    # text pace: characters newly visible per second (max over 1s windows), skipping the first second of each page
    seen, new, t_arr = set(), [], 0
    for i, s in enumerate(S):
        if not same[i]: t_arr = s["t"]
        cur = {(t[0], t[1]) for t in s["texts"] if t[5]}
        new.append((s["t"], sum(len(x[1]) for x in cur - seen) if s["t"] >= t_arr + 1000 else 0)); seen = cur
    out["new_chars_max_1s"] = max((sum(n for t, n in new if t0 <= t < t0 + 1000) for t0, _ in new), default=0)
    out["new_chars_total"] = sum(n for _, n in new)
    return out

rows = [metrics(p) for p in sys.argv[1:]]
cols = list(rows[0])
print("\t".join(cols))
for r in rows: print("\t".join(str(r[c]) for c in cols))
