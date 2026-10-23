// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, circle, line, dot, label, rect, split } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, y];
  const RCITY = 10, WALK = 0.8;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  /** @type {{ r: number; a: number }[]} */
  const PEOPLE = [];
  while (PEOPLE.length < 600) { const r = -3.5 * Math.log(1 - rnd()); if (r > RCITY) continue; PEOPLE.push({ r, a: rnd() * 2 * Math.PI }); }
  const phases = PEOPLE.map(() => rnd());
  /** @param {number} n */
  const lineAngles = (n) => Array.from({ length: n }, (_, k) => -Math.PI / 2 + (2 * Math.PI * k) / n);
  /** @param {{ r: number; a: number }} p @param {number} n */
  const nearest = (p, n) => {
    let best = { d: p.r, a: 0, along: 0 };
    for (const a of lineAngles(n)) {
      const da = Math.abs((((p.a - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      const d = da < Math.PI / 2 ? p.r * Math.sin(da) : p.r;
      if (d < best.d) best = { d, a, along: da < Math.PI / 2 ? p.r * Math.cos(da) : 0 };
    }
    return best;
  };
  /** @param {number} r @param {number} a */
  const P = (r, a) => pt(r * Math.cos(a), -r * Math.sin(a));
  const RINGS = /** @type {[number, number, string][]} */ ([[0, 3, "도심 0–3km"], [3, 6, "중간 3–6km"], [6, 10, "외곽 6–10km"]]);
  const access = model({ lines: 2 }, ({ lines }) => {
    const ok = PEOPLE.map((p) => nearest(p, Number(lines)).d <= WALK);
    const ring = RINGS.map(([r0, r1]) => { const g = PEOPLE.map((p, i) => [p, ok[i]]).filter(([p]) => /** @type {{r:number}} */ (p).r >= r0 && /** @type {{r:number}} */ (p).r < r1); return g.filter(([, o]) => o).length / g.length; });
    return { share: ok.filter(Boolean).length / PEOPLE.length, ring, ok };
  }, "가상 도시 600점, 거주 밀도 지수 감소 척도 3.5km(Clark 1951), 도보 800m(1.3 m/s × 10분)");
  /** @type {import("ltt").Tone[]} */
  const tones = ["series1", "series2", "series3", "series4", "series5", "series6"];
  return {
    models: { access },
    figures: {
      map: figure(
        cartesian({ x: [-10.5, 10.5, "km"], y: [-10.5, 10.5, "km"], aspect: "equal", loop: { ms: 5000, span: [0, 1] } }),
        (m, t, { params }) => {
          const n = Number(params.lines);
          const ok = /** @type {boolean[]} */ (m.access.ok);
          return [
            circle(pt(0, 0), RCITY, { id: "city", fill: "soft", tone: "muted" }),
            circle(pt(0, 0), 3, { id: "ring3", tone: "ref", fill: "none" }),
            circle(pt(0, 0), 6, { id: "ring6", tone: "ref", fill: "none" }),
            lineAngles(n).map((a, i) => [
              line([pt(0, 0), P(RCITY, a)], { id: `band-${i}`, tone: tones[i % 6], opacity: 0.16, label: "역세권 800m" }),
              line([pt(0, 0), P(RCITY, a)], { id: `line-${i}`, tone: tones[i % 6], weight: "bold" }),
            ]),
            PEOPLE.map((p, i) => dot(P(p.r, p.a), { id: `p-${i}`, size: "s", tone: ok[i] ? "focus" : "muted", opacity: ok[i] ? 0.9 : 0.45 })),
            PEOPLE.map((p, i) => {
              if (!ok[i] || i % 2) return null;
              const nb = nearest(p, n), u = (t + phases[i]) % 1, a0 = P(p.r, p.a), a1 = P(nb.along, nb.a);
              let at;
              if (u < 0.25) { const f = u / 0.25; at = pt(a0[0] + (a1[0] - a0[0]) * f, a0[1] + (a1[1] - a0[1]) * f); }
              else { const f = (u - 0.25) / 0.75, e = f * f * (3 - 2 * f); at = P(nb.along * (1 - e), nb.a); }
              return dot(at, { id: `rider-${i}`, tone: "ref" });
            }),
            dot(pt(0, 0), { id: "cbd", size: "l", label: "도심 업무지구" }),
            label(pt(10.4, -10.4), "반경 10km · 점 하나 = 출근자 약 1,000명", { id: "scale", anchor: "se", size: "s" }),
          ];
        },
      ),
      bars: figure(
        cartesian({ x: [0, 100, "%"], y: [0, 4, ""], loop: { ms: 5000, span: [0, 1] } }),
        (m) => [
          label(pt(0, 3.7), `${Math.round(m.access.share * 100)}% 출근자가 역세권 안`, { id: "share", anchor: "w", size: "l" }),
          RINGS.map(([, , name], i) => {
            const f = m.access.ring[i], y = 2.6 - i;
            return [
              label(pt(0, y + 0.3), name, { id: `ring-name-${i}`, anchor: "w" }),
              rect(pt(0, y - 0.25), pt(100, y + 0.05), { id: `ring-bg-${i}`, tone: "muted", fill: "soft" }),
              rect(pt(0, y - 0.25), pt(100 * f, y + 0.05), { id: `ring-bar-${i}`, tone: "focus", fill: "solid" }),
              label(pt(100 * f + 2, y - 0.1), `${Math.round(f * 100)}%`, { id: `ring-val-${i}`, anchor: "w" }),
            ];
          }),
        ],
      ),
      s29: split(["map", "bars"], { link: "lines" }),
    },
    scenes: [{
      type: "explore", title: "방사형 노선을 늘릴수록 외곽 출근자가 먼저 역에 닿는다", say: "띠 안의 사람만 걸어서 노선에 오르고 도심으로 흐른다.",
      figure: "s29", focus: ["share"], knobs: { lines: ["1", "2", "4", "6", "8"] },
      goal: { say: "출근자의 3분의 2 이상이 역세권에 들게 한다", done: (m) => m.access.share >= 2 / 3 },
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s29", src: "s29-transit-access.html", corpus: "shot", domain: "도시 · 노선 수에 따른 출근 인구의 대중교통 접근성",
  props: [
    { id: "b1", cat: "E", text: "노선 띠 안의 점만 밝게 강조되고 입자가 노선을 따라 도심으로 흐른다", essential: true, why: "beat 1", status: "kept", by: "dot tone focus vs muted + opacity per model access.ok; rider dots positioned from loop t" },
    { id: "b2", cat: "T", text: "입자가 띠 안 출근자에서 출발해(걷기 25%) 노선을 타고 도심 쪽으로 계속 흐른다", essential: true, why: "beat 2", status: "kept", by: "Loop ms 5000 span [0,1]; draw sampled over time; rider position computed per t (two-leg path)" },
    { id: "b3", cat: "S", text: "띠 밖 점은 흐린 채 남고 오른쪽 비율 숫자·막대가 노선 수와 함께 고정된다", essential: true, why: "beat 3", status: "kept", by: "split: both share params and knobs; bars figure draws from m.access at current lines" },
    { id: "g1", cat: "G", text: "역세권 띠 폭은 노선에서 800m(도보 10분), 지도와 같은 축척", essential: true, why: "띠 안/밖 판정이 결론", status: "approx", diff: "line에는 data 단위 두께가 없어 띠 폭 1.6km를 축척대로 그리지 못하고 opacity 띠로만 표시한다(점의 강조 판정은 모델이 정확히 한다)" },
    { id: "p1", cat: "I", text: "한쪽 메커니즘(누가 흐르나), 다른 쪽 집계(몇 %)를 손잡이 하나(노선 수 1·2·4·6·8)로 함께 바꾼다", essential: true, why: "principle", status: "kept", by: "Explore knobs string[] choices; split 'Both share t, step, params, knobs'" },
  ],
  verdict: "V", custom: [], candidates: ["stroke-width-data", "buffer-band"],
}];
