// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, arc, path, rect, dot, label } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const PH = [{ id: "G1", h: 11, d: "세포가 자란다" }, { id: "S", h: 8, d: "DNA를 복제한다" }, { id: "G2", h: 4, d: "분열을 준비한다" }, { id: "M", h: 1, d: "둘로 나뉜다" }];
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp = (/** @type {number} */ x) => Math.max(0, Math.min(1, x));
  const R = 1, CELL = 0.0035;
  /** clockwise from 12 o'clock, hours → degrees CCW from +x */
  const deg = (/** @type {number} */ h) => 90 - (h / 24) * 360;
  const cycle = model({ total: 24 }, () => ({ phases: PH, total: PH.reduce((a, q) => a + q.h, 0) }), "Alberts, Molecular Biology of the Cell: 사람 배양세포 G1 11, S 8, G2 4, M 1시간");
  return {
    models: { cycle },
    figures: {
      ring: figure(
        cartesian({
          x: [-1.5, 1.5, ""], y: [-1.5, 1.5, ""], aspect: "equal",
          // wall fractions G1 .30, S .25, G2 .17, M .28: M (1 h) gets 28% of 9 s
          loop: { ms: 9000, span: [0, 24], warp: [[0, 0], [11, 0.3], [19, 0.55], [23, 0.72], [24, 1]] },
        }),
        (m, t) => {
          let acc = 0, k = 0;
          const arcs = PH.map((q, i) => {
            const a0 = acc; acc += q.h;
            if (t >= a0 && t < acc) k = i;
            const mid = deg((a0 + acc) / 2) * Math.PI / 180;
            return [
              arc(p(0, 0), R, [deg(acc) + 0.7, deg(a0) - 0.7], { id: `arc-${q.id}`, tone: "muted", weight: "bold" }),
              i === k && arc(p(0, 0), R, [deg(acc) + 0.7, deg(a0) - 0.7], { id: `hi-${q.id}`, tone: "focus", weight: "bold" }),
              label(p(1.2 * Math.cos(mid), 1.2 * Math.sin(mid)), `${q.id} · ${q.h}시간 · ${q.d}`, { id: `lab-${q.id}`, tone: i === k ? "focus" : undefined }),
            ];
          });
          if (t >= 24) k = 3;
          const start = PH.slice(0, k).reduce((a, q) => a + q.h, 0);
          const local = clamp((t - start) / PH[k].h);
          let rad = 70, b = 70, pinch = 0, dup = 0, align = 0, split = 0, e3 = 0;
          if (k === 0) { rad = 62 + 26 * ease(local); b = rad; }
          else if (k === 1) { rad = b = 88; dup = ease(local); }
          else if (k === 2) { rad = 88 + 8 * ease(local); b = rad; dup = 1; }
          else {
            dup = 1; const e1 = ease(clamp(local / 0.35)), e2 = ease(clamp((local - 0.35) / 0.45)); e3 = ease(clamp((local - 0.85) / 0.15));
            align = e1; split = e2; rad = 96 + 34 * e2; b = 96 - 20 * e2; pinch = 0.92 * e2;
            if (e3 > 0) { rad = 130 - 68 * e3; b = 76 - 14 * e3; pinch = 0.92 * (1 - e3); }
          }
          /** @type {import("ltt").PathCmd[]} */
          const cell = [];
          for (let j = 0; j <= 72; j++) {
            const th = (j / 72) * 2 * Math.PI, sn = Math.sin(th);
            cell.push([j ? "L" : "M", CELL * rad * Math.cos(th), CELL * b * sn * (1 - pinch * sn * sn)]);
          }
          cell.push(["Z"]);
          const base = [[-28, -22], [-8, 14], [14, -18], [30, 10]];
          const chroms = [];
          for (let i = 0; i < 8; i++) {
            const j = i % 4, sister = i >= 4;
            let [x, y] = base[j];
            x = x * (1 - align); y = y * (1 - align) + (j - 1.5) * 30 * align;
            x += (sister ? 1 : -1) * (dup * 4 + split * 52);
            const show = sister ? (k === 3 && e3 > 0 ? 1 - e3 : dup) : 1;
            if (show > 0) chroms.push(rect(p(CELL * (x - 3), CELL * (y - 13)), p(CELL * (x + 3), CELL * (y + 13)), { id: `chrom-${i}`, tone: sister ? "focus" : "ref", fill: "solid", opacity: show }));
          }
          const ang = deg(Math.min(t, 24)) * Math.PI / 180;
          const dna = k === 0 ? "DNA 1배 (2n)" : k === 1 ? `DNA ${(1 + dup).toFixed(1)}배 복제 중` : k === 2 ? "DNA 2배 (4n)" : local < 0.85 ? "염색체가 두 극으로 나뉜다" : "딸세포 하나, 다시 G1";
          return [
            arcs,
            path(cell, { id: "cell", fill: "soft", tone: "focus" }),
            k === 3 && split > 0.1 && split < 1 && api.line([p(0, -CELL * (b + 6)), p(0, CELL * (b + 6))], { id: "furrow", dash: true, weight: "thin", opacity: split }),
            chroms,
            dot(p(R * Math.cos(ang), R * Math.sin(ang)), { id: "phase-dot", tone: "focus" }),
            label(p(0, -0.55), dna, { id: "dna" }),
            label(p(0, -1.45), "고리 길이는 실제 시간 비율 · M기는 느리게 재생", { id: "note", tone: "muted" }),
          ];
        },
      ),
    },
    scenes: [{ type: "hook", title: "23시간 준비, 1시간 분열", say: "세포 주기의 점이 고리를 돌 때마다 가운데 세포의 모양이 바뀐다.", figure: "ring", focus: ["phase-dot", "cell"] }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s01", src: "archive/v1:site/gallery/shots/s01-cell-cycle.html", corpus: "shot", domain: "생물",
  props: [
    { id: "b1", cat: "T", text: "0–3s 점이 G1 호를 따라 돌고 그 호만 진해지며 세포가 커진다", essential: true, why: "beat 1", status: "kept", by: "figure draw is sampled over the frame's time; dot/arc focus/path radius computed from t" },
    { id: "b2", cat: "T", text: "S기: 염색체가 둘로 복제되고 DNA 1→2배 숫자가 오른다", essential: true, why: "beat 2", status: "kept", by: "rect opacity from t + label Text computed per t" },
    { id: "b3", cat: "T", text: "M기만 느리게 재생: 염색체가 가운데 줄을 섰다가 양극으로 갈라진다", essential: true, why: "beat 3", status: "kept", by: "Loop.warp gives M (23–24 h) 28% of wall time; JSDoc 'slower parts are marked slow-motion'" },
    { id: "b4", cat: "T", text: "세포가 잘록해져 둘로 나뉜 뒤 딸세포 하나로 줄며 처음으로 돌아간다", essential: true, why: "beat 4", status: "kept", by: "path cmds computed per t (pinch); loop repeats span" },
    { id: "pr1", cat: "Q", text: "고리 둘레는 실제 시간 비율(11:8:4:1)", essential: true, why: "principle", status: "kept", by: "arc degrees in data units on aspect: 'equal' frame; degrees = h/24·360" },
    { id: "pr2", cat: "X", text: "짧은 단계만 재생을 늘리고 '느리게 재생'이라고 밝힌다", essential: true, why: "principle", status: "kept", by: "Loop.warp JSDoc 'slower parts are marked slow-motion' + label mark 'note'" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
