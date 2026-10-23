// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, line, path, dot, circle, label, rect, split, math } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const kcl = model({ V: 12, R2: 6, R3: 3 }, ({ V, R2, R3 }) => ({ I2: V / R2, I3: V / R3, I1: V / R2 + V / R3 }), "옴의 법칙 I = V/R, 병렬 분기");
  // original px coords, y flipped; one dot = equal charge, every 3rd dot (n%3==1) takes R2
  const GAP = 40, SPEED = 120, CYCLE = 8;
  /** @type {import("ltt").P[]} */ const pre = [p(80, -430), p(80, -90), p(300, -90)];
  /** @type {import("ltt").P[]} */ const br2 = [p(300, -90), p(540, -90), p(540, -430), p(300, -430)];
  /** @type {import("ltt").P[]} */ const br3 = [p(300, -90), p(300, -430)];
  /** @type {import("ltt").P[]} */ const post = [p(300, -430), p(80, -430)];
  const len = (/** @type {import("ltt").P[]} */ q) => q.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - q[i][0], b[1] - q[i][1]), 0);
  const along = (/** @type {import("ltt").P[]} */ q, /** @type {number} */ s) => {
    for (let i = 1; i < q.length; i++) {
      const L = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
      if (s <= L) { const u = s / L; return p(q[i - 1][0] + (q[i][0] - q[i - 1][0]) * u, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * u); }
      s -= L;
    }
    return q[q.length - 1];
  };
  const Lpre = len(pre), Lpost = len(post);
  const passed = (/** @type {number} */ tt) => Math.max(0, Math.floor((SPEED * tt - Lpre) / GAP) + 1);
  const zig = (/** @type {number} */ x, /** @type {number} */ mid) => {
    /** @type {import("ltt").PathCmd[]} */ const c = [["M", x, mid + 40]];
    for (let i = 1; i <= 8; i++) c.push(["L", x + (i % 2 ? 14 : -14), mid + 40 - i * 10]);
    c.push(["L", x, mid - 40]);
    return c;
  };
  return {
    models: { kcl },
    figures: {
      circuit: figure(
        cartesian({ x: [40, 600, "px"], y: [-470, -50, "px"], aspect: "equal", loop: { ms: 8000, span: [0, 8] } }),
        (m, t) => {
          const head = SPEED * t, dots = [];
          for (let n = Math.floor(head / GAP); n >= 0 && dots.length < 70; n--) {
            const s0 = head - n * GAP, br = n % 3 === 1 ? br2 : br3, Lb = len(br);
            if (s0 > Lpre + Lb + Lpost) break;
            const q = s0 < Lpre ? along(pre, s0) : s0 < Lpre + Lb ? along(br, s0 - Lpre) : along(post, s0 - Lpre - Lb);
            dots.push(dot(q, { id: `q-${n}`, tone: "focus", size: "s" }));
          }
          const ph = ((SPEED * t - Lpre) / GAP) % 1, pulse = ph < 0 ? 0 : 1 - ph;
          return [
            line([p(80, -250), p(80, -90), p(540, -90), p(540, -180)], { id: "w1" }),
            line([p(540, -340), p(540, -430), p(80, -430), p(80, -290)], { id: "w2" }),
            line([p(540, -180), p(540, -220)], { id: "w2a" }), path(zig(540, -260), { id: "R2" }), line([p(540, -300), p(540, -340)], { id: "w2b" }),
            line([p(300, -90), p(300, -220)], { id: "w3a" }), path(zig(300, -260), { id: "R3" }), line([p(300, -300), p(300, -430)], { id: "w3b" }),
            line([p(50, -262), p(110, -262)], { id: "bat+", weight: "normal" }), line([p(64, -280), p(96, -280)], { id: "bat-", weight: "bold" }),
            line([p(80, -250), p(80, -262)], { id: "bw1" }), line([p(80, -280), p(80, -290)], { id: "bw2" }),
            label(p(126, -270), "12 V", { id: "vlabel", anchor: "w" }),
            label(p(328, -260), `R₃ = 3 Ω · I₃ = ${m.kcl.I3} A`, { id: "lab-R3", anchor: "w" }),
            label(p(568, -260), `R₂ = 6 Ω · I₂ = ${m.kcl.I2} A`, { id: "lab-R2", anchor: "w" }),
            label(p(170, -76), `I₁ = ${m.kcl.I1} A →`, { id: "lab-I1" }),
            dot(p(300, -90), { id: "A", label: "분기점 A" }), dot(p(300, -430), { id: "B", label: "합류점 B" }),
            pulse > 0 && circle(p(300, -90), 8 + 14 * (1 - pulse), { id: "A-pulse", tone: "focus", opacity: pulse }),
            dots,
          ];
        },
      ),
      ledger: figure(
        cartesian({ x: [0, 24, "점"], y: [0, 5, ""], loop: { ms: 8000, span: [0, 8] } }),
        (m, t) => {
          const tc = t % CYCLE, base = Math.floor(t / CYCLE) * CYCLE;
          const total = passed(base + tc) - passed(base), first = passed(base);
          let c2 = 0; for (let n = first; n < first + total; n++) if (n % 3 === 1) c2++;
          const v = [total, c2, total - c2], names = ["들어온 점 I₁", "R₂로 나간 점 I₂", "R₃로 나간 점 I₃"];
          return [
            label(p(0, 4.8), "분기점 A에서 센 점", { id: "ledger-title", anchor: "w", tone: "muted" }),
            v.map((x, i) => [
              label(p(0, 4.2 - i), `${names[i]}  ${x}`, { id: `cnt-${i}`, anchor: "w" }),
              rect(p(0, 3.8 - i), p(24, 3.9 - i), { id: `track-${i}`, tone: "muted", fill: "soft" }),
              x > 0 && rect(p(0, 3.8 - i), p(Math.min(24, x), 3.9 - i), { id: `bar-${i}`, tone: i ? "focus" : "ref", fill: "solid" }),
            ]),
            label(p(0, 0.9), `${total} = ${c2} + ${total - c2}`, { id: "eq", anchor: "w", size: "l" }),
            math(p(0, 0.3), String.raw`I_1 = I_2 + I_3 \;\cdot\; 6\,\mathrm{A} = 2\,\mathrm{A} + 4\,\mathrm{A}`, { id: "law", tone: "focus" }),
          ];
        },
      ),
      kcl: split(["circuit", "ledger"], { link: "A" }),
    },
    scenes: [{ type: "explain", title: "분기점에 들어온 전하는 갈래로 나뉠 뿐, 하나도 사라지지 않는다", say: "점 하나가 같은 양의 전하다. 오른쪽은 분기점 A를 지난 점을 센 장부다.", figure: "kcl", focus: ["A", "eq"] }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s04", src: "archive/v1:site/gallery/shots/s04-kirchhoff-junction.html", corpus: "shot", domain: "전기 회로",
  props: [
    { id: "b1", cat: "T", text: "0–2s 점들이 전원에서 도선을 따라 분기점 쪽으로 흐른다", essential: true, why: "beat 1", status: "kept", by: "dot positions computed along wire polylines from t; draw sampled over frame time" },
    { id: "b2", cat: "Q", text: "분기점에서 점이 1:2로 갈라지고 장부 막대가 쌓인다", essential: true, why: "beat 2", status: "kept", by: "n%3===1 → R2 branch (1:2); ledger rect widths = counts in 점 units" },
    { id: "b3", cat: "T", text: "갈라진 점들이 합류점에서 다시 합쳐지고 장부 숫자가 함께 오른다", essential: true, why: "beat 3", status: "kept", by: "post-branch polyline; split: 'Both share t'" },
    { id: "b4", cat: "T", text: "장부 '들어온 수 = 나간 수의 합'이 가득 찬 뒤 0부터 다시 센다", essential: true, why: "beat 4", status: "kept", by: "Loop span [0,8] repeats; eq label from t" },
    { id: "pr1", cat: "S", text: "흐름 그림 옆에 흐름을 세는 장부를 두어 매 순간 숫자로 맞는다", essential: true, why: "principle", status: "kept", by: "api.split JSDoc 'Both share t, step, params'; counts derived from same t formula as dots" },
    { id: "g1", cat: "G", text: "R2 갈래가 R3보다 길어 합류 뒤 점 간격이 고르다", essential: false, why: "원본 주석", status: "kept", by: "same polyline lengths in data units, aspect 'equal'" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
