"""events.py <capture.json> -> plain-text event list for the label judge (stdout).
Positions are viewport px, the same frame as the judge's 1280x800 screenshots. Only SVG shapes/text and visible text nodes are tracked
(measure.mjs collector), so HTML boxes that move without text are invisible here. Events of one kind that start in the same 100ms are merged."""
import sys, json, collections
VIS, MOVE, JUMP, CAP = 0.05, 1.0, 30.0, 60
ACT = {"key": "→ 키(다음 단계·쪽)", "choice": "예측 선택지 고름", "reveal": "정답 보기 누름", "step-offscreen": "화면 밖 단계 단추 누름",
       "own-next": "장면의 '다음' 단추 누름", "param": "매개변수 단추 누름", "nudge": "덱 확인 단추 누름"}

def s1(t): return f"{t / 1000:.1f}s"
def pt(x, y): return f"({x:.0f},{y:.0f})"
def names(ks, text, n=5):
    ls = [text[k] for k in ks if text.get(k)]
    return (" 글자: " + ", ".join(f"'{s}'" for s in ls[:n]) + (f" 외 {len(ls) - n}" if len(ls) > n else "")) if ls else ""

def page_events(S, text):
    t0 = S[0]["t"]; tr = collections.defaultdict(list)
    for s in S:
        for k, x, y, w, h, o, v in s["els"]: tr[k].append((s["t"], x + w / 2, y + h / 2, w, h, o, v))
    ev, initial = [], []
    for k, seq in tr.items():
        vis = [o >= VIS and v for _, _, _, _, _, o, v in seq]
        if vis[0] and seq[0][0] - t0 <= 300: initial.append(k)
        for i in range(len(seq)):
            t, cx, cy, w, h, o, v = seq[i]
            if vis[i] and (i == 0 and t - t0 > 300 or i and not vis[i - 1]):
                j = i
                while j + 1 < len(seq) and seq[j + 1][5] > seq[j][5] + 0.01: j += 1
                ev.append(("나타남", t, k, pt(cx, cy) + (f" {s1(seq[j][0] - t)}에 걸쳐 진해짐" if seq[j][0] - t >= 150 else " 바로")))
            if i and vis[i - 1] and not vis[i]: ev.append(("사라짐", t, k, pt(cx, cy) + (" 화면·잘림 밖으로" if o >= VIS else "")))
        if seq[-1][0] < S[-1]["t"] - 100 and vis[-1]: ev.append(("사라짐", seq[-1][0] + 50, k, pt(*seq[-1][1:3]) + " 요소가 지워짐"))
        i = 1
        while i < len(seq):
            d = ((seq[i][1] - seq[i - 1][1]) ** 2 + (seq[i][2] - seq[i - 1][2]) ** 2) ** 0.5
            if d <= MOVE or not (vis[i] or vis[i - 1]): i += 1; continue
            a, steps = i - 1, [d]
            while i + 1 < len(seq):
                d2 = ((seq[i + 1][1] - seq[i][1]) ** 2 + (seq[i + 1][2] - seq[i][2]) ** 2) ** 0.5
                if d2 <= MOVE: break
                steps.append(d2); i += 1
            p, q = seq[a], seq[i]
            kind = "순간 이동" if len(steps) == 1 and steps[0] >= JUMP else "이동"
            size = f" 크기 {p[3]:.0f}x{p[4]:.0f}→{q[3]:.0f}x{q[4]:.0f}" if abs(p[3] - q[3]) + abs(p[4] - q[4]) > 4 else ""
            ev.append((kind, p[0], k, f"{pt(p[1], p[2])}→{pt(q[1], q[2])} {s1(q[0] - p[0])}, 50ms당 최대 {max(steps):.0f}px{size}"))
            i += 1
    return t0, initial, ev

def main(path):
    d = json.load(open(path)); S = d["samples"]; out = []
    text = {}
    for s in S:
        for k, st, *_ in s["texts"]: text.setdefault(k, st[:20])
    svg_keys = {e[0] for s in S for e in s["els"]}
    segs = []
    for s in S:
        if not segs or s["page"] != segs[-1][0]: segs.append((s["page"], []))
        segs[-1][1].append(s)
    scroll = collections.defaultdict(bool)
    for f in d.get("frames", []): scroll[f["page"]] |= f["scroll"]
    acts = d.get("actions", [])
    for pg, ss in segs:
        t0, initial, ev = page_events(ss, text)
        out.append(f"## 쪽 {pg.replace(' ', '') or '1/1'} ({s1(t0)}–{s1(ss[-1]['t'])})" + (" · 이 쪽은 스크롤바가 생김" if scroll[pg] else ""))
        out.append(f"- 처음부터 보이는 그림 요소 {len(initial)}개" + names(initial, text, 8))
        seen, html = set(), []
        for s in ss:
            for k, st, y, fs, h, v in s["texts"]:
                if k in svg_keys or not v or (k, st) in seen: continue
                seen.add((k, st))
                if s["t"] - t0 > 300: html.append((s["t"], st))
        groups = collections.OrderedDict()
        for kind, t, k, desc in sorted(ev, key=lambda e: e[1]): groups.setdefault((kind, t // 100), []).append((t, k, desc))
        lines = [(a["t"], f"- {s1(a['t'])} 동작: {ACT.get(a['kind'], a['kind'])}") for a in acts if ss[0]["t"] <= a["t"] <= ss[-1]["t"]]
        lines += [(t, f"- {s1(t)} 글 나타남: '{st[:40]}'" + (f" ({len(st)}자)" if len(st) > 40 else "")) for t, st in html]
        for (kind, _), g in groups.items():
            ks = [k for _, k, _ in g]
            lines.append((g[0][0], f"- {s1(g[0][0])} {kind}: " + (g[0][2] if len(g) == 1 else f"요소 {len(g)}개, 첫 요소 {g[0][2]}") + names(ks, text)))
        lines.sort(key=lambda x: x[0])
        out += [l for _, l in lines[:CAP]] + ([f"- … 이후 {len(lines) - CAP}줄 생략"] if len(lines) > CAP else [])
    return "\n".join(out)

if __name__ == "__main__": print(main(sys.argv[1]))
